import { Footer, Header } from "@/components/home/home-page";
import { MenuPage } from "@/components/menu/menu-page";
import { getCurrentUser } from "@/services/auth";
import { getActiveMenu } from "@/services/menu";

export const dynamic = "force-dynamic";

type MenuRouteProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export default async function MenuRoute({ searchParams }: MenuRouteProps) {
  const resolvedSearchParams = await searchParams;
  const categoryParam = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams?.category;
  const [categories, user] = await Promise.all([getActiveMenu(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <MenuPage
        key={categoryParam ?? "all"}
        categories={categories}
        initialCategoryName={categoryParam}
        userRole={user?.role ?? null}
      />
      <Footer />
    </div>
  );
}
