import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { spacing, radius } from "@/constants/colors";
import type { AuthUser } from "@/context/AuthContext";

export default function LoginScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { setSession } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync: login, isPending } = useLogin();

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError(t.login.error);
      return;
    }
    try {
      const result = await login({ data: { username: username.trim(), password } });
      if (result.token && result.user) {
        setSession(result.token, result.user as AuthUser);
        if (!result.user.isActive) {
          router.replace("/pending");
        } else {
          router.replace("/(tabs)/missions");
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === "account_pending") {
        setSession("", { isActive: false } as AuthUser);
        router.replace("/pending");
      } else {
        setError(t.login.error);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + spacing.xl,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoRow}>
          <View style={[styles.logoWrap, { backgroundColor: theme.primary + "22", borderColor: theme.primary + "44" }]}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
            />
          </View>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t.login.subtitle}
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t.login.title}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Input
            label={t.login.username}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            placeholder="vorname.nachname"
          />
          <Input
            label={t.login.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            placeholder="••••••••"
          />
          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}
          <Button
            label={isPending ? t.login.loading : t.login.submit}
            onPress={handleLogin}
            loading={isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.md },
  logoRow: { alignItems: "center", marginBottom: spacing.lg },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 60, height: 60, borderRadius: radius.sm },
  subtitle: { textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { textAlign: "center", fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: spacing.xl },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: spacing.sm, textAlign: "center" },
});
