import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/constants/colors";

type BadgeVariant = "success" | "danger" | "warning" | "primary" | "secondary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: string;
}

export function Badge({ label, variant = "secondary", color }: BadgeProps) {
  const { theme } = useTheme();

  const colorMap: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: theme.success + "33", text: theme.success },
    danger: { bg: theme.danger + "33", text: theme.danger },
    warning: { bg: theme.warning + "33", text: theme.warning },
    primary: { bg: theme.primary + "33", text: theme.primary },
    secondary: { bg: theme.surfaceElevated, text: theme.textSecondary },
  };

  const colors = colorMap[variant];
  const bgColor = color ? color + "33" : colors.bg;
  const textColor = color ?? colors.text;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
