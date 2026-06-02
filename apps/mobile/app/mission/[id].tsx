import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMission,
  getGetMissionsQueryKey,
  useCloseMission,
  useRespondToMission,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { CardSkeleton } from "@/components/Skeleton";
import { spacing } from "@/constants/colors";
import { useEffect } from "react";

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const t = useTranslation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const navigation = useNavigation();

  const { data: mission, isLoading } = useGetMission(id ?? "");
  const { mutate: closeMission, isPending: closing } = useCloseMission();
  const { mutate: respond, isPending: responding } = useRespondToMission();

  useEffect(() => {
    navigation.setOptions({ title: mission?.title ?? "" });
  }, [navigation, mission?.title]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textMuted }}>{t.general.error}</Text>
      </View>
    );
  }

  const isActive = mission.status === "active";
  const hasResponded = mission.responders?.some((r) => r.userId === user?.id);

  const handleClose = () => {
    const doClose = () =>
      closeMission({ id: mission.id }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() });
          router.back();
        },
      });

    if (Platform.OS === "web") {
      if (confirm(t.missions.confirmClose)) doClose();
      return;
    }
    Alert.alert(t.missions.confirmClose, t.missions.confirmCloseDesc, [
      { text: t.missions.cancel, style: "cancel" },
      { text: t.missions.confirm, style: "destructive", onPress: doClose },
    ]);
  };

  const handleRespond = () => {
    respond({ id: mission.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() }) });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.statusRow}>
        <Badge
          label={isActive ? t.missions.status.active : t.missions.status.closed}
          variant={isActive ? "danger" : "secondary"}
        />
        {mission.closedAt && (
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {t.missions.closedAt}: {new Date(mission.closedAt).toLocaleString()}
          </Text>
        )}
      </View>

      <Card>
        <Row label={t.missions.location} value={mission.location} icon="map-pin" />
        <Row label={t.missions.patientInitials} value={mission.patientInitials} icon="user" />
        <Row label={t.missions.createdBy} value={mission.createdByName} icon="user-check" />
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t.missions.treatmentNotes}</Text>
        <Text style={[styles.notes, { color: theme.textPrimary }]}>
          {mission.treatmentNotes || "–"}
        </Text>
      </Card>

      {(mission.responders?.length ?? 0) > 0 && (
        <Card>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t.missions.responders}</Text>
          {mission.responders?.map((r) => (
            <View key={r.id} style={styles.responder}>
              <Feather name="check-circle" size={14} color={theme.success} />
              <Text style={[styles.responderName, { color: theme.textPrimary }]}>{r.displayName}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {new Date(r.respondedAt).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {isActive && (
        <View style={styles.actions}>
          {can("missions.respond") && (
            <Button
              label={hasResponded ? t.missions.responded : t.missions.respond}
              onPress={handleRespond}
              loading={responding}
              variant={hasResponded ? "secondary" : "primary"}
              style={{ flex: 1 }}
            />
          )}
          {can("missions.close") && (
            <Button
              label={t.missions.close}
              onPress={handleClose}
              loading={closing}
              variant="danger"
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon: keyof typeof Feather.glyphMap }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <Feather name={icon} size={14} color={theme.textMuted} />
      <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}:</Text>
      <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  rowLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  notes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: spacing.sm },
  responder: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  responderName: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
});
