import React from "react";
import { Text, type TextProps, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface AppTextProps extends TextProps {
  variant?: "primary" | "secondary" | "muted" | "danger" | "success" | "warning";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
}

const sizeMap = { xs: 11, sm: 13, md: 15, lg: 18, xl: 24 };
const fontMap = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export function AppText({
  variant = "primary",
  size = "md",
  weight = "regular",
  style,
  ...props
}: AppTextProps) {
  const { theme } = useTheme();
  const colorMap = {
    primary: theme.textPrimary,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
    danger: theme.danger,
    success: theme.success,
    warning: theme.warning,
  };
  return (
    <Text
      style={[
        { color: colorMap[variant], fontSize: sizeMap[size], fontFamily: fontMap[weight] },
        style,
      ]}
      {...props}
    />
  );
}

export const styles = StyleSheet.create({});
