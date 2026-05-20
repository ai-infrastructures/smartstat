import { useEffect, useState } from "react";
import { Tabs, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { getTenant } from "../../../lib/data";
import type { Tenant } from "@smartstat/shared";

/**
 * Per-hospital layout: bottom tab bar with Map / Places / Profile.
 *
 * - Map: live floor view with user pin (primary entry)
 * - Places: search bar + category chips + POI list
 * - Profile: account, contacts, offline maps, switch hospital
 *
 * The Scan and Locate screens are reachable from inside the Map / Places
 * screens but are NOT tabs themselves — they're transient interactions.
 *
 * The accent color of the tab bar follows the tenant's branding.
 */
export default function HospitalTabsLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    let active = true;
    getTenant(id!)
      .then((t) => {
        if (active) setTenant(t);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const accent = tenant?.branding.primaryColor ?? colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="map"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: "Places",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="list"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="user"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      {/* The /scan route still exists at this path level for back-compat
          but is hidden from the tab bar via href: null */}
      <Tabs.Screen
        name="scan"
        options={{ href: null }}
      />
    </Tabs>
  );
}
