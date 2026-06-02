import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCustomRoles,
  getGetCustomRolesQueryKey,
  useCreateCustomRole,
  useDeleteCustomRole,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { spacing, radius } from "@/constants/colors";
import type { CustomRole } from "@workspace/api-client-react";
import { useEffect } from "react";

const ALL_PERMISSIONS = [
  "missions.view", "missions.create", "missions.close", "missions.respond",
  "duty.view", "duty.manage",
  "loa.view", "loa.submit", "loa.manage",
  "news.view", "news.post", "news.manage",
  "users.view", "users.manage",
  "roles.assign",
];

const COLOR_OPTIONS = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#14B8A6"];

export default function AdminRolesScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const qc = useQueryClient();
  const navigation = useNavigation();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data: roles, isLoading } = useGetCustomRoles();
  const { mutate: createRole, isPending: creating } = useCreateCustomRole();
  const { mutate: deleteRole } = useDeleteCustomRole();

  useEffect(() => {
    navigation.setOptions({ title: t.admin.rolesTitle });
  }, [navigation, t.admin.rolesTitle]);

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleCreate = () => {
    if (!name || permissions.length === 0) return;
    createRole(
      { data: { name, color, permissions } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCustomRolesQueryKey() });
          setShowModal(false);
          setName("");
          setColor("#6366F1");
          setPermissions([]);
        },
      },
    );
  };

  const handleDelete = (id: string, roleName: string) => {
    const doDelete = () =>
      deleteRole({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCustomRolesQueryKey() }) });

    if (Platform.OS === "web") {
      if (confirm(`${t.admin.deleteRole}: ${roleName}?`)) doDelete();
      return;
    }
    Alert.alert(t.admin.deleteRole, roleName, [
      { text: t.general.cancel, style: "cancel" },
      { text: t.general.delete, style: "destructive", onPress: doDelete },
    ]);
  };

  const renderItem = ({ item }: { item: CustomRole }) => (
    <Card>
      <View style={styles.cardHeader}>
        <Badge label={item.name} color={item.color} />
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={8}>
          <Feather name="trash-2" size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.permList}>
        {(item.permissions as string[]).map((perm) => (
          <View key={perm} style={[styles.permChip, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.permText, { color: theme.textSecondary }]}>
              {t.admin.permissionsLabel[perm as keyof typeof t.admin.permissionsLabel] ?? perm}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Button label={t.admin.newRole} onPress={() => setShowModal(true)} size="sm" style={{ alignSelf: "flex-end" }} />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={roles ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, (!roles || roles.length === 0) && styles.emptyList]}
          scrollEnabled={(roles?.length ?? 0) > 0}
          ListEmptyComponent={<EmptyState icon="shield" title={t.admin.emptyRoles} subtitle="Erstelle eine neue Rolle mit benutzerdefinierten Berechtigungen" />}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.admin.newRole}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label={t.admin.roleName} value={name} onChangeText={setName} placeholder="z.B. Einsatzleiter" />

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.admin.roleColor}</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.colorChip, { backgroundColor: c, borderColor: color === c ? theme.textPrimary : "transparent" }]}
                  >
                    {color === c && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.admin.permissions}</Text>
              {ALL_PERMISSIONS.map((perm) => {
                const selected = permissions.includes(perm);
                return (
                  <TouchableOpacity
                    key={perm}
                    style={[styles.permRow, { borderColor: theme.border }]}
                    onPress={() => togglePermission(perm)}
                  >
                    <View style={[styles.checkbox, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}>
                      {selected && <Feather name="check" size={10} color="#fff" />}
                    </View>
                    <Text style={[styles.permRowText, { color: theme.textPrimary }]}>
                      {t.admin.permissionsLabel[perm as keyof typeof t.admin.permissionsLabel] ?? perm}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: spacing.md }} />
              <Button
                label={creating ? t.general.loading : t.admin.saveRole}
                onPress={handleCreate}
                loading={creating}
                disabled={!name || permissions.length === 0}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  list: { padding: spacing.md, paddingBottom: 40 },
  emptyList: { flex: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  permList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  permChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  permText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, padding: spacing.md, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: spacing.xs, marginTop: spacing.sm },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  colorChip: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  permRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  permRowText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
});
