import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useGetMe } from "@workspace/api-client-react";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function Index() {
  const { isLoading, isAuthenticated, user, setSession, refreshUser } = useAuth();
  const { theme } = useTheme();

  const { data: me, isSuccess } = useGetMe({
    query: { enabled: isAuthenticated && !user, retry: false },
  });

  useEffect(() => {
    if (isSuccess && me && !user) {
      refreshUser(me as typeof user);
    }
  }, [isSuccess, me, user, refreshUser]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (user && !user.isActive) return <Redirect href="/pending" />;
  if (user?.isActive) return <Redirect href="/(tabs)/missions" />;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}
