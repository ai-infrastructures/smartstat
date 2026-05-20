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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Poi, Tenant } from "@smartstat/shared";
import {
  getTenant,
  listBuildingsForTenant,
  searchPois,
  logSearchEvent,
} from "../../lib/data";
import { isPositionFresh, useUserPosition } from "../../lib/userPosition";
import { categoryColor, colors, fontSize, radius, spacing } from "../../lib/theme";

export default function HospitalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userPos = useUserPosition();
  const posFresh = isPositionFresh(userPos) && userPos?.tenantId === id;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [results, setResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t] = await Promise.all([getTenant(id!), listBuildingsForTenant(id!)]);
        if (!active) return;
        setTenant(t);
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
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: tenant.name,
          headerStyle: { backgroundColor: accent },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff", fontSize: 17, fontWeight: "600" },
        }}
      />
      <View style={[styles.banner, { backgroundColor: accent }]}>
        <Text style={styles.bannerTitle}>{tenant.name}</Text>
        <Text style={styles.bannerSubtitle}>
          {tenant.branding.appDisplayName}
        </Text>
        {posFresh ? (
          <View style={styles.locatedPill}>
            <Text style={styles.locatedText}>
              📍 You are here · anchor {userPos?.anchorCode}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.scanFromHospital}
            onPress={() => router.push("/scan")}
          >
            <Text style={styles.scanFromHospitalText}>
              ⬛  Scan a QR to find &quot;You are here&quot;
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchBox}>
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
        {searching && (
          <ActivityIndicator
            size="small"
            style={styles.searchSpinner}
            color={accent}
          />
        )}
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
            onPress={() => router.push(`/navigate/${item.id}`)}
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
        <Text style={styles.rowSubtitle}>
          {poi.category.replace("_", " ")}
          {poi.accessibility.wheelchairAccessible ? "  ·  ♿" : ""}
        </Text>
      </View>
      <Text style={[styles.rowArrow, { color: accent }]}>›</Text>
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
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  scanFromHospitalText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  locatedPill: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
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
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
  rowSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  rowArrow: { fontSize: 24, marginLeft: spacing.md },
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
