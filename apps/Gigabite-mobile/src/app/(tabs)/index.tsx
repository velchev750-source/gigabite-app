import { RefreshCcw, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PrimaryButton } from '@/components/primary-button';
import { ProductCard } from '@/components/product-card';
import { ScreenContainer } from '@/components/screen-container';
import { SectionTitle } from '@/components/section-title';
import { GigabiteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { getMobilePromoProducts, type MobileMenuProduct } from '@/lib/menu-api';
import { blurActiveWebElement } from '@/lib/web-focus';

export default function HomeScreen() {
  const [promoProducts, setPromoProducts] = useState<MobileMenuProduct[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const cart = useCart();

  async function loadPromos() {
    setIsLoadingPromos(true);
    setPromoError(null);

    try {
      setPromoProducts(await getMobilePromoProducts(6));
    } catch {
      setPromoError('Could not load Gigabite promos. Check the API URL and try again.');
    } finally {
      setIsLoadingPromos(false);
    }
  }

  useEffect(() => {
    void loadPromos();
  }, []);

  function handleAddPromo(product: MobileMenuProduct) {
    if (!user) {
      setLoginMessage('Log in before adding items to your cart.');
      blurActiveWebElement();
      router.push('/profile');
      return;
    }

    setLoginMessage(null);
    cart.addItem(product);
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Good evening"
        title="What are you craving?"
        subtitle="Fresh Gigabite favorites are ready for your next order."
      />

      <SectionTitle title="Promo picks" subtitle="Live specials from today’s active Gigabite menu." />
      {loginMessage ? <Text style={styles.loginMessage}>{loginMessage}</Text> : null}
      {isLoadingPromos ? <LoadingState /> : null}
      {!isLoadingPromos && promoError ? (
        <ErrorState message={promoError} onRetry={() => void loadPromos()} />
      ) : null}
      {!isLoadingPromos && !promoError && promoProducts.length ? (
        <View style={styles.productList}>
          {promoProducts.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              description={product.description || 'Fresh Gigabite favorite from the active menu.'}
              price={formatPrice(product.price)}
              tag={product.category_name}
              onAdd={() => handleAddPromo(product)}
            />
          ))}
        </View>
      ) : null}
      {!isLoadingPromos && !promoError && !promoProducts.length ? (
        <EmptyPromoState />
      ) : null}

    </ScreenContainer>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={GigabiteColors.amber} />
      <Text style={styles.stateTitle}>Loading promos</Text>
      <Text style={styles.stateText}>Fetching live promo products.</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.stateCard}>
      <RefreshCcw color={GigabiteColors.rose} size={28} />
      <Text style={styles.stateTitle}>Promos unavailable</Text>
      <Text style={styles.stateText}>{message}</Text>
      <PrimaryButton label="Retry" variant="secondary" onPress={onRetry} />
    </View>
  );
}

function EmptyPromoState() {
  return (
    <View style={styles.stateCard}>
      <ShoppingCart color={GigabiteColors.textMuted} size={28} />
      <Text style={styles.stateTitle}>No promos right now</Text>
      <Text style={styles.stateText}>Fresh promo products will appear here when the kitchen marks them active.</Text>
    </View>
  );
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  productList: {
    gap: Spacing.three,
  },
  loginMessage: {
    backgroundColor: GigabiteColors.amberSoft,
    borderColor: `${GigabiteColors.amber}55`,
    borderRadius: 12,
    borderWidth: 1,
    color: GigabiteColors.amber,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    padding: Spacing.three,
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
