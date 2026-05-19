import { AdminPanel } from "@/components/admin/admin-panel";
import { Footer, Header } from "@/components/home/home-page";
import { requireRole } from "@/services/auth";
import { getManagerMetrics, getManagerOrders } from "@/services/manager-orders";
import { getManageableUsers } from "@/services/manager-users";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const user = await requireRole("manager");
  const [metrics, orders, users] = await Promise.all([
    getManagerMetrics(),
    getManagerOrders(),
    getManageableUsers(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <AdminPanel user={user} metrics={metrics} orders={orders} users={users} />
      <Footer />
    </div>
  );
}
