import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
