import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUsers,
  getGetUsersQueryKey,
  useUpdateUser,
  useGetCustomRoles,
  getGetCustomRolesQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { spacing, radius } from "@/constants/colors";
import type { User } from "@workspace/api-client-react";
import { useEffect } from "react";

const SYSTEM_ROLES = ["admin", "sanitaeter_leitung_admin", "sanitaeter_leitung", "teacher", "sanitaeter"] as const;

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { isOwner, isSanitaeterLeitungAdmin } = usePermissions();
  const qc = useQueryClient();
  const navigation = useNavigation();

  const [selected, setSelected] = useState<User | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const { data: users, isLoading } = useGetUsers();
  const { data: customRoles } = useGetCustomRoles({ query: { enabled: isSanitaeterLeitungAdmin, queryKey: getGetCustomRolesQueryKey() } });
  const { mutate: updateUser } = useUpdateUser();

  useEffect(() => {
    navigation.setOptions({ title: t.admin.title });
  }, [navigation, t.admin.title]);

  const handleToggleActive = (user: User) => {
    if (user.role === "owner") return;
    updateUser(
      { id: user.id, data: { isActive: !user.isActive } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetUsersQueryKey() }) },
    );
  };

  const handleChangeRole = (userId: string, role: typeof SYSTEM_ROLES[number]) => {
    updateUser(
      { id: userId, data: { role } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetUsersQueryKey() }); setRolePickerOpen(false); setSelected(null); } },
    );
  };

  const handleAssignCustomRole = (userId: string, customRoleId: string | null) => {
    updateUser(
      { id: userId, data: { customRoleId } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetUsersQueryKey() }); setRolePickerOpen(false); setSelected(null); } },
    );
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

  const roleVariant = (role: string) => {
    if (role === "owner") return "warning" as const;
    if (role === "admin") return "primary" as const;
    if (role === "sanitaeter_leitung_admin") return "success" as const;
    if (role === "sanitaeter_leitung") return "success" as const;
    if (role === "teacher") return "primary" as const;
    return "secondary" as const;
  };

  const renderItem = ({ item }: { item: User }) => {
    const isProtected = item.role === "owner";
    return (
      <Card>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.textPrimary }]}>{item.displayName}</Text>
            <Text style={[styles.username, { color: theme.textMuted }]}>@{item.iservUsername}</Text>
          </View>
          <View style={styles.badges}>
            <Badge
              label={item.customRole?.name ?? roleLabel(item.role)}
              variant={item.customRole ? "secondary" : roleVariant(item.role)}
              color={item.customRole?.color}
            />
            <Badge
              label={item.isActive ? t.admin.active : (item.isActive === false ? t.admin.pending : t.admin.inactive)}
              variant={item.isActive ? "success" : "warning"}
            />
          </View>
        </View>

        {!isProtected && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: item.isActive ? theme.warning + "22" : theme.success + "22" }]}
              onPress={() => handleToggleActive(item)}
            >
              <Feather name={item.isActive ? "user-x" : "user-check"} size={13} color={item.isActive ? theme.warning : theme.success} />
              <Text style={[styles.btnText, { color: item.isActive ? theme.warning : theme.success }]}>
                {item.isActive ? t.admin.deactivate : t.admin.activate}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.primary + "22" }]}
              onPress={() => { setSelected(item); setRolePickerOpen(true); }}
            >
              <Feather name="shield" size={13} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>{t.admin.changeRole}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, (!users || users.length === 0) && styles.emptyList]}
          scrollEnabled={(users?.length ?? 0) > 0}
          ListEmptyComponent={<EmptyState icon="users" title={t.admin.emptyUsers} />}
        />
      )}

      <Modal visible={rolePickerOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.admin.changeRole}</Text>
              <TouchableOpacity onPress={() => { setRolePickerOpen(false); setSelected(null); }}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>System</Text>
              {SYSTEM_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleItem, { borderColor: theme.border }]}
                  onPress={() => selected && handleChangeRole(selected.id, role)}
                >
                  <Badge label={roleLabel(role)} variant={roleVariant(role)} />
                  {selected?.role === role && !selected?.customRoleId && (
                    <Feather name="check" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {(customRoles?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t.profile.roles}</Text>
                  {customRoles?.map((cr) => (
                    <TouchableOpacity
                      key={cr.id}
                      style={[styles.roleItem, { borderColor: theme.border }]}
                      onPress={() => selected && handleAssignCustomRole(selected.id, cr.id)}
                    >
                      <Badge label={cr.name} color={cr.color} />
                      {selected?.customRoleId === cr.id && (
                        <Feather name="check" size={16} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {selected?.customRoleId && (
                    <TouchableOpacity
                      style={[styles.roleItem, { borderColor: theme.border }]}
                      onPress={() => selected && handleAssignCustomRole(selected.id, null)}
                    >
                      <Text style={[styles.removeCustomRoleText, { color: theme.danger }]}>
                        {t.admin.removeCustomRole}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: 40 },
  emptyList: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  username: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badges: { gap: 4, alignItems: "flex-end" },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  btnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, padding: spacing.md, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.sm },
  roleItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  removeCustomRoleText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
