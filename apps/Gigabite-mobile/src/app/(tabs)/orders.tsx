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
  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Orders"
        title="Track every bite."
        subtitle="Customer order history and active status will live here."
      />
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
