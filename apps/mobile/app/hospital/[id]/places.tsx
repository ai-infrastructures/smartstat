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
import type { Poi, PoiCategory, Tenant } from "@smartstat/shared";
import {
  getTenant,
  logSearchEvent,
  searchPois,
} from "../../../lib/data";
import { hapticLight } from "../../../lib/haptics";
import {
  categoryColor,
  colors,
  fontSize,
  radius,
  spacing,
} from "../../../lib/theme";

/**
 * "Places" tab — destination browser.
 *
 * Layout:
 *  - Search bar at top
 *  - Quick category chips (Restroom, Exit, Emergency, Elevator, ...)
 *  - Filtered POI list, grouped visually by category dot
 */

const QUICK_CATEGORIES: { key: PoiCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "restroom", label: "Restroom", icon: "droplet" },
  { key: "exit", label: "Exit", icon: "log-out" },
  { key: "emergency", label: "Emergency", icon: "alert-octagon" },
  { key: "elevator", label: "Elevator", icon: "chevrons-up" },
  { key: "pharmacy", label: "Pharmacy", icon: "plus-square" },
  { key: "cafeteria", label: "Food", icon: "coffee" },
];

export default function PlacesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PoiCategory | null>(null);
  const [allPois, setAllPois] = useState<Poi[]>([]);
  const [results, setResults] = useState<Poi[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await getTenant(id!);
        if (!active) return;
        setTenant(t);
        const initial = await searchPois({ tenantId: id!, query: "" });
        if (active) {
          setAllPois(initial);
          setResults(initial);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Filter when query or category changes
  useEffect(() => {
    let active = true;
    (async () => {
      setSearching(true);
      try {
        let base: Poi[];
        if (query.trim().length > 0) {
          base = await searchPois({ tenantId: id!, query });
          if (tenant && query.trim().length > 1) {
            logSearchEvent({ tenantId: tenant.id, query }).catch(() => {});
          }
        } else {
          base = allPois;
        }
        const filtered = activeCategory
          ? base.filter((p) => p.category === activeCategory)
          : base;
        if (active) setResults(filtered);
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, query, activeCategory, allPois, tenant]);

  const onPoiTap = useCallback(
    (poiId: string) => {
      hapticLight();
      router.push(`/navigate/${poiId}`);
    },
    [router]
  );

  const accent = tenant?.branding.primaryColor ?? colors.primary;
  const countsByCategory = useMemo(() => {
    const m: Partial<Record<PoiCategory, number>> = {};
    for (const p of allPois) m[p.category] = (m[p.category] ?? 0) + 1;
    return m;
  }, [allPois]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Places</Text>
        <Text style={styles.subtitle}>Pick a destination</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={colors.textSubtle} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rooms, services, departments…"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator size="small" color={accent} />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Feather name="x-circle" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            activeCategory === null && {
              backgroundColor: accent,
              borderColor: accent,
            },
          ]}
          onPress={() => setActiveCategory(null)}
        >
          <Text
            style={[
              styles.chipText,
              activeCategory === null && { color: "#fff" },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {QUICK_CATEGORIES.filter(
          (c) => (countsByCategory[c.key] ?? 0) > 0
        ).map((c) => {
          const active = activeCategory === c.key;
          const color = categoryColor[c.key] ?? categoryColor.other;
          return (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.chip,
                active && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() =>
                setActiveCategory(active ? null : c.key)
              }
            >
              <Feather
                name={c.icon}
                size={12}
                color={active ? "#fff" : color}
              />
              <Text
                style={[
                  styles.chipText,
                  active && { color: "#fff" },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PoiRow poi={item} accent={accent} onPress={() => onPoiTap(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map-pin" size={28} color={colors.textSubtle} />
            <Text style={styles.emptyText}>
              {query.length > 0
                ? `No results for "${query}"`
                : "No places available"}
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
        <View style={styles.rowMeta}>
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.text },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
  rowMeta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  rowSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
});
