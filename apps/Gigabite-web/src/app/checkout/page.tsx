import { Footer, Header } from "@/components/home/home-page";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getPrefilledCheckoutAddress, requireRole } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutRoute() {
  const user = await requireRole("user");
  const prefilledDeliveryAddress = await getPrefilledCheckoutAddress(user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <CheckoutPage prefilledDeliveryAddress={prefilledDeliveryAddress} />
      <Footer />
    </div>
  );
}
