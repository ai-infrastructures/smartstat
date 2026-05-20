import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import type { Floor } from "@smartstat/shared";
import {
  getFloor,
  uploadFloorMesh,
  uploadFloorPlan,
} from "../../lib/data";
import { hapticSuccess, hapticError } from "../../lib/haptics";
import { colors, fontSize, radius, spacing } from "../../lib/theme";

/**
 * Floor scan upload screen. Walks the operator through:
 *  1. Scan the floor in Polycam (external app) and export .glb
 *  2. Pick the file
 *  3. Upload — we set scan_status='uploaded' and the floor is queued
 *     for admin review + POI placement
 */
export default function ScannerFloorScreen() {
  const { floorId } = useLocalSearchParams<{ floorId: string }>();
  const router = useRouter();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [meshUploading, setMeshUploading] = useState(false);
  const [planUploading, setPlanUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meshDone, setMeshDone] = useState(false);
  const [planDone, setPlanDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const f = await getFloor(floorId!);
        if (active) setFloor(f);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [floorId]);

  async function pickAndUploadMesh() {
    if (!floor) return;
    setError(null);
    const pick = await DocumentPicker.getDocumentAsync({
      type: ["model/gltf-binary", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (pick.canceled || !pick.assets || pick.assets.length === 0) return;
    const file = pick.assets[0]!;
    const lower = file.name.toLowerCase();
    if (
      !lower.endsWith(".glb") &&
      !lower.endsWith(".obj") &&
      !lower.endsWith(".ply") &&
      !lower.endsWith(".gltf")
    ) {
      hapticError();
      setError(`Unsupported mesh: ${file.name}. Use .glb, .gltf, .obj or .ply.`);
      return;
    }
    setMeshUploading(true);
    setProgress("Uploading 3D mesh…");
    try {
      const tenantId = (await fetchFloorTenant(floor.id)) ?? "";
      const out = await uploadFloorMesh({
        floorId: floor.id,
        tenantId,
        file: {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType ?? undefined,
        },
      });
      hapticSuccess();
      setProgress(`Mesh saved to ${out.path}`);
      setMeshDone(true);
    } catch (e) {
      hapticError();
      setError(e instanceof Error ? e.message : "Mesh upload failed");
    } finally {
      setMeshUploading(false);
    }
  }

  async function pickAndUploadPlan() {
    if (!floor) return;
    setError(null);
    const pick = await DocumentPicker.getDocumentAsync({
      type: ["image/png", "image/jpeg", "application/pdf", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (pick.canceled || !pick.assets || pick.assets.length === 0) return;
    const file = pick.assets[0]!;
    const lower = file.name.toLowerCase();
    if (
      !lower.endsWith(".png") &&
      !lower.endsWith(".jpg") &&
      !lower.endsWith(".jpeg") &&
      !lower.endsWith(".pdf")
    ) {
      hapticError();
      setError(`Unsupported plan: ${file.name}. Use .png, .jpg or .pdf.`);
      return;
    }
    setPlanUploading(true);
    setProgress("Uploading 2D floor plan…");
    try {
      const tenantId = (await fetchFloorTenant(floor.id)) ?? "";
      const out = await uploadFloorPlan({
        floorId: floor.id,
        tenantId,
        file: {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType ?? undefined,
        },
      });
      hapticSuccess();
      setProgress(`Plan saved to ${out.path}`);
      setPlanDone(true);
    } catch (e) {
      hapticError();
      setError(e instanceof Error ? e.message : "Plan upload failed");
    } finally {
      setPlanUploading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ActivityIndicator style={styles.center} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!floor) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={styles.title}>Floor not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.title}>{floor.name}</Text>
          <Text style={styles.subtitle}>
            Level {floor.level}
            {floor.bbox &&
              ` · ${(floor.bbox[2] - floor.bbox[0]).toFixed(0)} × ${(
                floor.bbox[3] - floor.bbox[1]
              ).toFixed(0)} m`}
          </Text>
          <View style={styles.statusBadge}>
            <Feather name="circle" size={8} color={colors.primary} />
            <Text style={styles.statusText}>
              {floor.scanStatus.replace("_", " ")}
            </Text>
          </View>
        </View>

        <Section title="How to capture the scan">
          <Step
            n={1}
            text='Open Polycam on this device, choose "LiDAR" capture mode.'
          />
          <Step
            n={2}
            text="Walk every corridor and intersection. Hold the phone steady, ~1.5m above floor."
          />
          <Step
            n={3}
            text="Process the scan in Polycam. Export TWO files: the 3D mesh as GLB, and the 2D floor plan as PNG or PDF (Polycam Pro)."
          />
          <Step
            n={4}
            text="Upload both files below — the floor plan is what admins will overlay POIs on."
          />
        </Section>

        <Section title="1. Upload 3D mesh (.glb)">
          <Text style={styles.cardHint}>
            Used as the source for auto-generated wayfinding data.
            File should be GLB, GLTF, OBJ or PLY.
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              meshDone && styles.uploadBtnDone,
              meshUploading && { opacity: 0.7 },
            ]}
            onPress={pickAndUploadMesh}
            disabled={meshUploading}
            activeOpacity={0.85}
          >
            {meshUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather
                  name={meshDone ? "check-circle" : "box"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.uploadBtnText}>
                  {meshDone ? "Mesh uploaded · replace" : "Pick mesh file"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Section>

        <Section title="2. Upload 2D floor plan (.png / .pdf)">
          <Text style={styles.cardHint}>
            Top-down view of the floor — Polycam exports this as a PDF/PNG.
            Becomes the background the admin overlays POIs on.
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              styles.uploadBtnSecondary,
              planDone && styles.uploadBtnSecondaryDone,
              planUploading && { opacity: 0.7 },
            ]}
            onPress={pickAndUploadPlan}
            disabled={planUploading}
            activeOpacity={0.85}
          >
            {planUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Feather
                  name={planDone ? "check-circle" : "image"}
                  size={18}
                  color={planDone ? "#fff" : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadBtnTextSecondary,
                    planDone && { color: "#fff" },
                  ]}
                >
                  {planDone ? "Plan uploaded · replace" : "Pick floor plan file"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Section>

        {progress && <Text style={styles.progressText}>{progress}</Text>}
        {error && (
          <View style={[styles.errBox, { marginHorizontal: spacing.xl }]}>
            <Feather name="alert-triangle" size={14} color="#92400e" />
            <Text style={styles.errText}>{error}</Text>
          </View>
        )}

        {(meshDone || planDone) && (
          <View style={styles.doneCard}>
            <Feather name="check-circle" size={24} color={colors.success} />
            <Text style={styles.doneTitle}>
              {meshDone && planDone
                ? "Both files submitted"
                : meshDone
                ? "Mesh submitted"
                : "Floor plan submitted"}
            </Text>
            <Text style={styles.doneBody}>
              {meshDone && planDone
                ? "Admin will place POIs on the plan and publish."
                : "You can add the other file later from this same screen."}
            </Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => router.replace("/scanner")}
            >
              <Text style={styles.linkText}>Back to scanner workspace</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

async function fetchFloorTenant(floorId: string): Promise<string | null> {
  const { supabase } = await import("../../lib/supabase/client");
  const { data, error } = await supabase
    .from("floors")
    .select("tenant_id")
    .eq("id", floorId)
    .maybeSingle();
  if (error) return null;
  return (data?.tenant_id as string) ?? null;
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

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
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
  },
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "#eff6ff",
    marginTop: spacing.xs,
  },
  statusText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  cardHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  uploadBtnDone: { backgroundColor: colors.success },
  uploadBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  uploadBtnSecondaryDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  uploadBtnText: { color: "#fff", fontSize: fontSize.base, fontWeight: "700" },
  uploadBtnTextSecondary: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  errBox: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  errText: { color: "#92400e", fontSize: fontSize.sm, flex: 1 },
  doneCard: {
    margin: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.sm,
  },
  doneTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  doneBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  linkBtn: { paddingVertical: spacing.sm },
  linkText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
