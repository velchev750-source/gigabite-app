import { CheckCircle2, RefreshCcw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getMobileOrderDetails,
  type MobileDeliveryType,
  type MobileOrderDetails,
} from '@/lib/orders-api';
import { blurActiveWebElement } from '@/lib/web-focus';

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { token, user } = useAuth();
  const parsedOrderId = useMemo(() => Number(orderId), [orderId]);
  const [order, setOrder] = useState<MobileOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadOrder = useCallback(async () => {
    if (!token || !user || !Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      requestId.current += 1;
      setOrder(null);
      setErrorMessage('We could not load this order confirmation.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    const currentRequestId = ++requestId.current;

    try {
      const response = await getMobileOrderDetails(parsedOrderId, token);
      if (requestId.current !== currentRequestId) {
        return;
      }

      setOrder(response.order);
    } catch {
      if (requestId.current !== currentRequestId) {
        return;
      }

      setOrder(null);
      setErrorMessage('We could not load this order confirmation.');
    } finally {
      if (requestId.current === currentRequestId) {
        setIsLoading(false);
      }
    }
  }, [parsedOrderId, token, user]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const deliveryMessage = getDeliveryMessage(order?.delivery_type);

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <View style={styles.iconRing}>
          {isLoading ? (
            <ActivityIndicator color={GigabiteColors.background} />
          ) : errorMessage ? (
            <RefreshCcw color={GigabiteColors.background} size={34} />
          ) : (
            <CheckCircle2 color={GigabiteColors.background} size={38} />
          )}
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Checkout complete</Text>
          <Text style={styles.title}>{errorMessage ? 'Order confirmation' : 'Order accepted'}</Text>
          <Text style={styles.message}>
            {errorMessage ?? deliveryMessage}
          </Text>
          {order ? <Text style={styles.orderNumber}>Order #{order.id}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="View Orders"
            onPress={() => {
              blurActiveWebElement();
              router.replace('/orders');
            }}
          />
          <PrimaryButton
            label="Back to Menu"
            variant="secondary"
            onPress={() => {
              blurActiveWebElement();
              router.replace('/menu');
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function getDeliveryMessage(deliveryType?: MobileDeliveryType) {
  if (deliveryType === 'delivery') {
    return 'Your order has been accepted.\nYour order will be on its way soon.';
  }

  return 'Your order has been accepted.\nYour order will be waiting for you at our place.';
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.four,
    justifyContent: 'center',
    minHeight: 560,
    paddingVertical: Spacing.five,
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderColor: `${GigabiteColors.amber}55`,
    borderRadius: 999,
    borderWidth: 8,
    height: 98,
    justifyContent: 'center',
    shadowColor: GigabiteColors.amber,
    shadowOpacity: 0.32,
    shadowRadius: 24,
    width: 98,
  },
  copy: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.four,
    width: '100%',
  },
  eyebrow: {
    color: GigabiteColors.amber,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: GigabiteColors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: GigabiteColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  orderNumber: {
    color: GigabiteColors.emerald,
    fontSize: 15,
    fontWeight: '900',
    marginTop: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
    width: '100%',
  },
});
