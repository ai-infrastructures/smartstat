import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, {
  Circle,
  Image as SvgImage,
  Line,
  Rect,
  G,
  Text as SvgText,
} from "react-native-svg";
import type { Floor, NavNode, Poi } from "@smartstat/shared";
import {
  getFloorBundle,
  getFloorPlanUrl,
} from "../../lib/data";
import { setManualPosition } from "../../lib/userPosition";
import { hapticSuccess } from "../../lib/haptics";
import {
  categoryColor,
  colors,
  fontSize,
  radius,
  spacing,
} from "../../lib/theme";

/**
 * Manual locate-on-map screen.
 *
 * The user sees the floor plan (with POIs as reference) and taps where
 * they are standing. We snap to the nearest existing nav_node so the
 * pathfinder has a real starting point — the user's exact pixel-perfect
 * tap is irrelevant, what matters is which graph node they're at.
 */
export default function LocateScreen() {
  const { floorId } = useLocalSearchParams<{ floorId: string }>();
  const router = useRouter();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [nodes, setNodes] = useState<NavNode[]>([]);
  const [planUrl, setPlanUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingPoint, setPendingPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const layoutRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const bundle = await getFloorBundle(floorId!);
        if (!active) return;
        setFloor(bundle.floor);
        setPois(bundle.pois);
        setNodes(bundle.nodes);
        if (bundle.floor?.floorplan2dUrl) {
          getFloorPlanUrl(bundle.floor.floorplan2dUrl).then((u) => {
            if (active) setPlanUrl(u);
          });
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
  }, [floorId]);

  const bbox = floor?.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  const pad = Math.max(width, height) * 0.05;
  const viewMinX = xMin - pad;
  const viewMinY = yMin - pad;
  const viewW = width + 2 * pad;
  const viewH = height + 2 * pad;

  const worldY = (y: number) => yMax + yMin - y;

  /** Convert a touch on the View to floor-world coordinates. */
  const onMapPress = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      const { width: w, height: h } = layoutRef.current;
      if (!w || !h) return;
      // SVG preserveAspectRatio=xMidYMid meet → letterboxed
      const scale = Math.min(w / viewW, h / viewH);
      const offsetX = (w - viewW * scale) / 2;
      const offsetY = (h - viewH * scale) / 2;
      const svgX = (locationX - offsetX) / scale + viewMinX;
      const svgY = (locationY - offsetY) / scale + viewMinY;
      const worldXVal = svgX;
      // Y was flipped via worldY(); invert
      const worldYVal = yMax + yMin - svgY;
      // Clamp inside the floor bbox
      const clampedX = Math.min(Math.max(worldXVal, xMin), xMax);
      const clampedY = Math.min(Math.max(worldYVal, yMin), yMax);
      setPendingPoint({ x: clampedX, y: clampedY });
    },
    [viewMinX, viewMinY, viewW, viewH, xMin, yMin, xMax, yMax]
  );

  /** Snap pending tap to the nearest nav_node. */
  const snappedNode = useMemo(() => {
    if (!pendingPoint || nodes.length === 0) return null;
    let best: NavNode | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const dx = n.position.x - pendingPoint.x;
      const dy = n.position.y - pendingPoint.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }, [pendingPoint, nodes]);

  function confirm() {
    if (!floor || !snappedNode) return;
    setManualPosition({
      tenantId: snappedNode.poiId
        ? // We need tenantId — best source is the floor we just loaded.
          // floors row doesn't expose tenantId in the mobile shape, but the
          // bundle already validated it. Use floor.buildingId as proxy and
          // rely on RLS in the next operation. For now, fetch via the same
          // pattern as the scanner upload.
          ""
        : "",
      buildingId: floor.buildingId,
      floorId: floor.id,
      x: snappedNode.position.x,
      y: snappedNode.position.y,
      anchorNodeId: snappedNode.id,
    });
    // Pull tenantId from the floor row directly (async-friendly)
    void (async () => {
      const { supabase } = await import("../../lib/supabase/client");
      const { data } = await supabase
        .from("floors")
        .select("tenant_id")
        .eq("id", floor.id)
        .maybeSingle();
      if (data?.tenant_id) {
        setManualPosition({
          tenantId: data.tenant_id as string,
          buildingId: floor.buildingId,
          floorId: floor.id,
          x: snappedNode.position.x,
          y: snappedNode.position.y,
          anchorNodeId: snappedNode.id,
        });
      }
    })();

    hapticSuccess();
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !floor) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errText}>{error ?? "Floor not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Where are you?</Text>
          <Text style={styles.subtitle}>
            Tap on the floor plan where you are standing.
          </Text>
        </View>
      </View>

      <View
        style={styles.mapWrap}
        onLayout={(e) => {
          layoutRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onMapPress}
      >
        <Svg
          viewBox={`${viewMinX} ${viewMinY} ${viewW} ${viewH}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        >
          {planUrl && (
            <SvgImage
              href={planUrl}
              x={xMin}
              y={yMin}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.6}
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
            strokeDasharray="0.5 0.3"
          />
          {/* POI dots for orientation */}
          {pois.map((p) => {
            const c = categoryColor[p.category] ?? categoryColor.other;
            return (
              <G key={p.id}>
                <Circle
                  cx={p.position.x}
                  cy={worldY(p.position.y)}
                  r={0.6}
                  fill={c}
                  stroke="#fff"
                  strokeWidth={0.15}
                />
                <SvgText
                  x={p.position.x}
                  y={worldY(p.position.y) - 1.2}
                  fontSize={1}
                  textAnchor="middle"
                  fontWeight={600}
                  fill="#0f172a"
                >
                  {p.displayName}
                </SvgText>
              </G>
            );
          })}
          {/* Pending tap → preview pin */}
          {pendingPoint && (
            <G>
              <Circle
                cx={pendingPoint.x}
                cy={worldY(pendingPoint.y)}
                r={1.8}
                fill="rgba(16,185,129,0.25)"
              />
              <Circle
                cx={pendingPoint.x}
                cy={worldY(pendingPoint.y)}
                r={1}
                fill="#10b981"
                stroke="#fff"
                strokeWidth={0.3}
              />
              {snappedNode && (
                <Line
                  x1={pendingPoint.x}
                  y1={worldY(pendingPoint.y)}
                  x2={snappedNode.position.x}
                  y2={worldY(snappedNode.position.y)}
                  stroke="#10b981"
                  strokeWidth={0.2}
                  strokeDasharray="0.4 0.4"
                />
              )}
              {snappedNode && (
                <Circle
                  cx={snappedNode.position.x}
                  cy={worldY(snappedNode.position.y)}
                  r={0.5}
                  fill="#0f172a"
                />
              )}
            </G>
          )}
        </Svg>
      </View>

      {pendingPoint && (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomLabel}>
            Position will snap to nearest waypoint
          </Text>
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setPendingPoint(null)}
            >
              <Text style={styles.cancelText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirm}
              disabled={!snappedNode}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.confirmText}>I am here</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errText: { color: colors.danger },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  closeBtn: { padding: spacing.sm, borderRadius: radius.md },
  title: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  mapWrap: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  bottomBar: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  bottomLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
  bottomRow: { flexDirection: "row", gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  confirmText: { color: "#fff", fontSize: fontSize.base, fontWeight: "700" },
});
