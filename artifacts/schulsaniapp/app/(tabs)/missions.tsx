import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMissions,
  getGetMissionsQueryKey,
  useCloseMission,
  useRespondToMission,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { spacing, radius } from "@/constants/colors";
import type { Mission } from "@workspace/api-client-react";

export default function MissionsScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const qc = useQueryClient();

  const { data: missions, isLoading, refetch } = useGetMissions();
  const { mutate: closeMission } = useCloseMission();
  const { mutate: respond } = useRespondToMission();

  const activeMissions = (missions ?? []).filter((m) => m.status === "active");
  const sortedMissions = [...(missions ?? [])].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleClose = (id: string) => {
    if (Platform.OS === "web") {
      if (confirm(t.missions.confirmClose)) {
        closeMission({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() }) });
      }
      return;
    }
    Alert.alert(t.missions.confirmClose, t.missions.confirmCloseDesc, [
      { text: t.missions.cancel, style: "cancel" },
      {
        text: t.missions.confirm,
        style: "destructive",
        onPress: () =>
          closeMission({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() }) }),
      },
    ]);
  };

  const handleRespond = (id: string) => {
    respond({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() }) });
  };

  const renderItem = ({ item }: { item: Mission }) => {
    const isActive = item.status === "active";
    const hasResponded = item.responders?.some((r) => r.userId === user?.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/mission/${item.id}`)}
      >
        <Card style={isActive ? { borderColor: theme.danger, borderWidth: 1.5 } : undefined}>
          <View style={styles.cardHeader}>
            <Text style={[styles.missionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Badge
              label={item.status === "active" ? t.missions.status.active : t.missions.status.closed}
              variant={isActive ? "danger" : "secondary"}
            />
          </View>
          <View style={styles.meta}>
            <Feather name="map-pin" size={12} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.location}</Text>
            <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {isActive && (
            <View style={styles.cardActions}>
              {can("missions.respond") && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: hasResponded ? theme.success + "22" : theme.primary + "22" },
                  ]}
                  onPress={() => handleRespond(item.id)}
                >
                  <Feather name="check" size={14} color={hasResponded ? theme.success : theme.primary} />
                  <Text style={[styles.actionText, { color: hasResponded ? theme.success : theme.primary }]}>
                    {hasResponded ? t.missions.responded : t.missions.respond}
                  </Text>
                </TouchableOpacity>
              )}
              {can("missions.close") && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.danger + "22" }]}
                  onPress={() => handleClose(item.id)}
                >
                  <Feather name="x-circle" size={14} color={theme.danger} />
                  <Text style={[styles.actionText, { color: theme.danger }]}>{t.missions.close}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={t.missions.title}
        action={
          can("missions.create")
            ? { icon: "plus", onPress: () => router.push("/mission/new") }
            : undefined
        }
      />

      {activeMissions.length > 0 && (
        <TouchableOpacity
          style={[styles.activeBanner, { backgroundColor: theme.danger }]}
          onPress={() => router.push(`/mission/${activeMissions[0]!.id}`)}
          activeOpacity={0.85}
        >
          <Feather name="alert-triangle" size={16} color="#fff" />
          <Text style={styles.bannerText}>{t.missions.activeBanner}</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={sortedMissions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            sortedMissions.length === 0 && styles.emptyList,
          ]}
          scrollEnabled={sortedMissions.length > 0}
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle"
              title={t.missions.empty}
              subtitle={t.missions.emptyDesc}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bannerText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  list: { padding: spacing.md, paddingBottom: 100 },
  emptyList: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  missionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  metaDot: { fontSize: 12 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  actionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
