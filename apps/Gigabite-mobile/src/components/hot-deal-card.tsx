import { ImageIcon, Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';
import type { MobileHotDeal } from '@/lib/hot-deals-api';

export function HotDealCard({
  hotDeal,
  onAdd,
  onPress,
}: {
  hotDeal: MobileHotDeal;
  onAdd: (quantity: number) => boolean | void;
  onPress?: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const shouldShowImage = Boolean(hotDeal.image_url) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [hotDeal.image_url]);

  function handleAdd(event: GestureResponderEvent) {
    event.stopPropagation();
    const wasAdded = onAdd(selectedQuantity);

    if (wasAdded !== false) {
      setSelectedQuantity(1);
    }
  }

  function decreaseQuantity(event: GestureResponderEvent) {
    event.stopPropagation();
    setSelectedQuantity((quantity) => Math.max(1, quantity - 1));
  }

  function increaseQuantity(event: GestureResponderEvent) {
    event.stopPropagation();
    setSelectedQuantity((quantity) => quantity + 1);
  }

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}>
      <View style={styles.imageWrap}>
        {shouldShowImage ? (
          <Image
            source={{ uri: hotDeal.image_url ?? '' }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImageIcon color={GigabiteColors.amber} size={34} />
            <Text style={styles.placeholderText}>Hot Deal</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{hotDeal.discount_percent}%</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <View style={styles.labelPill}>
              <Text style={styles.labelText}>Hot Deal</Text>
            </View>
            <Text style={styles.name}>{hotDeal.name}</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.originalPrice}>{formatPrice(hotDeal.original_price)}</Text>
            <Text style={styles.discountedPrice}>{formatPrice(hotDeal.discounted_price)}</Text>
          </View>
        </View>
        {hotDeal.description ? <Text style={styles.description}>{hotDeal.description}</Text> : null}

        <View style={styles.includedList}>
          {hotDeal.included_products.map((product) => (
            <Text key={product.id} style={styles.includedItem}>
              {product.name} x{product.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          <View style={styles.stepper}>
            <QuantityButton
              icon="minus"
              disabled={selectedQuantity === 1}
              onPress={decreaseQuantity}
            />
            <Text style={styles.quantity}>{selectedQuantity}</Text>
            <QuantityButton icon="plus" onPress={increaseQuantity} />
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Plus color={GigabiteColors.background} size={18} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function QuantityButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const Icon = icon === 'minus' ? Minus : Plus;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quantityButton,
        disabled && styles.quantityButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Icon color={disabled ? GigabiteColors.textSubtle : GigabiteColors.text} size={16} />
    </Pressable>
  );
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    backgroundColor: GigabiteColors.surface,
    height: 150,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amberSoft,
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  placeholderText: {
    color: GigabiteColors.amber,
    fontSize: 26,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: GigabiteColors.rose,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
  },
  badgeText: {
    color: GigabiteColors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  body: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.two,
  },
  labelPill: {
    alignSelf: 'flex-start',
    backgroundColor: GigabiteColors.amberSoft,
    borderColor: `${GigabiteColors.amber}66`,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  labelText: {
    color: GigabiteColors.amber,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  name: {
    color: GigabiteColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  description: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  includedList: {
    gap: Spacing.one,
  },
  includedItem: {
    color: GigabiteColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: Spacing.one,
  },
  quantityButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  quantityButtonDisabled: {
    opacity: 0.45,
  },
  quantity: {
    color: GigabiteColors.text,
    fontSize: 15,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  originalPrice: {
    color: GigabiteColors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    color: GigabiteColors.emerald,
    fontSize: 15,
    fontWeight: '900',
  },
  addButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 9,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  addButtonText: {
    color: GigabiteColors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
