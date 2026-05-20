import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { signInWithMagicLink } from "../../lib/auth";
import { colors, fontSize, radius, spacing } from "../../lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);
    try {
      await signInWithMagicLink(email.trim());
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send magic link");
      setStatus("error");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.body}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Feather name="navigation" size={28} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            We&apos;ll email you a magic link. No password needed.
          </Text>

          {status === "sent" ? (
            <View style={styles.successCard}>
              <Feather
                name="check-circle"
                size={32}
                color={colors.success}
              />
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successBody}>
                We sent a sign-in link to {email}. Open it on this device.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEmail("");
                  setStatus("idle");
                }}
              >
                <Text style={styles.successLink}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                editable={status !== "sending"}
              />

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.primary,
                  status === "sending" && { opacity: 0.6 },
                ]}
                onPress={onSubmit}
                disabled={status === "sending"}
                activeOpacity={0.85}
              >
                {status === "sending" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="mail" size={16} color="#fff" />
                    <Text style={styles.primaryText}>Send magic link</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.guestNote}>
                You don&apos;t need to sign in to use the navigator. This is
                only for staff and scanner operators.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  closeBtn: {
    alignSelf: "flex-start",
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: "#fef3c7",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: "#92400e", fontSize: fontSize.sm },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: fontSize.base },
  guestNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  successCard: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  successBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  successLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});
