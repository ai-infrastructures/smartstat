import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { Floor, NavNode, Poi, Tenant } from "@smartstat/shared";
import {
  getFloorBundle,
  getFloorPlanUrl,
  getTenant,
  listBuildingsForTenant,
  listFloorsForBuilding,
  searchPois,
} from "../../../lib/data";
import {
  isPositionFresh,
  shouldRescan,
  useUserPosition,
} from "../../../lib/userPosition";
import { useDeadReckoning } from "../../../lib/deadReckoning";
import { hapticLight } from "../../../lib/haptics";
import {
  categoryColor,
  colors,
  fontSize,
  radius,
  spacing,
} from "../../../lib/theme";

/**
 * Hospital "Map" tab — primary home view.
 *
 * Layout (top to bottom):
 *  - Brand-colored header (slim) with hospital name
 *  - Search bar (tap → goes to Places tab pre-focused)
 *  - Status banner: "You are here" pill OR "Tap on map / Scan QR" CTAs
 *  - Full-bleed live floor SVG with user pin + tappable POIs
 *  - Floating "Scan QR" FAB bottom-right
 *
 * Tapping any POI opens its directions page.
 */
export default function HospitalMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userPos = useUserPosition();
  const posFresh = isPositionFresh(userPos) && userPos?.tenantId === id;
  useDeadReckoning(isPositionFresh(userPos));

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [nodes, setNodes] = useState<NavNode[]>([]);
  const [planUrl, setPlanUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenant + first published floor + plan
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await getTenant(id!);
        if (!active) return;
        setTenant(t);
        const buildings = await listBuildingsForTenant(id!);
        if (!active || buildings.length === 0) {
          setLoading(false);
          return;
        }
        const floors = await listFloorsForBuilding(buildings[0]!.id);
        // Prefer the floor where the user is (if any) over the default
        let target = floors[0] ?? null;
        if (posFresh && userPos) {
          const match = floors.find((f) => f.id === userPos.floorId);
          if (match) target = match;
        }
        if (!target) {
          setLoading(false);
          return;
        }
        const bundle = await getFloorBundle(target.id);
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
  }, [id, posFresh, userPos]);

  const onTapSearch = useCallback(() => {
    // expo-router: switch to Places tab
    router.push(`/hospital/${id}/places`);
  }, [router, id]);

  const onPoiTap = useCallback(
    (poiId: string) => {
      hapticLight();
      router.push(`/navigate/${poiId}`);
    },
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  const accent = tenant?.branding.primaryColor ?? colors.primary;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: accent }]}>
        <Text style={styles.hospital}>{tenant?.name ?? "Hospital"}</Text>
        {floor && <Text style={styles.floorLabel}>{floor.name}</Text>}
      </View>

      {/* Search bar (top, tappable, navigates to Places) */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.85}
        onPress={onTapSearch}
      >
        <Feather name="search" size={18} color={colors.textSubtle} />
        <Text style={styles.searchPlaceholder}>
          Where do you want to go?
        </Text>
      </TouchableOpacity>

      {/* Position banner */}
      {posFresh ? (
        <View
          style={[
            styles.positionBanner,
            shouldRescan(userPos)
              ? { backgroundColor: "#fef3c7" }
              : { backgroundColor: "#d1fae5" },
          ]}
        >
          <Feather
            name="map-pin"
            size={14}
            color={shouldRescan(userPos) ? "#92400e" : "#065f46"}
          />
          <Text
            style={[
              styles.positionText,
              shouldRescan(userPos)
                ? { color: "#92400e" }
                : { color: "#065f46" },
            ]}
          >
            {shouldRescan(userPos)
              ? "Position uncertain — relocate"
              : `You are here · ${userPos?.anchorCode}`}
          </Text>
          {floor && (
            <TouchableOpacity
              onPress={() => router.push(`/locate/${floor.id}`)}
              hitSlop={8}
            >
              <Text style={[styles.positionRelocate, { color: accent }]}>
                Move
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.ctaRow}>
          {floor && (
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: accent }]}
              onPress={() => router.push(`/locate/${floor.id}`)}
              activeOpacity={0.85}
            >
              <Feather name="map-pin" size={14} color="#fff" />
              <Text style={styles.ctaText}>Tap on map</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.cta, styles.ctaSecondary]}
            onPress={() => router.push(`/hospital/${id}/scan`)}
            activeOpacity={0.85}
          >
            <Feather name="maximize" size={14} color={accent} />
            <Text style={[styles.ctaText, { color: accent }]}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapWrap}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {floor ? (
          <MapView
            floor={floor}
            pois={pois}
            planUrl={planUrl}
            userPos={
              posFresh && userPos?.floorId === floor.id
                ? userPos
                : null
            }
            onPoiTap={onPoiTap}
          />
        ) : (
          <View style={styles.center}>
            <Feather name="map" size={40} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>No published floor</Text>
            <Text style={styles.emptyBody}>
              Ask the hospital staff to publish a floor in the admin.
            </Text>
          </View>
        )}
      </View>

      {/* Floating Scan QR FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={() => router.push(`/hospital/${id}/scan`)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Scan a QR code"
      >
        <Feather name="maximize" size={20} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function MapView({
  floor,
  pois,
  planUrl,
  userPos,
  onPoiTap,
}: {
  floor: Floor;
  pois: Poi[];
  planUrl: string | null;
  userPos: ReturnType<typeof useUserPosition>;
  onPoiTap: (poiId: string) => void;
}) {
  const bbox = floor.bbox ?? [0, 0, 60, 40];
  const [xMin, yMin, xMax, yMax] = bbox;
  const w = xMax - xMin;
  const h = yMax - yMin;
  const pad = Math.max(w, h) * 0.05;
  const worldY = (y: number) => yMax + yMin - y;

  return (
    <Svg
      viewBox={`${xMin - pad} ${yMin - pad} ${w + 2 * pad} ${h + 2 * pad}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {planUrl && (
        <SvgImage
          href={planUrl}
          x={xMin}
          y={yMin}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid slice"
          opacity={0.55}
        />
      )}
      <Rect
        x={xMin}
        y={yMin}
        width={w}
        height={h}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={0.15}
      />

      {/* POIs */}
      {pois.map((p) => {
        const color = categoryColor[p.category] ?? categoryColor.other;
        return (
          <G
            key={p.id}
            onPress={() => onPoiTap(p.id)}
          >
            <Circle
              cx={p.position.x}
              cy={worldY(p.position.y)}
              r={0.9}
              fill={color}
              stroke="#fff"
              strokeWidth={0.2}
            />
            <SvgText
              x={p.position.x}
              y={worldY(p.position.y) - 1.4}
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

      {/* User pin */}
      {userPos && (
        <G>
          <Circle
            cx={userPos.x}
            cy={worldY(userPos.y)}
            r={Math.max(2.2, userPos.uncertaintyM)}
            fill="rgba(16,185,129,0.20)"
          />
          <Circle
            cx={userPos.x}
            cy={worldY(userPos.y)}
            r={1.2}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={0.3}
          />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  hospital: { color: "#fff", fontSize: fontSize.xl, fontWeight: "700" },
  floorLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: -18,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchPlaceholder: {
    color: colors.textSubtle,
    fontSize: fontSize.base,
  },
  positionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  positionText: { fontSize: fontSize.xs, fontWeight: "700", flex: 1 },
  positionRelocate: { fontSize: fontSize.xs, fontWeight: "700" },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  cta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  ctaSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: fontSize.sm },
  mapWrap: {
    flex: 1,
    marginTop: spacing.md,
    backgroundColor: "#f1f5f9",
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: "#fef3c7",
    margin: spacing.lg,
    borderRadius: radius.md,
  },
  errorText: { color: "#92400e", fontSize: fontSize.sm },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
