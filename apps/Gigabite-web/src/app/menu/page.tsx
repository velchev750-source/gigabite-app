import { Footer, Header } from "@/components/home/home-page";
import { MenuPage } from "@/components/menu/menu-page";
import { getCurrentUser } from "@/services/auth";
import { getActiveMenu } from "@/services/menu";

export const dynamic = "force-dynamic";

export default async function MenuRoute() {
  const [categories, user] = await Promise.all([getActiveMenu(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <MenuPage categories={categories} userRole={user?.role ?? null} />
      <Footer />
    </div>
  );
}
