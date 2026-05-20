import { router } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getMobileAuthUser, loginMobileUser, type MobileAuthUser } from '@/lib/auth-api';
import { getAuthToken, removeAuthToken, saveAuthToken } from '@/lib/auth-storage';
import { blurActiveWebElement } from '@/lib/web-focus';
import { GigabiteColors, Spacing } from '@/constants/theme';

type AuthContextValue = {
  user: MobileAuthUser | null;
  token: string | null;
  isLoggingIn: boolean;
  isRestoringSession: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getAuthToken();

        if (!storedToken) {
          return;
        }

        const response = await getMobileAuthUser(storedToken);

        if (!response.user || response.user.role !== 'user') {
          await removeAuthToken();
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          setUser(response.user);
        }
      } catch {
        await removeAuthToken();
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoggingIn,
      isRestoringSession,
      login: async (input) => {
        setIsLoggingIn(true);

        try {
          const response = await loginMobileUser(input);
          await saveAuthToken(response.token);
          setUser(response.user);
          setToken(response.token);
        } finally {
          setIsLoggingIn(false);
        }
      },
      logout: async () => {
        await removeAuthToken();
        setUser(null);
        setToken(null);
        blurActiveWebElement();
        router.replace('/profile');
      },
    }),
    [isLoggingIn, isRestoringSession, token, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {isRestoringSession ? (
        <View style={styles.restoreScreen}>
          <ActivityIndicator color={GigabiteColors.amber} />
          <Text style={styles.restoreText}>Restoring session</Text>
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}

const styles = StyleSheet.create({
  restoreScreen: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.background,
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  restoreText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
});
