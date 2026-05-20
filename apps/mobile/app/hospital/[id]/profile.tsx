import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { Building, Tenant } from "@smartstat/shared";
import {
  getFloorBundle,
  getTenant,
  listBuildingsForTenant,
  listFloorsForBuilding,
} from "../../../lib/data";
import { colors, fontSize, radius, spacing } from "../../../lib/theme";
import { IS_TENANT_LOCKED } from "../../../lib/tenantConfig";
import { signOut, useMe } from "../../../lib/auth";

export default function HospitalInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { me } = useMe();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, b] = await Promise.all([
          getTenant(id!),
          listBuildingsForTenant(id!),
        ]);
        if (!active) return;
        setTenant(t);
        setBuildings(b);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading || !tenant) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  const accent = tenant.branding.primaryColor;
  const supportEmail = tenant.branding.supportEmail;
  const supportPhone = tenant.branding.supportPhone;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: accent }]}>
          <Text style={styles.heroTitle}>{tenant.name}</Text>
          <Text style={styles.heroSubtitle}>
            {tenant.branding.appDisplayName}
          </Text>
        </View>

        {/* Buildings */}
        <Section title="Buildings">
          {buildings.length === 0 ? (
            <Text style={styles.muted}>No buildings registered.</Text>
          ) : (
            buildings.map((b) => (
              <View key={b.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{b.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {b.address.street}
                    {b.address.street ? ", " : ""}
                    {b.address.city}
                    {b.address.state ? `, ${b.address.state}` : ""}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {b.floorCount} {b.floorCount === 1 ? "floor" : "floors"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>

        {/* Support */}
        {(supportEmail || supportPhone) && (
          <Section title="Support">
            {supportEmail && (
              <SupportRow
                iconName="mail"
                label="Email"
                value={supportEmail}
                onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
                accent={accent}
              />
            )}
            {supportPhone && (
              <SupportRow
                iconName="phone"
                label="Phone"
                value={supportPhone}
                onPress={() => Linking.openURL(`tel:${supportPhone}`)}
                accent={accent}
              />
            )}
          </Section>
        )}

        {/* Offline maps */}
        <Section title="Offline maps">
          <Text style={styles.muted}>
            Download all published floors for this hospital so you can
            navigate without internet.
          </Text>
          <TouchableOpacity
            style={[styles.downloadBtn, { borderColor: accent }]}
            disabled={downloading}
            activeOpacity={0.8}
            onPress={async () => {
              if (buildings.length === 0) return;
              setDownloading(true);
              setDownloadDone(false);
              try {
                for (const b of buildings) {
                  const floors = await listFloorsForBuilding(b.id);
                  for (const f of floors) {
                    await getFloorBundle(f.id);
                  }
                }
                setDownloadDone(true);
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Feather
                name={downloadDone ? "check" : "download"}
                size={16}
                color={accent}
              />
            )}
            <Text style={[styles.downloadBtnText, { color: accent }]}>
              {downloading
                ? "Downloading…"
                : downloadDone
                ? "All maps downloaded"
                : "Download maps for offline use"}
            </Text>
          </TouchableOpacity>
        </Section>

        {/* Account */}
        <Section title="Account">
          {me ? (
            <View style={{ gap: spacing.sm }}>
              <View style={styles.accountRow}>
                <View
                  style={[
                    styles.supportIcon,
                    { backgroundColor: accent + "18" },
                  ]}
                >
                  <Feather name="user" size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowSubtitle}>Signed in as</Text>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {me.email}
                  </Text>
                  <Text style={styles.roleBadge}>{me.role.replace("_", " ")}</Text>
                </View>
              </View>
              {(me.role === "scanner_operator" ||
                me.role === "tenant_admin" ||
                me.role === "super_admin") && (
                <TouchableOpacity
                  style={[
                    styles.downloadBtn,
                    { borderColor: accent, marginTop: spacing.xs },
                  ]}
                  onPress={() => router.push("/scanner")}
                  activeOpacity={0.8}
                >
                  <Feather name="upload-cloud" size={16} color={accent} />
                  <Text style={[styles.downloadBtnText, { color: accent }]}>
                    Open scanner workspace
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={async () => {
                  await signOut();
                }}
                activeOpacity={0.7}
              >
                <Feather name="log-out" size={14} color={colors.danger} />
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.downloadBtn, { borderColor: accent }]}
              onPress={() => router.push("/account/login")}
              activeOpacity={0.8}
            >
              <Feather name="log-in" size={16} color={accent} />
              <Text style={[styles.downloadBtnText, { color: accent }]}>
                Sign in (staff only)
              </Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* About SmartStat */}
        <Section title="About">
          <Text style={styles.muted}>
            Indoor wayfinding powered by SmartStat AI. Your location is only
            calculated on your device and is never stored.
          </Text>
        </Section>

        {/* Switch hospital — only in directory builds */}
        {!IS_TENANT_LOCKED && (
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.replace("/")}
            activeOpacity={0.8}
          >
            <Feather name="repeat" size={16} color={accent} />
            <Text style={[styles.switchBtnText, { color: accent }]}>
              Switch hospital
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SupportRow({
  iconName,
  label,
  value,
  onPress,
  accent,
}: {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <TouchableOpacity style={styles.supportRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.supportIcon, { backgroundColor: accent + "18" }]}>
        <Feather name={iconName} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowSubtitle}>{label}</Text>
        <Text style={styles.rowTitle}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroTitle: { color: "#fff", fontSize: fontSize.xxl, fontWeight: "700" },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: "600" },
  rowSubtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  muted: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    margin: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchBtnText: { fontSize: fontSize.base, fontWeight: "600" },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  downloadBtnText: { fontSize: fontSize.sm, fontWeight: "600" },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  roleBadge: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.primary,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
