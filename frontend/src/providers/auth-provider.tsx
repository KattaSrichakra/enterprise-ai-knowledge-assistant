"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createSession,
  logout as clearSession,
  restoreSession,
} from "@/lib/auth/session";
import {
  loginUser,
  registerUser,
} from "@/lib/api/auth";
import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restore = useCallback(async () => {
    try {
      const session = await restoreSession();

      if (session) {
        setUser(session.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const tokenResponse = await loginUser(data);

      const session = await createSession(
        tokenResponse.access_token,
      );

      setUser(session.user);
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      await registerUser(data);

      const tokenResponse = await loginUser({
        email: data.email,
        password: data.password,
      });

      const session = await createSession(
        tokenResponse.access_token,
      );

      setUser(session.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}