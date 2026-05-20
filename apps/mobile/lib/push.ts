import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "./supabase/client";

/**
 * Configure Expo Notifications default handler. Calling this once at app
 * startup is enough.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push permissions and register the Expo push token for the current
 * authenticated user. Safe to call on every cold start.
 *
 * Returns true if a token was registered, false otherwise.
 */
export async function registerForPushNotifications(): Promise<boolean> {
  // Only physical devices can receive remote pushes
  if (!Device.isDevice) return false;

  // Skip if user isn't authenticated — we have nowhere to persist the token
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return false;

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0EA5E9",
    });
  }

  try {
    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      (await Notifications.getExpoPushTokenAsync()).data;
    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResp.data;

    // Persist to profiles row via the RPC (which checks auth.uid())
    await supabase.rpc("upsert_my_push_token", {
      p_token: token,
      p_platform: Platform.OS,
    });
    return true;
  } catch {
    return false;
  }
}
