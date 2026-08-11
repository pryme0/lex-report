import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getErrorMessage, setTokens, clearTokens, isAuthenticated } from "./axios";

export interface User {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: string;
  editor: boolean;
  firmId: string | null;
  workspace: string;
  accountRole: string;
  jurisdiction: string;
  planName: string;
  seatsActive: number;
  planDescription: string;
  emailVerified: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export function useUser({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>("/auth/me");
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

/** Resolves the persistent browser token against the API before treating a visitor as signed in. */
export function useAuthSession() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(isAuthenticated());
  }, []);

  const userQuery = useUser({ enabled: hasToken === true });
  const isLoading = hasToken === null || (hasToken === true && userQuery.isLoading);

  return {
    user: userQuery.data ?? null,
    isAuthenticated: hasToken === true && Boolean(userQuery.data),
    isLoading,
  };
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await api.post<{ message: string }>("/auth/signup", data);
      return response.data;
    },
    onSuccess: () => {
      router.push("/login?verified=pending");
    },
    onError: (error) => {
      console.error("Signup error:", getErrorMessage(error));
    },
  });
}

interface SigninResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export function useSignin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SigninData) => {
      const response = await api.post<SigninResponse>("/auth/signin", data);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Signin error:", getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } catch {
        // Ignore errors - we're logging out anyway
      }
    },
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
      router.push("/login");
    },
  });
}

export { isAuthenticated };

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post<{ message: string }>("/auth/forgot-password", { email });
      return response.data;
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await api.post<{ message: string }>("/auth/reset-password", { token, password });
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => router.push("/login"), 2000);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
      return response.data;
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post<{ message: string }>("/auth/resend-verification", { email });
      return response.data;
    },
  });
}
