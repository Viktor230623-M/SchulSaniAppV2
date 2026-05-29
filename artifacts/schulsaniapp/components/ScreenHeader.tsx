import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/constants/colors";

interface ScreenHeaderProps {
  title: string;
  action?: {
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
  };
}

export function ScreenHeader({ title, action }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          paddingTop: topPad + spacing.sm,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={[styles.actionBtn, { backgroundColor: theme.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Feather name={action.icon} size={18} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
