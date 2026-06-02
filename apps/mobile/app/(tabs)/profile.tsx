import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { themes, type ThemeKey, spacing, radius } from "@/constants/colors";
import { Card } from "@/components/Card";

const THEME_KEYS: ThemeKey[] = ["dark", "light", "ocean", "forest", "crimson"];

export default function ProfileScreen() {
  const { theme, themeKey, setTheme, language, setLanguage } = useTheme();
  const t = useTranslation();
  const { user, clearSession } = useAuth();
  const { isOwner, isAdmin, isSanitaeterLeitungAdmin, isSanitaeterLeitung, isTeacher } = usePermissions();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const handleLogout = () => {
    clearSession();
    qc.clear();
    router.replace("/login");
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      owner: t.profile.roles_label.owner,
      admin: t.profile.roles_label.admin,
      sanitaeter_leitung_admin: t.profile.roles_label.sanitaeter_leitung_admin,
      sanitaeter_leitung: t.profile.roles_label.sanitaeter_leitung,
      teacher: t.profile.roles_label.teacher,
      sanitaeter: t.profile.roles_label.sanitaeter,
    };
    return map[role] ?? role;
  };

  const themeLabel = (key: ThemeKey) => {
    const map: Record<ThemeKey, string> = {
      dark: t.profile.themes.dark,
      light: t.profile.themes.light,
      ocean: t.profile.themes.ocean,
      forest: t.profile.themes.forest,
      crimson: t.profile.themes.crimson,
    };
    return map[key];
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.sm, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t.profile.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 100 }}>
        <View style={styles.section}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + "22" }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {user?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{user?.displayName}</Text>
          <Text style={[styles.username, { color: theme.textSecondary }]}>@{user?.iservUsername}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + "22" }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>
              {user?.customRole?.name ?? roleLabel(user?.role ?? "")}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.md }}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.profile.theme}</Text>
          <View style={styles.themeRow}>
            {THEME_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTheme(key)}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: themes[key].background,
                    borderColor: themeKey === key ? themes[key].primary : themes[key].border,
                    borderWidth: themeKey === key ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themeColor, { backgroundColor: themes[key].primary }]} />
                <Text style={[styles.themeLabel, { color: themes[key].textPrimary }]}>{themeLabel(key)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.profile.language}</Text>
          <Card padding={spacing.sm}>
            <View style={styles.langRow}>
              {(["de", "en"] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.langBtn,
                    { backgroundColor: language === lang ? theme.primary : theme.surfaceElevated },
                  ]}
                >
                  <Text style={{ color: language === lang ? theme.primaryForeground : theme.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                    {t.profile.languages[lang]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {(isAdmin || isOwner) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.profile.admin}</Text>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push("/admin/users")}
              >
                <Feather name="users" size={18} color={theme.textSecondary} />
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>{t.profile.users}</Text>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => router.push("/admin/roles")}
                >
                  <Feather name="shield" size={18} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.textPrimary }]}>{t.profile.roles}</Text>
                  <Feather name="chevron-right" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push("/admin/activity")}
              >
                <Feather name="activity" size={18} color={theme.textSecondary} />
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>{t.activity.title}</Text>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </>
          )}
          {!isAdmin && !isOwner && (isSanitaeterLeitungAdmin || isSanitaeterLeitung || isTeacher) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.profile.admin}</Text>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push("/admin/activity")}
              >
                <Feather name="activity" size={18} color={theme.textSecondary} />
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>{t.activity.title}</Text>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: theme.danger + "22", borderColor: theme.danger + "44" }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={18} color={theme.danger} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>{t.profile.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  section: { alignItems: "center", paddingVertical: spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  username: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: spacing.sm },
  roleBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
  themeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, gap: 6 },
  themeColor: { width: 12, height: 12, borderRadius: 6 },
  themeLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  langRow: { flexDirection: "row", gap: 8 },
  langBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  menuText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.md },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
