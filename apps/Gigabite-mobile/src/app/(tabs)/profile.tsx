import { MapPin, Phone, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { GigabiteColors, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Profile"
        title="Customer account."
        subtitle="Authentication and saved profile details will be connected in a later pass."
      />
      <SectionTitle title="Profile preview" subtitle="Mobile app stays customer-only." />
      <View style={styles.card}>
        <ProfileRow icon={<UserRound color={GigabiteColors.amber} size={22} />} label="Name" value="Guest customer" />
        <ProfileRow icon={<Phone color={GigabiteColors.emerald} size={22} />} label="Phone" value="Not connected" />
        <ProfileRow icon={<MapPin color={GigabiteColors.rose} size={22} />} label="Default address" value="Not connected" />
      </View>
      <PrimaryButton label="Login Coming Soon" />
    </ScreenContainer>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rowText: {
    flex: 1,
  },
  label: {
    color: GigabiteColors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
});
