import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@chaosgachaplus/shared";
import { apiFetch, ApiError } from "../api/client";

interface Credentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | undefined;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  registerError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_QUERY_KEY = ["auth", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery<AuthUser | undefined>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await apiFetch<AuthUser>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return undefined;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: Credentials) =>
      apiFetch<AuthUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: Credentials) =>
      apiFetch<AuthUser>("/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => queryClient.setQueryData(ME_QUERY_KEY, undefined),
  });

  const value: AuthContextValue = {
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    login: async (credentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    register: async (credentials) => {
      await registerMutation.mutateAsync(credentials);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    loginError: loginMutation.error instanceof ApiError ? loginMutation.error.message : null,
    registerError: registerMutation.error instanceof ApiError ? registerMutation.error.message : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
