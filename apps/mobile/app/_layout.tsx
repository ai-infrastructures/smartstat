import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: {
            color: colors.text,
            fontSize: 17,
            fontWeight: "600",
          },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Hospital experience uses its own bottom tab bar — hide the stack header */}
        <Stack.Screen
          name="hospital/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="navigate/[poiId]"
          options={{ title: "Directions", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="scan/index"
          options={{
            title: "Scan QR",
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
