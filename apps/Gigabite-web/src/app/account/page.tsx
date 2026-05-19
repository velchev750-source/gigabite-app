import {
  AccountSummary,
  ActiveOrderCard,
  OrderHistory,
} from "@/components/account/account-components";
import { Footer, Header } from "@/components/home/home-page";
import { requireRole } from "@/services/auth";
import { getActiveOrderForUser, getOrdersForUser } from "@/services/orders";

export const dynamic = "force-dynamic";

export default async function AccountRoute() {
  const user = await requireRole("user");
  const [activeOrder, userOrders] = await Promise.all([
    getActiveOrderForUser(user.id),
    getOrdersForUser(user.id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase text-amber-300">
              Customer account
            </p>
            <h1 className="mt-3 text-5xl font-black text-white">Your Gigabite</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Track today&apos;s order, revisit your history, and manage cancellation
              requests from one place.
            </p>
          </div>
          <div className="grid gap-6">
            <AccountSummary user={user} />
            <ActiveOrderCard order={activeOrder} />
            <OrderHistory orders={userOrders} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
