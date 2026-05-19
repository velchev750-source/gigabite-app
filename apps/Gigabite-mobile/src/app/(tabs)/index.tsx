import { Beef, CupSoda, Flame, Pizza, Sandwich, Utensils } from 'lucide-react-native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ProductCard } from '@/components/product-card';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { StatusBadge } from '@/components/status-badge';
import { GigabiteColors, Spacing } from '@/constants/theme';

const categories = [
  { label: 'Burgers', icon: Beef, color: GigabiteColors.amber },
  { label: 'Pizzas', icon: Pizza, color: GigabiteColors.rose },
  { label: 'Fries & Sides', icon: Utensils, color: GigabiteColors.emerald },
  { label: 'Drinks', icon: CupSoda, color: GigabiteColors.sky },
];

const popularProducts = [
  {
    name: 'Giga Smash Burger',
    description: 'Double beef, cheddar, pickles, and house sauce.',
    price: '$9.99',
    tag: 'Smash',
  },
  {
    name: 'Pepperoni Heat Pizza',
    description: 'Crispy crust, pepperoni, mozzarella, and chili oil.',
    price: '$12.49',
    tag: 'Pizza',
  },
  {
    name: 'Loaded Fries',
    description: 'Golden fries with cheese sauce, bacon, and herbs.',
    price: '$5.99',
    tag: 'Sides',
  },
];

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Good evening"
        title="What are you craving?"
        subtitle="Fresh Gigabite favorites are ready for your next order."
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Flame color={GigabiteColors.background} fill={GigabiteColors.background} size={30} />
          </View>
          <StatusBadge label="Combo deal" tone="amber" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroKicker}>Tonight special</Text>
          <Text style={styles.heroTitle}>Giga Smash Combo</Text>
          <Text style={styles.heroSubtitle}>
            Double smash burger, crispy fries, and an ice-cold drink for one hungry tap.
          </Text>
        </View>
        <View style={styles.heroFooter}>
          <View>
            <Text style={styles.heroPrice}>$14.99</Text>
            <Text style={styles.heroMeta}>Limited mobile preview</Text>
          </View>
          <View style={styles.heroButtonWrap}>
            <PrimaryButton label="View Menu" onPress={() => router.push('/menu')} />
          </View>
        </View>
      </View>

      <SectionTitle title="Quick categories" subtitle="Jump into the food groups that matter." />
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <CategoryCard key={category.label} {...category} />
        ))}
      </View>

      <SectionTitle title="Popular today" subtitle="Static previews for the first mobile shell." />
      <View style={styles.productList}>
        {popularProducts.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </View>

      <View style={styles.statusTeaser}>
        <View style={styles.statusIcon}>
          <Sandwich color={GigabiteColors.amber} size={24} />
        </View>
        <View style={styles.statusBody}>
          <Text style={styles.statusTitle}>Track every bite</Text>
          <Text style={styles.statusText}>
            After login, active order status and recent orders will appear in the Orders tab.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function CategoryCard({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
      <View style={[styles.categoryIcon, { backgroundColor: `${color}24` }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.four,
    overflow: 'hidden',
    padding: Spacing.four,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  heroText: {
    gap: Spacing.one,
  },
  heroKicker: {
    color: GigabiteColors.amber,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: GigabiteColors.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: GigabiteColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  heroPrice: {
    color: GigabiteColors.emerald,
    fontSize: 22,
    fontWeight: '900',
  },
  heroMeta: {
    color: GigabiteColors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  heroButtonWrap: {
    minWidth: 132,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    minHeight: 106,
    padding: Spacing.three,
    width: '48.8%',
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  categoryLabel: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  productList: {
    gap: Spacing.three,
  },
  statusTeaser: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amberSoft,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  statusBody: {
    flex: 1,
    gap: Spacing.one,
  },
  statusTitle: {
    color: GigabiteColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
