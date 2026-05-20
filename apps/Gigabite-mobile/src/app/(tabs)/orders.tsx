import { CheckCircle2 } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { StatusBadge } from '@/components/status-badge';
import { GigabiteColors, Spacing } from '@/constants/theme';

const orders = [
  { id: '#1024', title: 'Classic Burger combo', total: '$14.97', status: 'Pending approval' },
  { id: '#1023', title: 'Pepperoni Pizza', total: '$13.98', status: 'In progress' },
];

export default function OrdersScreen() {
  const { createdOrderId } = useLocalSearchParams<{ createdOrderId?: string }>();

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Orders"
        title="Track every bite."
        subtitle="Customer order history and active status will live here."
      />
      {createdOrderId ? (
        <View style={styles.successCard}>
          <CheckCircle2 color={GigabiteColors.emerald} size={24} />
          <View style={styles.successTextWrap}>
            <Text style={styles.successTitle}>Order submitted</Text>
            <Text style={styles.successText}>
              Order #{createdOrderId} is pending approval.
            </Text>
          </View>
        </View>
      ) : null}
      <SectionTitle title="Recent orders" subtitle="Placeholder cards for the customer order flow." />
      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.id}>{order.id}</Text>
            <StatusBadge
              label={order.status}
              tone={order.status === 'In progress' ? 'sky' : 'amber'}
            />
          </View>
          <Text style={styles.title}>{order.title}</Text>
          <Text style={styles.total}>{order.total}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.emeraldSoft,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  successTextWrap: {
    flex: 1,
  },
  successTitle: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  successText: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  id: {
    color: GigabiteColors.textSubtle,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  total: {
    color: GigabiteColors.emerald,
    fontSize: 16,
    fontWeight: '900',
  },
});
