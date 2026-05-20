import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel,
  isLoading,
  onCancel,
  onConfirm,
}: {
  isVisible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <DialogButton label="Keep order" onPress={onCancel} variant="secondary" disabled={isLoading} />
            <DialogButton label={isLoading ? 'Sending...' : confirmLabel} onPress={onConfirm} disabled={isLoading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DialogButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : styles.primaryButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  dialog: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
    maxWidth: 420,
    padding: Spacing.four,
    width: '100%',
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  message: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: Spacing.two,
  },
  primaryButton: {
    backgroundColor: GigabiteColors.amber,
  },
  secondaryButton: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderWidth: 1,
  },
  buttonText: {
    color: GigabiteColors.background,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: GigabiteColors.text,
  },
  disabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
