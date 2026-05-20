import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { GigabiteNavigationTheme } from '@/constants/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={GigabiteNavigationTheme}>
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="light" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
