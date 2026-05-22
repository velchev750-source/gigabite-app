import { Footer, Header } from "@/components/home/home-page";
import { MenuPage } from "@/components/menu/menu-page";
import { getCurrentUser } from "@/services/auth";
import { getActiveComboOffers } from "@/services/combo-offers";
import { getActiveMenu } from "@/services/menu";

export const dynamic = "force-dynamic";

type MenuRouteProps = {
  searchParams?: Promise<{
    category?: string | string[];
    section?: string | string[];
  }>;
};

export default async function MenuRoute({ searchParams }: MenuRouteProps) {
  const resolvedSearchParams = await searchParams;
  const categoryParam = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams?.category;
  const sectionParam = Array.isArray(resolvedSearchParams?.section)
    ? resolvedSearchParams.section[0]
    : resolvedSearchParams?.section;
  const [categories, comboOffers, user] = await Promise.all([
    getActiveMenu(),
    getActiveComboOffers(),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <MenuPage
        key={`${categoryParam ?? "all"}:${sectionParam ?? ""}`}
        categories={categories}
        comboOffers={comboOffers}
        initialCategoryName={categoryParam}
        initialSection={sectionParam}
        userRole={user?.role ?? null}
      />
      <Footer />
    </div>
  );
}
