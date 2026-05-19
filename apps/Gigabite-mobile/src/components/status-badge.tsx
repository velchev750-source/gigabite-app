import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

type BadgeTone = 'amber' | 'emerald' | 'rose' | 'sky' | 'zinc';

export function StatusBadge({ label, tone = 'amber' }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={[styles.label, labelStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
  },
});

const toneStyles = StyleSheet.create({
  amber: { backgroundColor: GigabiteColors.amberSoft },
  emerald: { backgroundColor: GigabiteColors.emeraldSoft },
  rose: { backgroundColor: GigabiteColors.roseSoft },
  sky: { backgroundColor: GigabiteColors.skySoft },
  zinc: { backgroundColor: GigabiteColors.surfaceSoft },
});

const labelStyles = StyleSheet.create({
  amber: { color: GigabiteColors.amber },
  emerald: { color: GigabiteColors.emerald },
  rose: { color: GigabiteColors.rose },
  sky: { color: GigabiteColors.sky },
  zinc: { color: GigabiteColors.textMuted },
});
