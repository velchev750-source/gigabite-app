import { eq } from "drizzle-orm";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const PRODUCT_NAME = "ЕВА БУРГЕР";
const IMAGE_URL = "/images/products/ЕВА БУРГЕР.webp";

async function main() {
  const { db } = await import("../src/db");
  const { products } = await import("../src/db/schema");

  const [updatedProduct] = await db
    .update(products)
    .set({ imageUrl: IMAGE_URL })
    .where(eq(products.name, PRODUCT_NAME))
    .returning({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
    });

  if (!updatedProduct) {
    throw new Error(`Product not found: ${PRODUCT_NAME}`);
  }

  console.log(
    `Updated ${updatedProduct.name} (${updatedProduct.id}) image_url to ${updatedProduct.imageUrl}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
