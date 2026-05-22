import { ImageIcon, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';
import type { MobileHotDeal } from '@/lib/hot-deals-api';

export function HotDealCard({
  hotDeal,
  onAdd,
  onPress,
}: {
  hotDeal: MobileHotDeal;
  onAdd: () => boolean | void;
  onPress?: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(hotDeal.image_url) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [hotDeal.image_url]);

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
        <View style={styles.labelPill}>
          <Text style={styles.labelText}>Hot Deal</Text>
        </View>
        <Text style={styles.name}>{hotDeal.name}</Text>
        {hotDeal.description ? <Text style={styles.description}>{hotDeal.description}</Text> : null}

        <View style={styles.includedList}>
          {hotDeal.included_products.map((product) => (
            <Text key={product.id} style={styles.includedItem}>
              {product.name} x{product.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.originalPrice}>{formatPrice(hotDeal.original_price)}</Text>
            <Text style={styles.discountedPrice}>{formatPrice(hotDeal.discounted_price)}</Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Plus color={GigabiteColors.background} size={18} />
            <Text style={styles.addButtonText}>Add Hot Deal</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GigabiteColors.card,
    borderColor: `${GigabiteColors.amber}55`,
    borderRadius: 16,
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
    borderRadius: 999,
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
    fontSize: 20,
    fontWeight: '900',
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
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  originalPrice: {
    color: GigabiteColors.textSubtle,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    color: GigabiteColors.emerald,
    fontSize: 19,
    fontWeight: '900',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
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
