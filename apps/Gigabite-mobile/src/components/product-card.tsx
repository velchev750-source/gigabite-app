import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GigabiteColors, Spacing } from '@/constants/theme';

export function ProductCard({
  name,
  description,
  price,
  tag,
  onAdd,
}: {
  name: string;
  description: string;
  price: string;
  tag?: string;
  onAdd?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageText}>{tag ?? 'Hot'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Plus color={GigabiteColors.background} size={18} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </View>
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
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.roseSoft,
    height: 118,
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
  addButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 9,
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
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
