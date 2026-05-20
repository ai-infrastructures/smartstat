import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { findQrAnchor } from "../../lib/data";
import { setUserPosition } from "../../lib/userPosition";
import { colors, fontSize, radius, spacing } from "../../lib/theme";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "not_found">(
    "idle"
  );
  const [lastCode, setLastCode] = useState<string | null>(null);
  const cooldownRef = useRef<number | null>(null);

  const onBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || status === "checking") return;
      if (cooldownRef.current && Date.now() - cooldownRef.current < 1000) return;
      cooldownRef.current = Date.now();
      setScanned(true);
      setStatus("checking");
      setLastCode(data);

      try {
        const hit = await findQrAnchor(data.trim());
        if (!hit) {
          setStatus("not_found");
          setTimeout(() => {
            setScanned(false);
            setStatus("idle");
          }, 2000);
          return;
        }

        // Persist the position globally so subsequent screens can use it
        // as the start point for navigation.
        setUserPosition({
          tenantId: hit.tenant.id,
          buildingId: hit.building.id,
          floorId: hit.floor.id,
          x: hit.node.position.x,
          y: hit.node.position.y,
          anchorNodeId: hit.node.id,
          anchorCode: data,
          scannedAt: Date.now(),
        });

        router.replace(`/hospital/${hit.tenant.id}`);
      } catch {
        setStatus("not_found");
        setTimeout(() => {
          setScanned(false);
          setStatus("idle");
        }, 2000);
      }
    },
    [router, scanned, status]
  );

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.center} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.h1}>Camera access needed</Text>
          <Text style={styles.body}>
            We use the camera only to scan SmartStat QR anchors inside the
            hospital. Nothing is recorded.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Grant camera access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      />

      {/* Overlay frame */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={8}
          >
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan a SmartStat QR</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.viewfinderWrap}>
          <View style={styles.viewfinder} />
        </View>

        <View style={styles.bottomBar}>
          {status === "checking" && (
            <View style={styles.statusPill}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Looking up “{lastCode}”…</Text>
            </View>
          )}
          {status === "not_found" && (
            <View style={[styles.statusPill, styles.errorPill]}>
              <Text style={styles.statusText}>
                Unknown QR. Try another anchor.
              </Text>
            </View>
          )}
          {status === "idle" && (
            <Text style={styles.hint}>
              Point the camera at a printed QR anchor on the wall
            </Text>
          )}
        </View>
      </SafeAreaView>
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
    gap: spacing.md,
  },
  h1: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  body: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: fontSize.base },
  cancel: { color: colors.primary, fontSize: fontSize.sm, marginTop: spacing.sm },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18 },
  title: { color: "#fff", fontSize: fontSize.base, fontWeight: "600" },
  viewfinderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  bottomBar: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  errorPill: { backgroundColor: "rgba(220,38,38,0.85)" },
  statusText: { color: "#fff", fontSize: fontSize.sm },
  hint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
