import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { storage } from "@/lib/storage";

const TOKEN_KEY = "auth_token";

export interface AuthUser {
  id: string;
  iservUsername: string;
  displayName: string;
  email: string;
  role: "owner" | "admin" | "wachleiter" | "sanitaeter";
  customRoleId: string | null;
  customRole?: {
    id: string;
    name: string;
    color: string;
    permissions: string[];
  } | null;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  refreshUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  setSession: () => {},
  clearSession: () => {},
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storage.getItem(TOKEN_KEY).then((stored) => {
      if (stored) {
        setToken(stored);
        setAuthTokenGetter(() => stored);
      }
      setIsLoading(false);
    });
  }, []);

  const setSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    storage.setItem(TOKEN_KEY, newToken);
    setAuthTokenGetter(() => newToken);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.deleteItem(TOKEN_KEY);
    setAuthTokenGetter(() => null);
  }, []);

  const refreshUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        setSession,
        clearSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
