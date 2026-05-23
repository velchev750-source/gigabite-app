import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getCartItemKey,
  getCartItemName,
  getCartItemUnitPrice,
  useCart,
  type CartItem,
  type HotDealCartItem,
  type ProductCartItem,
} from '@/context/cart-context';
import { createMobileOrder } from '@/lib/orders-api';
import { blurActiveWebElement } from '@/lib/web-focus';

type DeliveryType = 'pickup' | 'delivery';

export default function CartScreen() {
  const cart = useCart();
  const { token, user } = useAuth();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authSessionKey = user && token ? `${user.id}:${token}` : null;

  useEffect(() => {
    if (user?.defaultDeliveryAddress && !deliveryAddress) {
      setDeliveryAddress(user.defaultDeliveryAddress);
    }
  }, [deliveryAddress, user?.defaultDeliveryAddress]);

  useEffect(() => {
    setDeliveryType('pickup');
    setDeliveryAddress(user?.defaultDeliveryAddress ?? '');
    setCustomerNote('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  }, [authSessionKey, user?.defaultDeliveryAddress]);

  const canSubmit = useMemo(
    () => cart.itemCount > 0 && !isSubmitting,
    [cart.itemCount, isSubmitting],
  );

  async function submitOrder() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user || !token) {
      setErrorMessage('Please log in from the Profile tab before checkout.');
      blurActiveWebElement();
      router.push('/profile');
      return;
    }

    if (user.role !== 'user') {
      setErrorMessage('Only customer accounts can place mobile orders.');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Delivery address is required for delivery orders.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createMobileOrder(
        {
          delivery_type: deliveryType,
          delivery_address: deliveryType === 'delivery' ? deliveryAddress.trim() : null,
          customer_note: customerNote.trim() || null,
          items: cart.items
            .filter((item): item is ProductCartItem => item.type === 'product')
            .map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
            })),
          hot_deals: cart.items
            .filter((item): item is HotDealCartItem => item.type === 'hotDeal')
            .map((item) => ({
              hot_deal_id: item.hotDeal.id,
              quantity: item.quantity,
            })),
        },
        token,
      );

      cart.clearCart();
      setCustomerNote('');
      blurActiveWebElement();
      router.replace({
        pathname: '/order-success',
        params: { orderId: String(response.order_id) },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!cart.items.length) {
    return (
      <ScreenContainer>
        <AppHeader
          eyebrow="Cart"
          title="Your order basket."
          subtitle="Add menu favorites, then confirm pickup or delivery."
        />
        <View style={styles.emptyCard}>
          <ShoppingCart color={GigabiteColors.amber} size={34} />
          <Text style={styles.title}>No items yet</Text>
          <Text style={styles.text}>Choose something delicious from the menu to start checkout.</Text>
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}
          <PrimaryButton
            label="Start from Menu"
            variant="secondary"
            onPress={() => {
              blurActiveWebElement();
              router.push('/menu');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenContainer>
        <AppHeader
          eyebrow="Cart"
          title="Review your order."
          subtitle="Checkout is delivery confirmation only. No payment provider is used."
        />

        <SectionTitle title="Order items" subtitle={`${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}`} />
        <View style={styles.list}>
          {cart.items.map((item) => (
            <CartLineItem key={getCartItemKey(item)} item={item} />
          ))}
        </View>

        <View style={styles.totalCard}>
          <SummaryRow label="Subtotal" value={formatPrice(cart.totalPrice)} />
          <SummaryRow label="Final total" value={formatPrice(cart.totalPrice)} isStrong />
        </View>

        <SectionTitle title="Checkout" subtitle="Confirm how you want to receive the order." />
        <View style={styles.checkoutCard}>
          <View style={styles.segmented}>
            <DeliveryOption
              label="Pickup"
              isActive={deliveryType === 'pickup'}
              onPress={() => setDeliveryType('pickup')}
            />
            <DeliveryOption
              label="Delivery"
              isActive={deliveryType === 'delivery'}
              onPress={() => setDeliveryType('delivery')}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Delivery address</Text>
            <TextInput
              editable={deliveryType === 'delivery'}
              multiline
              onChangeText={setDeliveryAddress}
              placeholder={deliveryType === 'delivery' ? 'Street, building, entrance...' : 'Not required for pickup'}
              placeholderTextColor={GigabiteColors.textSubtle}
              style={[styles.input, deliveryType === 'pickup' && styles.inputDisabled]}
              value={deliveryAddress}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Customer note</Text>
            <TextInput
              multiline
              onChangeText={setCustomerNote}
              placeholder="Optional note for the kitchen"
              placeholderTextColor={GigabiteColors.textSubtle}
              style={[styles.input, styles.noteInput]}
              value={customerNote}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        </View>

        <PrimaryButton label="Clear cart" variant="secondary" onPress={cart.clearCart} />
      </ScreenContainer>

      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutBarLabel}>Final total</Text>
          <Text style={styles.checkoutBarTotal}>{formatPrice(cart.totalPrice)}</Text>
        </View>
        <Pressable
          disabled={!canSubmit}
          onPress={() => void submitOrder()}
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
            pressed && canSubmit && styles.pressed,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color={GigabiteColors.background} />
          ) : (
            <>
              <CheckCircle2 color={GigabiteColors.background} size={18} />
              <Text style={styles.submitButtonText}>Submit order</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function CartLineItem({ item }: { item: CartItem }) {
  const cart = useCart();
  const itemName = getCartItemName(item);
  const itemUnitPrice = getCartItemUnitPrice(item);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemText}>
          <Text style={styles.itemName}>{itemName}</Text>
          {item.type === 'hotDeal' ? <Text style={styles.hotDealLabel}>Hot Deal</Text> : null}
          <Text style={styles.itemPrice}>{formatPrice(itemUnitPrice)} each</Text>
        </View>
        <Text style={styles.lineTotal}>{formatPrice(itemUnitPrice * item.quantity)}</Text>
      </View>
      {item.type === 'hotDeal' ? (
        <View style={styles.includedList}>
          {item.hotDeal.included_products.map((product) => (
            <Text key={product.id} style={styles.includedItem}>
              {product.name} x{product.quantity}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.itemActions}>
        <View style={styles.stepper}>
          <IconButton onPress={() => cart.decreaseCartItem(item)} icon="minus" />
          <Text style={styles.quantity}>{item.quantity}</Text>
          <IconButton onPress={() => cart.increaseCartItem(item)} icon="plus" />
        </View>
        <Pressable onPress={() => cart.removeCartItem(item)} style={styles.removeButton}>
          <Trash2 color={GigabiteColors.rose} size={18} />
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

function IconButton({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
  const Icon = icon === 'minus' ? Minus : Plus;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon color={GigabiteColors.text} size={16} />
    </Pressable>
  );
}

function DeliveryOption({
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
        styles.deliveryOption,
        isActive && styles.deliveryOptionActive,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.deliveryOptionText, isActive && styles.deliveryOptionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  isStrong,
}: {
  label: string;
  value: string;
  isStrong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isStrong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, isStrong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: GigabiteColors.background,
    flex: 1,
  },
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
  list: {
    gap: Spacing.two,
  },
  itemCard: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    color: GigabiteColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  itemPrice: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  hotDealLabel: {
    color: GigabiteColors.amber,
    fontSize: 12,
    fontWeight: '900',
    marginTop: Spacing.one,
    textTransform: 'uppercase',
  },
  includedList: {
    backgroundColor: GigabiteColors.amberSoft,
    borderColor: `${GigabiteColors.amber}33`,
    borderRadius: 10,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.two,
  },
  includedItem: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  lineTotal: {
    color: GigabiteColors.emerald,
    fontSize: 16,
    fontWeight: '900',
  },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: Spacing.one,
  },
  iconButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  quantity: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  removeText: {
    color: GigabiteColors.rose,
    fontSize: 13,
    fontWeight: '900',
  },
  totalCard: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryLabelStrong: {
    color: GigabiteColors.text,
    fontSize: 16,
  },
  summaryValue: {
    color: GigabiteColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryValueStrong: {
    color: GigabiteColors.emerald,
    fontSize: 18,
  },
  checkoutCard: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  segmented: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.one,
  },
  deliveryOption: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  deliveryOptionActive: {
    backgroundColor: GigabiteColors.amber,
  },
  deliveryOptionText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  deliveryOptionTextActive: {
    color: GigabiteColors.background,
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  inputLabel: {
    color: GigabiteColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: GigabiteColors.text,
    fontSize: 15,
    minHeight: 70,
    padding: Spacing.three,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: GigabiteColors.textSubtle,
    opacity: 0.65,
  },
  noteInput: {
    minHeight: 96,
  },
  errorText: {
    color: GigabiteColors.rose,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  successText: {
    color: GigabiteColors.emerald,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  checkoutBar: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 18,
    borderWidth: 1,
    bottom: 88,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    left: Spacing.three,
    padding: Spacing.two,
    position: 'absolute',
    right: Spacing.three,
  },
  checkoutBarLabel: {
    color: GigabiteColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  checkoutBarTotal: {
    color: GigabiteColors.emerald,
    fontSize: 18,
    fontWeight: '900',
    marginTop: Spacing.one,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 150,
    paddingHorizontal: Spacing.three,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: GigabiteColors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
