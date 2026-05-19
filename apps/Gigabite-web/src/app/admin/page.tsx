import { AdminPanel } from "@/components/admin/admin-panel";
import { Footer, Header } from "@/components/home/home-page";
import { requireRole } from "@/services/auth";
import { getManagerMetrics, getManagerOrders } from "@/services/manager-orders";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const user = await requireRole("manager");
  const [metrics, orders] = await Promise.all([getManagerMetrics(), getManagerOrders()]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <AdminPanel user={user} metrics={metrics} orders={orders} />
      <Footer />
    </div>
  );
}
