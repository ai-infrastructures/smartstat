import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import Svg, {
  Circle,
  Image as SvgImage,
  Line,
  Polyline,
  Rect,
  G,
  Text as SvgText,
} from "react-native-svg";
import {
  findPath,
  type Poi,
  type Floor,
  type NavNode,
  type NavEdge,
  type Route,
} from "@smartstat/shared";
import {
  getFloor,
  getFloorGraph,
  getFloorPlanUrl,
  getPoi,
  listFloorsForBuilding,
  listPoisForFloor,
} from "../../lib/data";
import { isPositionFresh, useUserPosition } from "../../lib/userPosition";
import { categoryColor, colors, fontSize, radius, spacing } from "../../lib/theme";

export default function NavigateScreen() {
  const { poiId } = useLocalSearchParams<{ poiId: string }>();
  const router = useRouter();
  const userPos = useUserPosition();
  const [destination, setDestination] = useState<Poi | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [siblingFloors, setSiblingFloors] = useState<Floor[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [nodes, setNodes] = useState<NavNode[]>([]);
  const [edges, setEdges] = useState<NavEdge[]>([]);
  const [startPoiId, setStartPoiId] = useState<string | null>(null);
  const [wheelchair, setWheelchair] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const dest = await getPoi(poiId!);
        if (!active) return;
        if (!dest) throw new Error("Destination not found");
        setDestination(dest);

        const fl = await getFloor(dest.floorId);
        if (!active) return;
        setFloor(fl);

        if (fl?.buildingId) {
          listFloorsForBuilding(fl.buildingId)
            .then((floors) => {
              if (active) setSiblingFloors(floors);
            })
            .catch(() => {});
        }

        if (fl?.floorplan2dUrl) {
          getFloorPlanUrl(fl.floorplan2dUrl).then((u) => {
            if (active) setFloorPlanUrl(u);
          });
        }

        const [poisList, graph] = await Promise.all([
          listPoisForFloor(dest.floorId),
          getFloorGraph(dest.floorId),
        ]);
        if (!active) return;
        setPois(poisList);
        setNodes(graph.nodes);
        setEdges(graph.edges);

        // If we have a fresh scanned QR position on the same floor, start from there.
        // Otherwise default to the first 'entrance' POI on the floor.
        if (
          isPositionFresh(userPos) &&
          userPos?.floorId === dest.floorId
        ) {
          // We don't have a POI id for the QR anchor (it's a nav node).
          // Synthesize: find the nav node by exact (x,y) and treat its id as start.
          // The pathfinder works on node ids; we'll wire startNode directly.
          // For the UI default toggle we still need a label, so we don't set startPoiId.
        } else {
          const entrance = poisList.find((p) => p.category === "entrance");
          if (entrance) setStartPoiId(entrance.id);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [poiId]);

  const poiToNode = useMemo(() => {
    const m = new Map<string, NavNode>();
    for (const n of nodes) if (n.poiId) m.set(n.poiId, n);
    return m;
  }, [nodes]);

  // Determine start node id:
  //  1. If we have a fresh scanned QR on this floor → use the anchor node directly
  //  2. Otherwise fall back to the selected start POI's attached nav node
  const startNodeId = useMemo(() => {
    if (
      isPositionFresh(userPos) &&
      destination &&
      userPos?.floorId === destination.floorId
    ) {
      return userPos.anchorNodeId;
    }
    if (startPoiId) {
      return poiToNode.get(startPoiId)?.id ?? null;
    }
    return null;
  }, [userPos, destination, startPoiId, poiToNode]);

  const route: Route | null = useMemo(() => {
    if (!startNodeId || !destination) return null;
    const goalNode = poiToNode.get(destination.id);
    if (!goalNode) return null;
    return findPath(startNodeId, goalNode.id, nodes, edges, {
      wheelchairAccessible: wheelchair,
    });
  }, [startNodeId, destination, poiToNode, nodes, edges, wheelchair]);

  // Speak the route every time it changes (and voice is on)
  useEffect(() => {
    if (!voiceOn || !route) return;
    speakRoute(route);
    return () => {
      Speech.stop();
    };
  }, [route, voiceOn]);

  const onChangeStart = useCallback(() => {
    // simple cycling between candidates for now (entrances/QR-anchored)
    const candidates = pois.filter(
      (p) => p.category === "entrance" || p.category === "elevator"
    );
    if (candidates.length === 0) return;
    const currentIdx = candidates.findIndex((c) => c.id === startPoiId);
    const next = candidates[(currentIdx + 1) % candidates.length];
    if (next) setStartPoiId(next.id);
  }, [pois, startPoiId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !destination || !floor) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? "Unable to load"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startPoi = pois.find((p) => p.id === startPoiId);
  const usingScannedQR =
    isPositionFresh(userPos) && userPos?.floorId === destination.floorId;
  const destColor = categoryColor[destination.category] ?? categoryColor.other;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Destination header */}
      <View style={styles.destBar}>
        <View style={[styles.destDot, { backgroundColor: destColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.destLabel}>Destination</Text>
          <Text style={styles.destName}>{destination.displayName}</Text>
        </View>
        {route && (
          <View style={styles.routeStats}>
            <Text style={styles.routeDistance}>
              {route.totalDistanceMeters.toFixed(0)}m
            </Text>
            <Text style={styles.routeDuration}>
              ~{Math.round(route.estimatedDurationSeconds / 60)}min
            </Text>
          </View>
        )}
      </View>

      {/* Start selector */}
      <TouchableOpacity
        style={styles.startBar}
        onPress={usingScannedQR ? () => router.push("/scan") : onChangeStart}
      >
        <View
          style={[
            styles.startIcon,
            usingScannedQR && { backgroundColor: "rgba(16,185,129,0.2)" },
          ]}
        >
          <Text
            style={[
              styles.startIconText,
              usingScannedQR && { color: "#10b981" },
            ]}
          >
            {usingScannedQR ? "📍" : "▶"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.startLabel}>Starting from</Text>
          <Text style={styles.startName}>
            {usingScannedQR
              ? `QR anchor ${userPos?.anchorCode}`
              : startPoi?.displayName ?? "Tap to set start point"}
          </Text>
        </View>
        <Text style={styles.startChange}>
          {usingScannedQR ? "Rescan" : "Change"}
        </Text>
      </TouchableOpacity>

      {/* Floor chip strip (only if building has multiple published floors) */}
      {siblingFloors.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.floorStrip}
        >
          {siblingFloors.map((sf) => {
            const isCurrent = sf.id === floor.id;
            return (
              <View
                key={sf.id}
                style={[
                  styles.floorChip,
                  isCurrent && styles.floorChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.floorChipLevel,
                    isCurrent && styles.floorChipLevelActive,
                  ]}
                >
                  {sf.level >= 0 ? `+${sf.level}` : sf.level}
                </Text>
                <Text
                  style={[
                    styles.floorChipName,
                    isCurrent && styles.floorChipNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {sf.name}
                </Text>
                {isCurrent && (
                  <Text style={styles.floorChipDest}>destination</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Accessibility & voice toggles */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>♿ Wheelchair accessible</Text>
        <Switch
          value={wheelchair}
          onValueChange={setWheelchair}
          trackColor={{ false: "#cbd5e1", true: colors.primary }}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🔊 Voice guidance</Text>
        <Switch
          value={voiceOn}
          onValueChange={(v) => {
            setVoiceOn(v);
            if (!v) Speech.stop();
            else if (route) speakRoute(route);
          }}
          trackColor={{ false: "#cbd5e1", true: colors.primary }}
        />
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <FloorSvg
          floor={floor}
          pois={pois}
          nodes={nodes}
          edges={edges}
          destinationPoiId={destination.id}
          startPoiId={startPoiId}
          route={route}
          floorPlanUrl={floorPlanUrl}
          userPosition={
            isPositionFresh(userPos) && userPos?.floorId === floor.id
              ? { x: userPos.x, y: userPos.y }
              : null
          }
        />
      </View>

      {/* Step-by-step */}
      <ScrollView style={styles.stepsBox} contentContainerStyle={styles.stepsContent}>
        <Text style={styles.stepsTitle}>Step by step</Text>
        {route ? (
          route.steps.map((s) => (
            <View key={s.index} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s.instruction}</Text>
            </View>
          ))
        ) : startPoiId ? (
          <Text style={styles.errorText}>
            No route available with current constraints.
          </Text>
        ) : (
          <Text style={styles.stepText}>Pick a starting point above.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function speakRoute(route: Route) {
  Speech.stop();
  // Build a single concatenated utterance so it reads as a coherent sequence.
  // Native TTS engines handle pauses around punctuation.
  const text = route.steps
    .map((s, i) =>
      i === 0
        ? `${s.instruction}.`
        : i === route.steps.length - 1
        ? `Finally, ${s.instruction.toLowerCase()}.`
        : `Then, ${s.instruction.toLowerCase()}.`
    )
    .join(" ");
  Speech.speak(text, {
    language: "en-US",
    rate: 1.0,
    pitch: 1.0,
  });
}

function FloorSvg({
  floor,
  pois,
  nodes,
  edges,
  destinationPoiId,
  startPoiId,
  route,
  floorPlanUrl,
  userPosition,
}: {
  floor: Floor;
  pois: Poi[];
  nodes: NavNode[];
  edges: NavEdge[];
  destinationPoiId: string;
  startPoiId: string | null;
  route: Route | null;
  floorPlanUrl: string | null;
  userPosition: { x: number; y: number } | null;
}) {
  const bbox = floor.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  const pad = Math.max(width, height) * 0.06;
  const worldY = (y: number) => yMax + yMin - y;

  const routeNodes = useMemo(() => {
    if (!route) return [];
    const m = new Map(nodes.map((n) => [n.id, n]));
    return route.nodeIds
      .map((id) => m.get(id))
      .filter((n): n is NavNode => Boolean(n));
  }, [route, nodes]);

  return (
    <Svg
      viewBox={`${xMin - pad} ${yMin - pad} ${width + 2 * pad} ${
        height + 2 * pad
      }`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {floorPlanUrl && (
        <SvgImage
          href={floorPlanUrl}
          x={xMin}
          y={yMin}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          opacity={0.55}
        />
      )}

      <Rect
        x={xMin}
        y={yMin}
        width={width}
        height={height}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={0.15}
        strokeDasharray="0.5,0.3"
      />

      {edges.map((e) => {
        const from = nodes.find((n) => n.id === e.fromNodeId);
        const to = nodes.find((n) => n.id === e.toNodeId);
        if (!from || !to) return null;
        return (
          <Line
            key={e.id}
            x1={from.position.x}
            y1={worldY(from.position.y)}
            x2={to.position.x}
            y2={worldY(to.position.y)}
            stroke="#cbd5e1"
            strokeWidth={0.15}
            opacity={0.6}
          />
        );
      })}

      {routeNodes.length > 1 && (
        <Polyline
          fill="none"
          stroke={colors.routeHighlight}
          strokeWidth={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={routeNodes
            .map((n) => `${n.position.x},${worldY(n.position.y)}`)
            .join(" ")}
        />
      )}

      {/* User position pin (from QR scan) */}
      {userPosition && (
        <G>
          <Circle
            cx={userPosition.x}
            cy={worldY(userPosition.y)}
            r={2.2}
            fill="rgba(16,185,129,0.25)"
          />
          <Circle
            cx={userPosition.x}
            cy={worldY(userPosition.y)}
            r={1.2}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={0.3}
          />
          <SvgText
            x={userPosition.x}
            y={worldY(userPosition.y) - 1.8}
            fontSize={1.2}
            textAnchor="middle"
            fontWeight={700}
            fill="#065f46"
          >
            You are here
          </SvgText>
        </G>
      )}

      {pois.map((p) => {
        const c = categoryColor[p.category] ?? categoryColor.other;
        const isStart = startPoiId === p.id;
        const isEnd = destinationPoiId === p.id;
        return (
          <G key={p.id}>
            <Circle
              cx={p.position.x}
              cy={worldY(p.position.y)}
              r={isStart || isEnd ? 1.2 : 0.7}
              fill={c}
              stroke={isStart || isEnd ? "#0f172a" : "#ffffff"}
              strokeWidth={isStart || isEnd ? 0.3 : 0.15}
            />
            <SvgText
              x={p.position.x}
              y={worldY(p.position.y) - 1.3}
              fontSize={1.1}
              textAnchor="middle"
              fontWeight={600}
              fill="#0f172a"
            >
              {p.displayName}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  destBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  destDot: { width: 14, height: 14, borderRadius: 7 },
  destLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  destName: { color: colors.text, fontSize: fontSize.lg, fontWeight: "600" },
  routeStats: { alignItems: "flex-end" },
  routeDistance: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
  },
  routeDuration: { fontSize: fontSize.xs, color: colors.textMuted },
  startBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  startIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  startIconText: { color: colors.primary, fontSize: 14 },
  startLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  startName: { color: colors.text, fontSize: fontSize.base, fontWeight: "500" },
  startChange: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "600" },
  floorStrip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  floorChip: {
    minWidth: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  floorChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  floorChipLevel: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  floorChipLevelActive: { color: "#fff" },
  floorChipName: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  floorChipNameActive: { color: "rgba(255,255,255,0.85)" },
  floorChipDest: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: { fontSize: fontSize.sm, color: colors.text },
  mapWrap: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "#f1f5f9",
  },
  stepsBox: {
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  stepsContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  stepsTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "700" },
  stepText: { flex: 1, color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
});
