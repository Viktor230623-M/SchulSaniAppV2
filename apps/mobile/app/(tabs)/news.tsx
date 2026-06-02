import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetNews,
  getGetNewsQueryKey,
  useCreateNews,
  useDeleteNews,
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
import type { NewsPost } from "@workspace/api-client-react";

export default function NewsScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const { can } = usePermissions();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const { data: posts, isLoading, refetch } = useGetNews();
  const { mutate: createPost, isPending: creating } = useCreateNews();
  const { mutate: deletePost } = useDeleteNews();

  const sorted = [...(posts ?? [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreate = () => {
    if (!title || !content) return;
    createPost(
      { data: { title, content, isPinned } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetNewsQueryKey() });
          setShowModal(false);
          setTitle("");
          setContent("");
          setIsPinned(false);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deletePost({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetNewsQueryKey() }) });
  };

  const renderItem = ({ item }: { item: NewsPost }) => (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {item.isPinned && (
            <Feather name="bookmark" size={14} color={theme.warning} style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.postTitle, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        {can("news.manage") && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
            <Feather name="trash-2" size={14} color={theme.danger} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.content, { color: theme.textSecondary }]} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.author, { color: theme.textMuted }]}>
          {t.news.by} {item.authorName}
        </Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.isPinned && (
        <View style={{ marginTop: 4 }}>
          <Badge label={t.news.pinned} variant="warning" />
        </View>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={t.news.title}
        action={can("news.post") ? { icon: "plus", onPress: () => setShowModal(true) } : undefined}
      />

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, sorted.length === 0 && styles.emptyList]}
          scrollEnabled={sorted.length > 0}
          ListEmptyComponent={<EmptyState icon="bell" title={t.news.empty} subtitle={t.news.emptyDesc} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.primary} />}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.news.new}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Input label={t.news.titleLabel} value={title} onChangeText={setTitle} placeholder={t.news.titlePlaceholder} />
              <Input label={t.news.content} value={content} onChangeText={setContent} placeholder={t.news.contentPlaceholder} multiline numberOfLines={5} />
              <View style={[styles.switchRow, { borderColor: theme.border }]}>
                <Text style={[styles.switchLabel, { color: theme.textSecondary }]}>{t.news.pin}</Text>
                <Switch value={isPinned} onValueChange={setIsPinned} trackColor={{ true: theme.primary }} />
              </View>
              <Button label={creating ? t.news.submitting : t.news.submit} onPress={handleCreate} loading={creating} />
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", flex: 1, marginRight: 8 },
  postTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  content: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  author: { fontSize: 12, fontFamily: "Inter_400Regular" },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, padding: spacing.md, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md },
  switchLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
