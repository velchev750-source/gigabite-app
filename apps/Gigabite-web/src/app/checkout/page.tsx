import { Footer, Header } from "@/components/home/home-page";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { requireRole } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutRoute() {
  await requireRole("user");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <CheckoutPage />
      <Footer />
    </div>
  );
}
