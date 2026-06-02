import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function Index() {
  const { isLoading, isAuthenticated, user, clearSession, refreshUser } = useAuth();
  const { theme } = useTheme();

  const { data: me, isSuccess, isError } = useGetMe({
    query: { enabled: isAuthenticated && !user, retry: false, queryKey: getGetMeQueryKey() },
  });

  useEffect(() => {
    if (isSuccess && me && !user) {
      refreshUser(me);
    }
  }, [isSuccess, me, user, refreshUser]);

  useEffect(() => {
    if (isError) clearSession();
  }, [isError, clearSession]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (user && !user.isActive) return <Redirect href="/pending" />;
  if (user?.isActive) return <Redirect href="/(tabs)/news" />;

  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
