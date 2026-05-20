import { ArrowLeft, RefreshCcw, ReceiptText } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  getOrderStatusTone,
  isCancellableOrder,
} from '@/lib/order-display';
import {
  getMobileOrderDetails,
  requestMobileOrderCancellation,
  type MobileOrderDetails,
} from '@/lib/orders-api';
import { blurActiveWebElement } from '@/lib/web-focus';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { token, user } = useAuth();
  const parsedOrderId = useMemo(() => Number(orderId), [orderId]);
  const [order, setOrder] = useState<MobileOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  async function loadOrder() {
    if (!token || !user || !Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMobileOrderDetails(parsedOrderId, token);
      setOrder(response.order);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order details could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOrderId, token, user]);

  async function confirmCancelRequest() {
    if (!token || !order) {
      return;
    }

    setIsCanceling(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestMobileOrderCancellation(order.id, token);
      setSuccessMessage(`Cancellation requested for order #${order.id}.`);
      setIsConfirmVisible(false);
      await loadOrder();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Cancellation request failed.');
    } finally {
      setIsCanceling(false);
    }
  }

  if (!user || !token) {
    return (
      <ScreenContainer>
        <BackButton />
        <AppHeader
          eyebrow="Order details"
          title="Login required."
          subtitle="Sign in as a customer to view this order."
        />
        <PrimaryButton label="Go to Profile" variant="secondary" onPress={() => router.push('/profile')} />
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <BackButton />
        <AppHeader
          eyebrow="Order details"
          title={order ? `Order #${order.id}` : 'Order details'}
          subtitle="Review delivery details, items, notes, and status."
        />

        {isLoading ? <LoadingState /> : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <RefreshCcw color={GigabiteColors.rose} size={24} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {!isLoading && order ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <StatusBadge label={formatOrderStatus(order.status)} tone={getOrderStatusTone(order.status)} />
                <Text style={styles.total}>{formatPrice(order.total_price)}</Text>
              </View>
              <InfoRow label="Created" value={formatOrderDate(order.created_at)} />
              <InfoRow label="Updated" value={formatOrderDate(order.updated_at)} />
              <InfoRow label="Delivery type" value={order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'} />
              {order.delivery_type === 'delivery' && order.delivery_address ? (
                <InfoRow label="Address" value={order.delivery_address} />
              ) : null}
              {order.customer_note ? <InfoRow label="Your note" value={order.customer_note} /> : null}
              {order.manager_note ? <InfoRow label="Manager note" value={order.manager_note} /> : null}
            </View>

            <SectionTitle title="Items" subtitle={`${order.items.length} item${order.items.length === 1 ? '' : 's'}`} />
            <View style={styles.itemsList}>
              {order.items.map((item) => (
                <View key={`${item.product_name}-${item.quantity}-${item.line_total}`} style={styles.itemRow}>
                  <View style={styles.itemText}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} x {formatPrice(item.unit_price)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatPrice(item.line_total)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Order total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total_price)}</Text>
            </View>

            {isCancellableOrder(order.status) ? (
              <Pressable
                onPress={() => setIsConfirmVisible(true)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {!isLoading && !order && !errorMessage ? (
          <View style={styles.stateCard}>
            <ReceiptText color={GigabiteColors.textMuted} size={30} />
            <Text style={styles.stateTitle}>Order not found</Text>
            <Text style={styles.stateText}>This order may not belong to your account.</Text>
          </View>
        ) : null}
      </ScreenContainer>

      <ConfirmDialog
        isVisible={isConfirmVisible}
        title="Request cancellation?"
        message={`Order #${order?.id ?? ''} can be cancelled only after manager approval. Send the request now?`}
        confirmLabel="Request"
        isLoading={isCanceling}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={() => void confirmCancelRequest()}
      />
    </>
  );
}

function BackButton() {
  return (
    <Pressable
      onPress={() => {
        blurActiveWebElement();
        router.back();
      }}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
      <ArrowLeft color={GigabiteColors.text} size={18} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={GigabiteColors.amber} />
      <Text style={styles.stateTitle}>Loading order</Text>
      <Text style={styles.stateText}>Fetching the latest details.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 42,
    paddingHorizontal: Spacing.three,
  },
  backText: {
    color: GigabiteColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryCard: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  total: {
    color: GigabiteColors.emerald,
    fontSize: 22,
    fontWeight: '900',
  },
  infoRow: {
    gap: Spacing.one,
  },
  infoLabel: {
    color: GigabiteColors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: GigabiteColors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  itemsList: {
    gap: Spacing.two,
  },
  itemRow: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  itemMeta: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  itemTotal: {
    color: GigabiteColors.emerald,
    fontSize: 15,
    fontWeight: '900',
  },
  totalCard: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  totalLabel: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  totalValue: {
    color: GigabiteColors.emerald,
    fontSize: 20,
    fontWeight: '900',
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
    backgroundColor: GigabiteColors.emeraldSoft,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
  },
  successText: {
    color: GigabiteColors.emerald,
    fontSize: 13,
    fontWeight: '900',
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
