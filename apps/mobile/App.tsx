import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { APP_NAME_DEFAULT } from "@smartstat/shared";

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>V0 · Bootstrap</Text>
      </View>
      <Text style={styles.title}>{APP_NAME_DEFAULT}</Text>
      <Text style={styles.subtitle}>
        Indoor navigation for hospitals
      </Text>
      <View style={styles.divider} />
      <Text style={styles.body}>
        Mobile app skeleton is alive.{"\n"}
        Shared types from @smartstat/shared are linked.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  badgeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 6,
    textAlign: "center",
  },
  divider: {
    height: 1,
    width: 60,
    backgroundColor: "#cbd5e1",
    marginVertical: 24,
  },
  body: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
});
