/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { DarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const GigabiteColors = {
  background: '#09090b',
  surface: '#18181b',
  surfaceSoft: '#27272a',
  card: '#111113',
  border: 'rgba(255,255,255,0.10)',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
  amber: '#fbbf24',
  amberSoft: 'rgba(251,191,36,0.14)',
  rose: '#f43f5e',
  roseSoft: 'rgba(244,63,94,0.14)',
  emerald: '#34d399',
  emeraldSoft: 'rgba(52,211,153,0.14)',
  sky: '#38bdf8',
  skySoft: 'rgba(56,189,248,0.14)',
} as const;

export const GigabiteNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: GigabiteColors.amber,
    background: GigabiteColors.background,
    card: GigabiteColors.surface,
    text: GigabiteColors.text,
    border: GigabiteColors.border,
    notification: GigabiteColors.rose,
  },
};

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: GigabiteColors.text,
    background: GigabiteColors.background,
    backgroundElement: GigabiteColors.surface,
    backgroundSelected: GigabiteColors.surfaceSoft,
    textSecondary: GigabiteColors.textMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
