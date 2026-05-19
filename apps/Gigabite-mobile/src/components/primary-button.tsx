import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: Spacing.three,
  },
  primary: {
    backgroundColor: GigabiteColors.amber,
  },
  secondary: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderWidth: 1,
  },
  label: {
    color: GigabiteColors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryLabel: {
    color: GigabiteColors.text,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
