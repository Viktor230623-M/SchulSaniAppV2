import React, { useEffect } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { useGetActivity } from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { spacing } from "@/constants/colors";
import type { ActivityLogEntry } from "@workspace/api-client-react";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days !== 1 ? "en" : ""}`;
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const navigation = useNavigation();

  const { data: entries, isLoading } = useGetActivity();

  useEffect(() => {
    navigation.setOptions({ title: t.activity.title });
  }, [navigation, t.activity.title]);

  const actionLabel = (action: string): string => {
    return (t.activity as Record<string, string>)[action] ?? action;
  };

  const renderItem = ({ item }: { item: ActivityLogEntry }) => (
    <Card>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.action, { color: theme.textPrimary }]}>
            {actionLabel(item.action)}
          </Text>
          {item.displayName && (
            <Text style={[styles.user, { color: theme.textMuted }]}>
              {item.displayName}
            </Text>
          )}
        </View>
        <Text style={[styles.time, { color: theme.textMuted }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={entries ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            (!entries || entries.length === 0) && styles.emptyList,
          ]}
          ListEmptyComponent={
            <EmptyState icon="activity" title={t.activity.empty} subtitle={t.activity.emptyDesc} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: 40 },
  emptyList: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  action: { fontSize: 14, fontFamily: "Inter_500Medium" },
  user: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  time: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
