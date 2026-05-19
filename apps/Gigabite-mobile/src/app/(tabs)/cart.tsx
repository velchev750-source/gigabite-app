import { ShoppingCart } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { GigabiteColors, Spacing } from '@/constants/theme';

export default function CartScreen() {
  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Cart"
        title="Your order basket."
        subtitle="Cart state and checkout will be connected after the API client and auth flow are added."
      />
      <SectionTitle title="Current cart" subtitle="Empty placeholder state." />
      <View style={styles.emptyCard}>
        <ShoppingCart color={GigabiteColors.amber} size={34} />
        <Text style={styles.title}>No items yet</Text>
        <Text style={styles.text}>Menu selections will appear here before checkout.</Text>
        <PrimaryButton label="Start from Menu" variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  text: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
