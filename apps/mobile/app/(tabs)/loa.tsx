import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLoaRequests,
  getGetLoaRequestsQueryKey,
  useCreateLoaRequest,
  useUpdateLoaRequest,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { spacing, radius } from "@/constants/colors";
import type { LoaRequest } from "@workspace/api-client-react";

export default function LoaScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { can } = usePermissions();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: loas, isLoading, refetch } = useGetLoaRequests();
  const { mutate: createLoa, isPending: creating } = useCreateLoaRequest();
  const { mutate: updateLoa } = useUpdateLoaRequest();

  const handleCreate = () => {
    if (!reason || !fromDate || !toDate) return;
    createLoa(
      { data: { reason, fromDate, toDate } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetLoaRequestsQueryKey() });
          setShowModal(false);
          setReason("");
          setFromDate("");
          setToDate("");
        },
      },
    );
  };

  const handleUpdateStatus = (id: string, status: "approved" | "rejected") => {
    updateLoa(
      { id, data: { status } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetLoaRequestsQueryKey() }) },
    );
  };

  const badgeVariant = (status: string) => {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "danger" as const;
    return "warning" as const;
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return t.loa.status.approved;
    if (status === "rejected") return t.loa.status.rejected;
    return t.loa.status.pending;
  };

  const renderItem = ({ item }: { item: LoaRequest }) => (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{item.displayName}</Text>
        <Badge label={statusLabel(item.status)} variant={badgeVariant(item.status)} />
      </View>
      <Text style={[styles.reason, { color: theme.textSecondary }]}>{item.reason}</Text>
      <Text style={[styles.dates, { color: theme.textMuted }]}>
        {item.fromDate} → {item.toDate}
      </Text>
      {item.reviewedByName && (
        <Text style={[styles.reviewer, { color: theme.textMuted }]}>
          {t.loa.reviewedBy}: {item.reviewedByName}
        </Text>
      )}
      {item.status === "pending" && can("loa.manage") && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.success + "22" }]}
            onPress={() => handleUpdateStatus(item.id, "approved")}
          >
            <Feather name="check" size={14} color={theme.success} />
            <Text style={[styles.actionText, { color: theme.success }]}>{t.loa.approve}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.danger + "22" }]}
            onPress={() => handleUpdateStatus(item.id, "rejected")}
          >
            <Feather name="x" size={14} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>{t.loa.reject}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={t.loa.title}
        action={can("loa.submit") ? { icon: "plus", onPress: () => setShowModal(true) } : undefined}
      />

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={loas ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, (!loas || loas.length === 0) && styles.emptyList]}
          scrollEnabled={(loas?.length ?? 0) > 0}
          ListEmptyComponent={<EmptyState icon="user-x" title={t.loa.empty} subtitle={t.loa.emptyDesc} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.loa.new}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Input label={t.loa.reason} value={reason} onChangeText={setReason} placeholder={t.loa.reasonPlaceholder} multiline />
              <Input label={t.loa.from} value={fromDate} onChangeText={setFromDate} placeholder={t.loa.fromPlaceholder} />
              <Input label={t.loa.to} value={toDate} onChangeText={setToDate} placeholder={t.loa.toPlaceholder} />
              <Button label={creating ? t.loa.submitting : t.loa.submit} onPress={handleCreate} loading={creating} />
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reason: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  dates: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  reviewer: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  actionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, padding: spacing.md, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
});
