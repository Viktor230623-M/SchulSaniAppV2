import React from "react";
import { View, type ViewProps, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/constants/colors";

interface CardProps extends ViewProps {
  elevated?: boolean;
  padding?: number;
}

export function Card({ elevated, padding = spacing.md, style, children, ...props }: CardProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.surfaceElevated : theme.card,
          borderColor: theme.cardBorder,
          padding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
