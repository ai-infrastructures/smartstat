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
        <Stack.Screen
          name="hospital/[id]"
          options={{ title: "Hospital", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="navigate/[poiId]"
          options={{ title: "Directions", headerBackTitle: "Back" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
