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
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDutySlots,
  getGetDutySlotsQueryKey,
  useCreateDutySlot,
  useDeleteDutySlot,
  useGetUsers,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { spacing, radius } from "@/constants/colors";
import type { DutySlot } from "@workspace/api-client-react";

export default function DutyScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { can } = usePermissions();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("14:00");
  const [notes, setNotes] = useState("");

  const { data: slots, isLoading, refetch } = useGetDutySlots();
  const { data: users } = useGetUsers({ query: { enabled: can("duty.manage") } });
  const { mutate: createSlot, isPending: creating } = useCreateDutySlot();
  const { mutate: deleteSlot } = useDeleteDutySlot();

  const handleCreate = () => {
    if (!userId || !date) return;
    createSlot(
      { data: { userId, date, startTime, endTime, notes: notes || undefined } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetDutySlotsQueryKey() });
          setShowModal(false);
          setDate("");
          setNotes("");
          setUserId("");
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    const doDelete = () =>
      deleteSlot({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetDutySlotsQueryKey() }) });

    if (Platform.OS === "web") {
      if (confirm(t.duty.delete)) doDelete();
      return;
    }
    Alert.alert(t.duty.delete, undefined, [
      { text: t.general.cancel, style: "cancel" },
      { text: t.general.delete, style: "destructive", onPress: doDelete },
    ]);
  };

  const renderItem = ({ item }: { item: DutySlot }) => (
    <Card>
      <View style={styles.row}>
        <View style={styles.timeCol}>
          <Text style={[styles.time, { color: theme.primary }]}>
            {item.startTime} – {item.endTime}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{item.date}</Text>
        </View>
        <View style={styles.personCol}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{item.displayName}</Text>
          {item.notes && (
            <Text style={[styles.notes, { color: theme.textMuted }]} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        {can("duty.manage") && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
            <Feather name="trash-2" size={16} color={theme.danger} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={t.duty.title}
        action={can("duty.manage") ? { icon: "plus", onPress: () => setShowModal(true) } : undefined}
      />

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={slots ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, (!slots || slots.length === 0) && styles.emptyList]}
          scrollEnabled={(slots?.length ?? 0) > 0}
          ListEmptyComponent={<EmptyState icon="calendar" title={t.duty.empty} subtitle={t.duty.emptyDesc} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.duty.add}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t.duty.person}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userList}>
                {(users ?? []).filter((u) => u.isActive).map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setUserId(u.id)}
                    style={[
                      styles.userChip,
                      {
                        backgroundColor: userId === u.id ? theme.primary : theme.surfaceElevated,
                        borderColor: userId === u.id ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: userId === u.id ? theme.primaryForeground : theme.textPrimary, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                      {u.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Input label={t.duty.date} value={date} onChangeText={setDate} placeholder={t.duty.datePlaceholder} />
              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input label={t.duty.start} value={startTime} onChangeText={setStartTime} placeholder={t.duty.startPlaceholder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label={t.duty.end} value={endTime} onChangeText={setEndTime} placeholder={t.duty.endPlaceholder} />
                </View>
              </View>
              <Input label={t.duty.notes} value={notes} onChangeText={setNotes} placeholder="" multiline />
              <Button label={creating ? t.duty.submitting : t.duty.submit} onPress={handleCreate} loading={creating} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: 100 },
  emptyList: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeCol: { width: 90 },
  time: { fontSize: 14, fontFamily: "Inter_700Bold" },
  date: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  personCol: { flex: 1 },
  name: { fontSize: 15, fontFamily: "Inter_500Medium" },
  notes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, padding: spacing.md, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: spacing.xs },
  userList: { marginBottom: spacing.md },
  userChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, marginRight: 8 },
  timeRow: { flexDirection: "row" },
});
