import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/constants/colors";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "danger" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  label,
  loading,
  variant = "primary",
  size = "lg",
  onPress,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();

  const bgMap = {
    primary: theme.primary,
    danger: theme.danger,
    secondary: theme.surfaceElevated,
    ghost: "transparent",
  };

  const textMap = {
    primary: theme.primaryForeground,
    danger: "#FFFFFF",
    secondary: theme.textPrimary,
    ghost: theme.primary,
  };

  const sizeStyle = {
    sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    lg: { paddingVertical: 14, paddingHorizontal: spacing.md },
  };

  const handlePress: typeof onPress = (e) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.button,
        sizeStyle[size],
        { backgroundColor: bgMap[variant] },
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <Text style={[styles.label, { color: textMap[variant] }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  disabled: {
    opacity: 0.5,
  },
});
