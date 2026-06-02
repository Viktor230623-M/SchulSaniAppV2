import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

function ClassicTabLayout() {
  const { theme } = useTheme();
  const t = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : theme.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.tabBarBorder,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.tabBar }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="missions"
        options={{
          title: t.nav.missions,
          tabBarIcon: ({ color }) => <Feather name="alert-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="duty"
        options={{
          title: t.nav.duty,
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loa"
        options={{
          title: t.nav.loa,
          tabBarIcon: ({ color }) => <Feather name="user-x" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t.nav.news,
          tabBarIcon: ({ color }) => <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <ClassicTabLayout />;
  }
  return <ClassicTabLayout />;
}
