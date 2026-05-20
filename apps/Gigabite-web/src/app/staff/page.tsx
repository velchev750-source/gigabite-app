import { Footer, Header } from "@/components/home/home-page";
import { StaffPanel } from "@/components/staff/staff-panel";
import { requireRole } from "@/services/auth";
import {
  getStaffOrdersByStatus,
  getStaffStats,
  STAFF_ORDER_PAGE_SIZE,
} from "@/services/staff-orders";

export const dynamic = "force-dynamic";

export default async function StaffRoute() {
  const user = await requireRole("staff");
  const [stats, initialOrdersPage] = await Promise.all([
    getStaffStats(),
    getStaffOrdersByStatus({
      status: "approved",
      page: 1,
      pageSize: STAFF_ORDER_PAGE_SIZE,
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <StaffPanel user={user} stats={stats} initialOrdersPage={initialOrdersPage} />
      <Footer />
    </div>
  );
}
