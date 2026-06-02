import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/constants/colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = radius.sm, style }: SkeletonProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: theme.surfaceElevated, opacity: anim },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Skeleton width="60%" height={16} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="40%" height={12} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
