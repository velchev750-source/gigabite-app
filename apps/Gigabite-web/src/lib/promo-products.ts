// TODO: Replace the hardcoded Home page Promo Deals data with products where isPromo is true.
export function isPromoProduct(product: { isPromo?: boolean }) {
  return product.isPromo === true;
}
