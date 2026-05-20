import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { Floor } from "@smartstat/shared";
import { listFloorsForScanner } from "../../lib/data";
import { useMe } from "../../lib/auth";
import { colors, fontSize, radius, spacing } from "../../lib/theme";

/**
 * Scanner workspace home.
 *
 * Lists all floors the signed-in operator can manage. RLS already filters
 * to the operator's tenant. From here they pick a floor to upload a scan.
 */
export default function ScannerHomeScreen() {
  const router = useRouter();
  const { me, loading: authLoading } = useMe();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listFloorsForScanner();
      setFloors(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load floors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (me) load();
  }, [me, load]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!me) {
    return <Redirect href="/account/login" />;
  }

  const canScan =
    me.role === "scanner_operator" ||
    me.role === "tenant_admin" ||
    me.role === "tenant_editor" ||
    me.role === "super_admin";

  if (!canScan) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.center}>
          <Feather name="alert-circle" size={28} color={colors.warning} />
          <Text style={styles.errTitle}>Access denied</Text>
          <Text style={styles.errBody}>
            Your account ({me.role.replace("_", " ")}) does not have permission
            to upload scans. Ask your tenant administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner workspace</Text>
        <Text style={styles.subtitle}>
          Pick a floor to upload its LiDAR scan (.glb from Polycam).
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={floors}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push(`/scanner/${item.id}`)}
          >
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                {item.level >= 0 ? `+${item.level}` : item.level}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                Level {item.level}
                {item.bbox &&
                  ` · ${(item.bbox[2] - item.bbox[0]).toFixed(0)} × ${(
                    item.bbox[3] - item.bbox[1]
                  ).toFixed(0)} m`}
              </Text>
            </View>
            <StatusPill status={item.scanStatus} />
            <Feather
              name="chevron-right"
              size={18}
              color={colors.textSubtle}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="layers" size={28} color={colors.textSubtle} />
              <Text style={styles.emptyTitle}>No floors available</Text>
              <Text style={styles.emptyBody}>
                Your tenant admin needs to create floors first.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    draft: { bg: "#f1f5f9", fg: "#475569" },
    scanning: { bg: "#fef3c7", fg: "#92400e" },
    uploaded: { bg: "#dbeafe", fg: "#1d4ed8" },
    in_review: { bg: "#ede9fe", fg: "#6d28d9" },
    published: { bg: "#d1fae5", fg: "#065f46" },
    archived: { bg: "#f1f5f9", fg: "#94a3b8" },
  };
  const c = palette[status] ?? palette.draft;
  return (
    <View
      style={[styles.pill, { backgroundColor: c.bg }]}
    >
      <Text style={[styles.pillText, { color: c.fg }]}>
        {status.replace("_", " ")}
      </Text>
    </View>
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
  errTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  errBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
    gap: spacing.md,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: {
    fontFamily: "monospace",
    fontWeight: "700",
    color: colors.text,
  },
  rowTitle: { fontSize: fontSize.base, fontWeight: "600", color: colors.text },
  rowSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorBox: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: "#fef3c7",
    borderRadius: radius.md,
  },
  errorText: { color: "#92400e", fontSize: fontSize.sm },
  empty: {
    alignItems: "center",
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
});
