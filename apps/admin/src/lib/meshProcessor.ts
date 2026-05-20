/**
 * Server-side .glb → 2D floor plan PNG.
 *
 * Strategy (computationally cheap, no external services):
 *  1. Parse the GLB with @gltf-transform/core
 *  2. Walk every primitive's triangles, applying parent transforms
 *  3. Filter triangles whose vertices fall inside a horizontal slice
 *     ~1.0–2.0 m above the floor (where walls cut)
 *  4. Project the surviving triangle EDGES to XZ (top-down)
 *  5. Rasterize the edges to a PNG via Sharp + an SVG buffer
 *
 * The result is a recognisable line-drawing of the floor's walls —
 * usable as the background image overlay in the admin POI editor.
 *
 * Robust to:
 *  - GLBs that put their "up" axis on Y or Z (we detect bbox shape)
 *  - Coarse meshes with too many tris (we cap output edges)
 */
import {
  WebIO,
  type Document,
  type Node,
  type Primitive,
  type Scene,
} from "@gltf-transform/core";
import sharp from "sharp";

interface XYZ {
  x: number;
  y: number;
  z: number;
}

interface ProcessedPlan {
  pngBuffer: Buffer;
  widthMeters: number;
  depthMeters: number;
  edgeCount: number;
}

const TARGET_WIDTH_PX = 2048;
const MAX_EDGES = 20000; // safety cap to keep SVG small

/**
 * Multiply a vec3 by a 4x4 matrix (column-major, gltf convention).
 */
function applyMat4(v: XYZ, m: Float32Array | number[]): XYZ {
  const x = v.x;
  const y = v.y;
  const z = v.z;
  // m[0..15] in column-major
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  return {
    x: (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w,
    y: (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w,
    z: (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w,
  };
}

/**
 * Multiply two 4x4 matrices (column-major).
 */
function multiplyMat4(a: number[], b: number[]): number[] {
  const r = new Array<number>(16).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + i]! * b[j * 4 + k]!;
      r[j * 4 + i] = s;
    }
  }
  return r;
}

function identityMat4(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/**
 * Walk the scene graph and return every triangle in world space.
 * Returns flat array of [v0, v1, v2, v0, v1, v2, ...].
 */
async function collectTriangles(doc: Document): Promise<XYZ[]> {
  const tris: XYZ[] = [];

  function visit(node: Node, parentMat: number[]) {
    const localMat = node.getMatrix() as unknown as number[];
    const worldMat = multiplyMat4(parentMat, Array.from(localMat));

    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        addPrimitive(prim, worldMat);
      }
    }
    for (const child of node.listChildren()) {
      visit(child, worldMat);
    }
  }

  function addPrimitive(prim: Primitive, mat: number[]) {
    const positionAcc = prim.getAttribute("POSITION");
    if (!positionAcc) return;
    const positions = positionAcc.getArray();
    if (!positions) return;
    const indicesAcc = prim.getIndices();
    const indices = indicesAcc ? indicesAcc.getArray() : null;
    const triangleCount = indices
      ? indices.length / 3
      : positions.length / 9;
    for (let t = 0; t < triangleCount; t++) {
      const i0 = indices ? (indices[t * 3] as number) : t * 3;
      const i1 = indices ? (indices[t * 3 + 1] as number) : t * 3 + 1;
      const i2 = indices ? (indices[t * 3 + 2] as number) : t * 3 + 2;
      const v0: XYZ = {
        x: positions[i0 * 3] as number,
        y: positions[i0 * 3 + 1] as number,
        z: positions[i0 * 3 + 2] as number,
      };
      const v1: XYZ = {
        x: positions[i1 * 3] as number,
        y: positions[i1 * 3 + 1] as number,
        z: positions[i1 * 3 + 2] as number,
      };
      const v2: XYZ = {
        x: positions[i2 * 3] as number,
        y: positions[i2 * 3 + 1] as number,
        z: positions[i2 * 3 + 2] as number,
      };
      tris.push(applyMat4(v0, mat));
      tris.push(applyMat4(v1, mat));
      tris.push(applyMat4(v2, mat));
    }
  }

  for (const scene of doc.getRoot().listScenes() as Scene[]) {
    for (const node of scene.listChildren()) {
      visit(node, identityMat4());
    }
  }
  return tris;
}

/**
 * Compute the bounding box of every triangle.
 */
function computeBBox(tris: XYZ[]) {
  let xMin = Infinity,
    yMin = Infinity,
    zMin = Infinity;
  let xMax = -Infinity,
    yMax = -Infinity,
    zMax = -Infinity;
  for (const v of tris) {
    if (v.x < xMin) xMin = v.x;
    if (v.y < yMin) yMin = v.y;
    if (v.z < zMin) zMin = v.z;
    if (v.x > xMax) xMax = v.x;
    if (v.y > yMax) yMax = v.y;
    if (v.z > zMax) zMax = v.z;
  }
  return { xMin, yMin, zMin, xMax, yMax, zMax };
}

/**
 * Decide which axis is vertical ("up") by picking the dimension with the
 * smallest extent. In most LiDAR scans of a building, the vertical axis
 * spans 2.5–4 m, while horizontal axes span 10–100 m.
 */
function detectVerticalAxis(bbox: ReturnType<typeof computeBBox>): "x" | "y" | "z" {
  const dx = bbox.xMax - bbox.xMin;
  const dy = bbox.yMax - bbox.yMin;
  const dz = bbox.zMax - bbox.zMin;
  const min = Math.min(dx, dy, dz);
  if (min === dx) return "x";
  if (min === dy) return "y";
  return "z";
}

interface EdgeSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/**
 * Slice all triangles at a horizontal band (wall height) and project their
 * edges to a 2D plane. Returns 2D edges in world meters.
 */
function sliceWalls(
  tris: XYZ[],
  bbox: ReturnType<typeof computeBBox>,
  upAxis: "x" | "y" | "z"
): { edges: EdgeSegment[]; widthM: number; depthM: number } {
  // Pick the two horizontal axes
  const horiz: ("x" | "y" | "z")[] =
    upAxis === "x" ? ["y", "z"] : upAxis === "y" ? ["x", "z"] : ["x", "y"];

  const get = (v: XYZ, k: "x" | "y" | "z") => v[k];
  const upMin =
    upAxis === "x" ? bbox.xMin : upAxis === "y" ? bbox.yMin : bbox.zMin;
  const upMax =
    upAxis === "x" ? bbox.xMax : upAxis === "y" ? bbox.yMax : bbox.zMax;
  const floor = upMin;
  // Slice between 0.9m and 2.0m above the floor — that's where walls are
  // (above doors, below ceilings).
  const sliceLow = floor + 0.9;
  const sliceHigh = Math.min(floor + 2.2, upMax - 0.2);

  const hMinA =
    horiz[0] === "x" ? bbox.xMin : horiz[0] === "y" ? bbox.yMin : bbox.zMin;
  const hMaxA =
    horiz[0] === "x" ? bbox.xMax : horiz[0] === "y" ? bbox.yMax : bbox.zMax;
  const hMinB =
    horiz[1] === "x" ? bbox.xMin : horiz[1] === "y" ? bbox.yMin : bbox.zMin;
  const hMaxB =
    horiz[1] === "x" ? bbox.xMax : horiz[1] === "y" ? bbox.yMax : bbox.zMax;
  const widthM = hMaxA - hMinA;
  const depthM = hMaxB - hMinB;

  const edges: EdgeSegment[] = [];

  // For each triangle, if any edge has BOTH vertices inside the wall band,
  // emit it. This keeps near-vertical wall faces and drops floor/ceiling.
  for (let i = 0; i < tris.length; i += 3) {
    const v0 = tris[i]!;
    const v1 = tris[i + 1]!;
    const v2 = tris[i + 2]!;

    const u0 = get(v0, upAxis);
    const u1 = get(v1, upAxis);
    const u2 = get(v2, upAxis);

    const inBand0 = u0 >= sliceLow && u0 <= sliceHigh;
    const inBand1 = u1 >= sliceLow && u1 <= sliceHigh;
    const inBand2 = u2 >= sliceLow && u2 <= sliceHigh;

    const tryPush = (a: XYZ, b: XYZ) => {
      const ax = get(a, horiz[0]!) - hMinA;
      const ay = get(a, horiz[1]!) - hMinB;
      const bx = get(b, horiz[0]!) - hMinA;
      const by = get(b, horiz[1]!) - hMinB;
      // Drop very short edges (mesh noise)
      const dx = bx - ax;
      const dy = by - ay;
      if (dx * dx + dy * dy < 0.0004) return;
      edges.push({ ax, ay, bx, by });
    };

    if (inBand0 && inBand1) tryPush(v0, v1);
    if (inBand1 && inBand2) tryPush(v1, v2);
    if (inBand2 && inBand0) tryPush(v2, v0);
  }

  // If we got way too many edges, decimate uniformly
  if (edges.length > MAX_EDGES) {
    const step = Math.ceil(edges.length / MAX_EDGES);
    const decimated: EdgeSegment[] = [];
    for (let i = 0; i < edges.length; i += step) decimated.push(edges[i]!);
    return { edges: decimated, widthM, depthM };
  }

  return { edges, widthM, depthM };
}

/**
 * Build an SVG document from the 2D edges and rasterize it to PNG via Sharp.
 */
async function rasterizeEdges(
  edges: EdgeSegment[],
  widthM: number,
  depthM: number
): Promise<{ pngBuffer: Buffer; widthPx: number; heightPx: number }> {
  const aspect = depthM / Math.max(widthM, 0.0001);
  const widthPx = TARGET_WIDTH_PX;
  const heightPx = Math.max(64, Math.round(widthPx * aspect));

  const scaleX = widthPx / widthM;
  const scaleY = heightPx / depthM;

  // Build SVG path string
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">`
  );
  parts.push(`<rect width="${widthPx}" height="${heightPx}" fill="#ffffff"/>`);
  parts.push(
    `<g stroke="#1e293b" stroke-width="1.4" stroke-linecap="round" opacity="0.85">`
  );
  for (const e of edges) {
    const ax = (e.ax * scaleX).toFixed(2);
    const ay = (heightPx - e.ay * scaleY).toFixed(2);
    const bx = (e.bx * scaleX).toFixed(2);
    const by = (heightPx - e.by * scaleY).toFixed(2);
    parts.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>`);
  }
  parts.push(`</g></svg>`);
  const svg = parts.join("");

  const pngBuffer = await sharp(Buffer.from(svg), { density: 144 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { pngBuffer, widthPx, heightPx };
}

/**
 * Full pipeline: GLB bytes → PNG buffer + meters dimensions.
 */
export async function generateFloorPlanFromGlb(
  glbBuffer: Buffer
): Promise<ProcessedPlan> {
  const io = new WebIO();
  // gltf-transform expects a Uint8Array, not a Node Buffer literal in some
  // versions — copy explicitly to be safe across runtimes.
  const data = new Uint8Array(
    glbBuffer.buffer,
    glbBuffer.byteOffset,
    glbBuffer.byteLength
  );
  const doc = await io.readBinary(data);

  const tris = await collectTriangles(doc);
  if (tris.length === 0) {
    throw new Error("No triangles found in mesh");
  }

  const bbox = computeBBox(tris);
  const upAxis = detectVerticalAxis(bbox);
  const { edges, widthM, depthM } = sliceWalls(tris, bbox, upAxis);

  if (edges.length === 0) {
    throw new Error(
      "No walls detected in the height slice. Mesh may be partial or oriented unexpectedly."
    );
  }

  const { pngBuffer } = await rasterizeEdges(edges, widthM, depthM);

  return {
    pngBuffer,
    widthMeters: widthM,
    depthMeters: depthM,
    edgeCount: edges.length,
  };
}
