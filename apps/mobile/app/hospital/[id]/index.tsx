import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { Poi, Tenant } from "@smartstat/shared";
import {
  getTenant,
  listBuildingsForTenant,
  listFloorsForBuilding,
  searchPois,
  logSearchEvent,
} from "../../../lib/data";
import type { Floor } from "@smartstat/shared";
import { isPositionFresh, useUserPosition } from "../../../lib/userPosition";
import { hapticLight } from "../../../lib/haptics";
import {
  categoryColor,
  colors,
  fontSize,
  radius,
  spacing,
} from "../../../lib/theme";

export default function HospitalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userPos = useUserPosition();
  const posFresh = isPositionFresh(userPos) && userPos?.tenantId === id;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [firstFloorId, setFirstFloorId] = useState<string | null>(null);
  const [results, setResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, buildings] = await Promise.all([
          getTenant(id!),
          listBuildingsForTenant(id!),
        ]);
        if (!active) return;
        setTenant(t);
        // Resolve the first published floor across all buildings — used
        // as the canvas for the "tap to locate" screen.
        if (buildings.length > 0) {
          const floors = await listFloorsForBuilding(buildings[0]!.id);
          if (active && floors.length > 0) {
            setFirstFloorId(floors[0]!.id);
          }
        }
        // Initial: show all POIs for the tenant
        const initial = await searchPois({ tenantId: id!, query: "" });
        if (!active) return;
        setResults(initial);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const onChange = useCallback(
    async (q: string) => {
      setQuery(q);
      if (!tenant) return;
      try {
        setSearching(true);
        const data = await searchPois({ tenantId: tenant.id, query: q });
        setResults(data);
        if (q.trim().length > 0) {
          // fire-and-forget analytics
          logSearchEvent({ tenantId: tenant.id, query: q }).catch(() => {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [tenant]
  );

  const accent = tenant?.branding.primaryColor ?? colors.primary;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ActivityIndicator style={styles.center} color={accent} />
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <Text style={styles.errorText}>Hospital not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.banner, { backgroundColor: accent }]}>
        <Text style={styles.bannerTitle}>{tenant.name}</Text>
        <Text style={styles.bannerSubtitle}>
          {tenant.branding.appDisplayName}
        </Text>
        {posFresh ? (
          <View style={styles.locatedPill}>
            <Feather name="map-pin" size={14} color="#fff" />
            <Text style={styles.locatedText}>
              You are here · {userPos?.anchorCode}
            </Text>
          </View>
        ) : (
          <View style={styles.locateCtaRow}>
            {firstFloorId && (
              <TouchableOpacity
                style={styles.locateCta}
                onPress={() => router.push(`/locate/${firstFloorId}`)}
                activeOpacity={0.85}
              >
                <Feather name="map-pin" size={14} color="#fff" />
                <Text style={styles.scanFromHospitalText}>
                  Tap on map
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.locateCta}
              onPress={() => router.push(`/hospital/${id}/scan`)}
              activeOpacity={0.85}
            >
              <Feather name="maximize" size={14} color="#fff" />
              <Text style={styles.scanFromHospitalText}>Scan a QR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.searchBox}>
        <Feather
          name="search"
          size={18}
          color={colors.textSubtle}
          style={styles.searchLeadIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search a department, room, service…"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={onChange}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator
            size="small"
            style={styles.searchSpinner}
            color={accent}
          />
        ) : query.length > 0 ? (
          <TouchableOpacity
            style={styles.searchSpinner}
            onPress={() => onChange("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Feather name="x-circle" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PoiRow
            poi={item}
            accent={accent}
            onPress={() => {
              hapticLight();
              router.push(`/navigate/${item.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query.length > 0 ? `No results for “${query}”` : "No POIs available"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function PoiRow({
  poi,
  accent,
  onPress,
}: {
  poi: Poi;
  accent: string;
  onPress: () => void;
}) {
  const color = categoryColor[poi.category] ?? categoryColor.other;
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: color + "20" }]}>
        <View style={[styles.rowDot, { backgroundColor: color }]} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{poi.displayName}</Text>
        <View style={styles.rowSubtitleRow}>
          <Text style={styles.rowSubtitle}>
            {poi.category.replace("_", " ")}
          </Text>
          {poi.accessibility.wheelchairAccessible && (
            <Feather
              name="check-circle"
              size={11}
              color={colors.success}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  scanFromHospital: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  locateCtaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  locateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  scanFromHospitalText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  locatedPill: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.95)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  locatedText: { color: "#fff", fontSize: fontSize.sm, fontWeight: "700" },
  searchBox: {
    marginHorizontal: spacing.xl,
    marginTop: -16,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchLeadIcon: { marginLeft: spacing.lg, marginRight: -8 },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.base,
    color: colors.text,
  },
  searchSpinner: { marginRight: spacing.md },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: fontSize.base, fontWeight: "600", color: colors.text },
  rowSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  rowSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  empty: { padding: spacing.xxl, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
  errorBox: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    backgroundColor: "#fef3c7",
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  errorText: { color: "#92400e", fontSize: fontSize.sm },
});
