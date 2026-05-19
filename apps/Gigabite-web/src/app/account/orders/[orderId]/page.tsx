import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { OrderDetails } from "@/components/account/account-components";
import { Footer, Header } from "@/components/home/home-page";
import { orderIdSchema } from "@/lib/validations/orders";
import { requireRole } from "@/services/auth";
import { getOrderDetailsForUser } from "@/services/orders";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailsRoute({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requireRole("user");
  const { orderId } = await params;
  const parsedOrderId = orderIdSchema.safeParse(orderId);

  if (!parsedOrderId.success) {
    notFound();
  }

  const order = await getOrderDetailsForUser(user.id, parsedOrderId.data);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/account"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-amber-100"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to account
          </Link>
          <OrderDetails order={order} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
