import { Footer, Header } from "@/components/home/home-page";
import { StaffPanel } from "@/components/staff/staff-panel";
import { requireRole } from "@/services/auth";
import { getStaffOrders, getStaffStats } from "@/services/staff-orders";

export const dynamic = "force-dynamic";

export default async function StaffRoute() {
  const user = await requireRole("staff");
  const [stats, orders] = await Promise.all([getStaffStats(), getStaffOrders()]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <StaffPanel user={user} stats={stats} orders={orders} />
      <Footer />
    </div>
  );
}
