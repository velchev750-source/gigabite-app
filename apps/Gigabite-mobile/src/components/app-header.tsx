import { Flame } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function AppHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <Flame color={GigabiteColors.background} fill={GigabiteColors.background} size={22} />
        </View>
        <Text style={styles.brand}>Gigabite</Text>
      </View>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brand: {
    color: GigabiteColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  eyebrow: {
    color: GigabiteColors.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: Spacing.three,
    textTransform: 'uppercase',
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  subtitle: {
    color: GigabiteColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
});
