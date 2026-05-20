import { useEffect, useState } from "react";
import { Tabs, useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { colors, fontSize, spacing } from "../../../lib/theme";
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
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🔍" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="⬛" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="ℹ︎" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  emoji,
  focused,
  color,
}: {
  emoji: string;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Text
        style={[
          styles.icon,
          { color: focused ? color : colors.textSubtle },
        ]}
      >
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 18, lineHeight: 22 },
});
