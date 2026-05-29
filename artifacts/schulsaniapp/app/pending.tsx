import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/Button";
import { spacing, radius } from "@/constants/colors";

export default function PendingScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { clearSession } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.warning + "22" }]}>
          <Feather name="clock" size={40} color={theme.warning} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t.pending.title}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {t.pending.message}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label={t.pending.logout} onPress={handleLogout} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: spacing.md },
  message: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  actions: { paddingBottom: spacing.lg },
});
