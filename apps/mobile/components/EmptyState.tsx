import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/constants/colors";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceElevated }]}>
        <Feather name={icon} size={28} color={theme.textMuted} />
      </View>
      <AppText weight="semibold" size="lg" style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="secondary" size="sm" style={styles.sub}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  sub: {
    textAlign: "center",
  },
});
