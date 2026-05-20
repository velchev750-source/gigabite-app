import { CheckCircle2, RefreshCcw, ReceiptText } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { StatusBadge } from '@/components/status-badge';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  formatOrderDate,
  formatOrderStatus,
  formatPrice,
  getItemsSummary,
  getOrderStatusTone,
  isCancellableOrder,
} from '@/lib/order-display';
import {
  getMobileOrders,
  requestMobileOrderCancellation,
  type MobileOrderSummary,
} from '@/lib/orders-api';
import { blurActiveWebElement } from '@/lib/web-focus';

type OrdersSection = 'active' | 'history';

export default function OrdersScreen() {
  const { createdOrderId } = useLocalSearchParams<{ createdOrderId?: string }>();
  const { token, user } = useAuth();
  const [activeSection, setActiveSection] = useState<OrdersSection>('active');
  const [activeOrders, setActiveOrders] = useState<MobileOrderSummary[]>([]);
  const [historyOrders, setHistoryOrders] = useState<MobileOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    createdOrderId ? `Order #${createdOrderId} is pending approval.` : null,
  );
  const [orderToCancel, setOrderToCancel] = useState<MobileOrderSummary | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token || !user) {
      setActiveOrders([]);
      setHistoryOrders([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMobileOrders(token);
      setActiveOrders(response.active_orders);
      setHistoryOrders(response.history_orders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Orders could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  async function confirmCancelRequest() {
    if (!orderToCancel || !token) {
      return;
    }

    setIsCanceling(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestMobileOrderCancellation(orderToCancel.id, token);
      setSuccessMessage(`Cancellation requested for order #${orderToCancel.id}.`);
      setOrderToCancel(null);
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Cancellation request failed.');
    } finally {
      setIsCanceling(false);
    }
  }

  if (!user || !token) {
    return (
      <ScreenContainer>
        <AppHeader
          eyebrow="Orders"
          title="Track every bite."
          subtitle="Log in as a customer to see active orders and history."
        />
        <View style={styles.stateCard}>
          <ReceiptText color={GigabiteColors.amber} size={32} />
          <Text style={styles.stateTitle}>Login required</Text>
          <Text style={styles.stateText}>Your orders are tied to your customer account.</Text>
          <PrimaryButton
            label="Go to Profile"
            variant="secondary"
            onPress={() => {
              blurActiveWebElement();
              router.push('/profile');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  const visibleOrders = activeSection === 'active' ? activeOrders : historyOrders;

  return (
    <>
      <ScreenContainer>
        <AppHeader
          eyebrow="Orders"
          title="Track every bite."
          subtitle="Follow active orders, review history, and request cancellation when available."
        />

        {successMessage ? (
          <View style={styles.successCard}>
            <CheckCircle2 color={GigabiteColors.emerald} size={24} />
            <View style={styles.successTextWrap}>
              <Text style={styles.successTitle}>Updated</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <RefreshCcw color={GigabiteColors.rose} size={24} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.segmented}>
          <SegmentButton
            label="Active"
            isActive={activeSection === 'active'}
            onPress={() => setActiveSection('active')}
          />
          <SegmentButton
            label="History"
            isActive={activeSection === 'history'}
            onPress={() => setActiveSection('history')}
          />
        </View>

        <SectionTitle
          title={activeSection === 'active' ? 'Active orders' : 'Order history'}
          subtitle={`${visibleOrders.length} order${visibleOrders.length === 1 ? '' : 's'}`}
        />

        {isLoading ? <LoadingState /> : null}

        {!isLoading && visibleOrders.length ? (
          <View style={styles.list}>
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showCancel={activeSection === 'active' && isCancellableOrder(order.status)}
                onCancel={() => setOrderToCancel(order)}
              />
            ))}
          </View>
        ) : null}

        {!isLoading && !visibleOrders.length ? (
          <EmptyState section={activeSection} onRefresh={() => void loadOrders()} />
        ) : null}
      </ScreenContainer>

      <ConfirmDialog
        isVisible={Boolean(orderToCancel)}
        title="Request cancellation?"
        message={`Order #${orderToCancel?.id ?? ''} can be cancelled only after manager approval. Send the request now?`}
        confirmLabel="Request"
        isLoading={isCanceling}
        onCancel={() => setOrderToCancel(null)}
        onConfirm={() => void confirmCancelRequest()}
      />
    </>
  );
}

function OrderCard({
  order,
  showCancel,
  onCancel,
}: {
  order: MobileOrderSummary;
  showCancel: boolean;
  onCancel: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.id}>Order #{order.id}</Text>
        <StatusBadge label={formatOrderStatus(order.status)} tone={getOrderStatusTone(order.status)} />
      </View>
      <Text style={styles.total}>{formatPrice(order.total_price)}</Text>
      <Text style={styles.meta}>
        {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'} · {formatOrderDate(order.created_at)}
      </Text>
      <Text style={styles.summary}>{getItemsSummary(order.items)}</Text>
      <View style={styles.cardActions}>
        <PrimaryButton
          label="View Details"
          variant="secondary"
          onPress={() => {
            blurActiveWebElement();
            router.push({
              pathname: '/orders/[orderId]',
              params: { orderId: String(order.id) },
            });
          }}
        />
        {showCancel ? (
          <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        isActive && styles.segmentButtonActive,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={GigabiteColors.amber} />
      <Text style={styles.stateTitle}>Loading orders</Text>
      <Text style={styles.stateText}>Checking your latest order activity.</Text>
    </View>
  );
}

function EmptyState({
  section,
  onRefresh,
}: {
  section: OrdersSection;
  onRefresh: () => void;
}) {
  return (
    <View style={styles.stateCard}>
      <ReceiptText color={GigabiteColors.textMuted} size={30} />
      <Text style={styles.stateTitle}>
        {section === 'active' ? 'No active orders' : 'No order history'}
      </Text>
      <Text style={styles.stateText}>
        {section === 'active'
          ? 'New checkout orders will appear here while they are being handled.'
          : 'Completed and cancelled orders will appear here.'}
      </Text>
      <PrimaryButton label="Refresh" variant="secondary" onPress={onRefresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.one,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentButtonActive: {
    backgroundColor: GigabiteColors.amber,
  },
  segmentText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: GigabiteColors.background,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  id: {
    color: GigabiteColors.textSubtle,
    fontSize: 13,
    fontWeight: '900',
  },
  total: {
    color: GigabiteColors.emerald,
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  summary: {
    color: GigabiteColors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  cardActions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.roseSoft,
    borderColor: GigabiteColors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: Spacing.three,
  },
  cancelButtonText: {
    color: GigabiteColors.rose,
    fontSize: 15,
    fontWeight: '900',
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
  errorCard: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.roseSoft,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  errorText: {
    color: GigabiteColors.rose,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  stateTitle: {
    color: GigabiteColors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
