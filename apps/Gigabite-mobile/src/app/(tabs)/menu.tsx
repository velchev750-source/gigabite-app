import { ImageIcon, Minus, Plus, RefreshCcw, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { StatusBadge } from '@/components/status-badge';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useCart } from '@/context/cart-context';
import { getMobileMenu, type MobileMenuCategory, type MobileMenuProduct } from '@/lib/menu-api';
import { blurActiveWebElement } from '@/lib/web-focus';

export default function MenuScreen() {
  const [categories, setCategories] = useState<MobileMenuCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cart = useCart();

  async function loadMenu() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMobileMenu();
      setCategories(response.categories);
    } catch {
      setErrorMessage('Could not load the Gigabite menu. Check the API URL and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
  }, []);

  const products = useMemo(() => {
    const allProducts = categories.flatMap((category) => category.products);

    if (activeCategoryId === 'all') {
      return allProducts;
    }

    return allProducts.filter((product) => product.category_id === activeCategoryId);
  }, [activeCategoryId, categories]);

  return (
    <View style={styles.screen}>
      <ScreenContainer>
        <AppHeader
          eyebrow="Menu"
          title="Pick your next bite."
          subtitle="Browse active Gigabite categories and products from the web API."
        />

        {isLoading ? <LoadingState /> : null}

        {!isLoading && errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadMenu()} />
        ) : null}

        {!isLoading && !errorMessage && !categories.length ? <EmptyState /> : null}

        {!isLoading && !errorMessage && categories.length ? (
          <>
            <SectionTitle title="Categories" subtitle="Filter the menu by craving." />
            <CategoryTabs
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelect={setActiveCategoryId}
            />

            <SectionTitle
              title={activeCategoryId === 'all' ? 'All products' : getCategoryName(categories, activeCategoryId)}
              subtitle={`${products.length} item${products.length === 1 ? '' : 's'} available`}
            />

            {products.length ? (
              <View style={styles.productList}>
                {products.map((product) => {
                  const quantity = cart.getQuantity(product.id);

                  return (
                    <MenuProductCard
                      key={product.id}
                      product={product}
                      quantity={quantity}
                      onAdd={() => cart.addItem(product)}
                      onDecrease={() => cart.decreaseItem(product)}
                      onIncrease={() => cart.increaseItem(product)}
                    />
                  );
                })}
              </View>
            ) : (
              <EmptyState message="No active products in this category yet." />
            )}
          </>
        ) : null}
      </ScreenContainer>

      {cart.itemCount > 0 ? (
        <FloatingCartSummary
          totalItems={cart.itemCount}
          totalPrice={cart.totalPrice}
          onPress={() => {
            blurActiveWebElement();
            router.push('/cart');
          }}
        />
      ) : null}
    </View>
  );
}

function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: MobileMenuCategory[];
  activeCategoryId: number | 'all';
  onSelect: (categoryId: number | 'all') => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabs}>
      <CategoryTab label="All" isActive={activeCategoryId === 'all'} onPress={() => onSelect('all')} />
      {categories.map((category) => (
        <CategoryTab
          key={category.id}
          label={category.name}
          isActive={activeCategoryId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}

function CategoryTab({
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
        styles.categoryTab,
        isActive && styles.categoryTabActive,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MenuProductCard({
  product,
  quantity,
  onAdd,
  onDecrease,
  onIncrease,
}: {
  product: MobileMenuProduct;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <ImageIcon color={GigabiteColors.rose} size={34} />
            <Text style={styles.productImageText}>{product.category_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.productBody}>
        <View style={styles.productMetaRow}>
          <StatusBadge label={product.category_name} tone={getBadgeTone(product.category_name)} />
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description || 'Fresh Gigabite favorite from the active menu.'}
        </Text>

        <View style={styles.productActions}>
          <View style={styles.stepper}>
            <StepperButton icon="minus" disabled={quantity === 0} onPress={onDecrease} />
            <Text style={styles.quantity}>{quantity}</Text>
            <StepperButton icon="plus" onPress={onIncrease} />
          </View>
          <Pressable onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Plus color={GigabiteColors.background} size={18} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function StepperButton({
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
        styles.stepperButton,
        disabled && styles.stepperButtonDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Icon color={disabled ? GigabiteColors.textSubtle : GigabiteColors.text} size={16} />
    </Pressable>
  );
}

function FloatingCartSummary({
  totalItems,
  totalPrice,
  onPress,
}: {
  totalItems: number;
  totalPrice: number;
  onPress: () => void;
}) {
  return (
    <View style={styles.floatingCart}>
      <View style={styles.floatingCartInfo}>
        <View style={styles.cartIcon}>
          <ShoppingCart color={GigabiteColors.background} size={20} />
        </View>
        <View>
          <Text style={styles.cartTitle}>
            {totalItems} item{totalItems === 1 ? '' : 's'}
          </Text>
          <Text style={styles.cartPrice}>{formatPrice(totalPrice)}</Text>
        </View>
      </View>
      <PrimaryButton label="Cart" onPress={onPress} />
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={GigabiteColors.amber} />
      <Text style={styles.stateTitle}>Loading menu</Text>
      <Text style={styles.stateText}>Fetching active categories and products.</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.stateCard}>
      <RefreshCcw color={GigabiteColors.rose} size={28} />
      <Text style={styles.stateTitle}>Menu unavailable</Text>
      <Text style={styles.stateText}>{message}</Text>
      <PrimaryButton label="Retry" variant="secondary" onPress={onRetry} />
    </View>
  );
}

function EmptyState({ message = 'No active menu items are available yet.' }: { message?: string }) {
  return (
    <View style={styles.stateCard}>
      <ShoppingCart color={GigabiteColors.textMuted} size={28} />
      <Text style={styles.stateTitle}>Nothing to show</Text>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

function getCategoryName(categories: MobileMenuCategory[], categoryId: number | 'all') {
  if (categoryId === 'all') {
    return 'All products';
  }

  return categories.find((category) => category.id === categoryId)?.name ?? 'Products';
}

function getBadgeTone(categoryName: string): 'amber' | 'emerald' | 'rose' | 'sky' | 'zinc' {
  const normalizedName = categoryName.toLowerCase();

  if (normalizedName.includes('pizza')) {
    return 'rose';
  }

  if (normalizedName.includes('fries') || normalizedName.includes('side')) {
    return 'emerald';
  }

  if (normalizedName.includes('drink')) {
    return 'sky';
  }

  return 'amber';
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: GigabiteColors.background,
    flex: 1,
  },
  categoryTabs: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  categoryTab: {
    backgroundColor: GigabiteColors.surface,
    borderColor: GigabiteColors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  categoryTabActive: {
    backgroundColor: GigabiteColors.amber,
    borderColor: GigabiteColors.amber,
  },
  categoryTabText: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryTabTextActive: {
    color: GigabiteColors.background,
  },
  productList: {
    gap: Spacing.three,
  },
  productCard: {
    backgroundColor: GigabiteColors.card,
    borderColor: GigabiteColors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImageWrap: {
    backgroundColor: GigabiteColors.surface,
    height: 150,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.roseSoft,
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  productImageText: {
    color: GigabiteColors.rose,
    fontSize: 24,
    fontWeight: '900',
  },
  productBody: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  productMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  price: {
    color: GigabiteColors.emerald,
    fontSize: 16,
    fontWeight: '900',
  },
  productName: {
    color: GigabiteColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  productDescription: {
    color: GigabiteColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  productActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
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
  stepperButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stepperButtonDisabled: {
    opacity: 0.45,
  },
  quantity: {
    color: GigabiteColors.text,
    fontSize: 16,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
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
  floatingCart: {
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
  floatingCartInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cartIcon: {
    alignItems: 'center',
    backgroundColor: GigabiteColors.amber,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cartTitle: {
    color: GigabiteColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  cartPrice: {
    color: GigabiteColors.emerald,
    fontSize: 13,
    fontWeight: '900',
    marginTop: Spacing.one,
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
