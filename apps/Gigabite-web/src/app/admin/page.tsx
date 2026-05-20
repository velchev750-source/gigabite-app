import { AdminPanel } from "@/components/admin/admin-panel";
import { Footer, Header } from "@/components/home/home-page";
import { requireRole } from "@/services/auth";
import { getManagerMetrics, getManagerOrdersByTab } from "@/services/manager-orders";
import { getManageableStaff } from "@/services/manager-users";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const user = await requireRole("manager");
  const [metrics, initialOrdersPage, initialStaffPage] = await Promise.all([
    getManagerMetrics(),
    getManagerOrdersByTab({ tab: "pendingApproval", page: 1 }),
    getManageableStaff({ page: 1 }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <AdminPanel
        user={user}
        metrics={metrics}
        initialOrdersPage={initialOrdersPage}
        initialStaffPage={initialStaffPage}
      />
      <Footer />
    </div>
  );
}
