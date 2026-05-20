import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { loginMobileUser, type MobileAuthUser } from '@/lib/auth-api';

type AuthContextValue = {
  user: MobileAuthUser | null;
  token: string | null;
  isLoggingIn: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoggingIn,
      login: async (input) => {
        setIsLoggingIn(true);

        try {
          const response = await loginMobileUser(input);
          setUser(response.user);
          setToken(response.token);
        } finally {
          setIsLoggingIn(false);
        }
      },
      logout: () => {
        setUser(null);
        setToken(null);
      },
    }),
    [isLoggingIn, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}
