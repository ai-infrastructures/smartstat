import { useEffect, useState } from "react";
import { Tabs, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { getTenant } from "../../../lib/data";
import type { Tenant } from "@smartstat/shared";

/**
 * Per-hospital layout: bottom tab bar with Search / Scan / Info.
 *
 * The accent color of the tab bar follows the tenant's branding primary color.
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
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="search"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="maximize"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="info"
              size={focused ? 22 : 20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
