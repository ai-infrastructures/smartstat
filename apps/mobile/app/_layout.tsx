import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase/client";
import { registerForPushNotifications } from "../lib/push";
import { colors } from "../lib/theme";

export default function RootLayout() {
  // Register the Expo push token whenever an auth session is available.
  // Safe to call multiple times; the push helper bails early if not auth'd.
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        registerForPushNotifications().catch(() => {});
      }
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

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
        <Stack.Screen
          name="account/login"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="scanner/index"
          options={{
            title: "Scanner",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="scanner/[floorId]"
          options={{
            title: "Upload scan",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="locate/[floorId]"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
