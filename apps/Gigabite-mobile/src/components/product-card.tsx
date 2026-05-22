import { ImageIcon, Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function ProductCard({
  name,
  description,
  price,
  tag,
  imageUrl,
  onAdd,
}: {
  name: string;
  description: string;
  price: string;
  tag?: string;
  imageUrl?: string | null;
  onAdd?: (quantity: number) => boolean | void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const shouldShowImage = Boolean(imageUrl) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  function handleAdd() {
    const wasAdded = onAdd?.(selectedQuantity);

    if (wasAdded !== false) {
      setSelectedQuantity(1);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {shouldShowImage ? (
          <Image
            source={{ uri: imageUrl ?? '' }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImageIcon color={GigabiteColors.rose} size={34} />
            <Text style={styles.imageText}>{tag ?? 'Hot'}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>
          <View style={styles.stepper}>
            <QuantityButton
              icon="minus"
              disabled={selectedQuantity === 1}
              onPress={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
            />
            <Text style={styles.quantity}>{selectedQuantity}</Text>
            <QuantityButton icon="plus" onPress={() => setSelectedQuantity((quantity) => quantity + 1)} />
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Plus color={GigabiteColors.background} size={18} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function QuantityButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  disabled?: boolean;
  onPress: () => void;
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
    backgroundColor: GigabiteColors.roseSoft,
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  imageText: {
    color: GigabiteColors.rose,
    fontSize: 28,
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
  name: {
    color: GigabiteColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  price: {
    color: GigabiteColors.emerald,
    fontSize: 15,
    fontWeight: '900',
  },
  description: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
  addText: {
    color: GigabiteColors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
