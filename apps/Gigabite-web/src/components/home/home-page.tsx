import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Beef,
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  HandPlatter,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Pizza,
  Salad,
  Send,
  ShieldCheck,
  Star,
  Store,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { NavbarCartLink } from "@/components/cart/navbar-cart-link";
import { PromoDealsSection } from "@/components/home/promo-deals-section";
import { getCurrentUser, getDashboardPath } from "@/services/auth";
import { getPromoProducts } from "@/services/menu";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Promotions", href: "/#products" },
  { label: "About", href: "/#why-gigabite" },
  { label: "Contacts", href: "#contacts" },
];

const categories = [
  {
    title: "Burgers",
    href: "/menu?category=Burgers",
    text: "Stacked smash burgers with melted cheese and signature sauces.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    icon: Beef,
  },
  {
    title: "Pizzas",
    href: "/menu?category=Pizzas",
    text: "Crispy stone-style crusts, rich toppings, and bold flavors.",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
    icon: Pizza,
  },
  {
    title: "Fries & Sides",
    href: "/menu?category=Fries%20%26%20Sides",
    text: "Golden fries, loaded bites, dips, and shareable side plates.",
    image:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=85",
    icon: HandPlatter,
  },
  {
    title: "Drinks",
    href: "/menu?category=Drinks",
    text: "Cold sodas, fresh lemonades, shakes, and iced refreshers.",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85",
    icon: UtensilsCrossed,
  },
];

const reasons = [
  {
    title: "Fast Delivery",
    text: "Hot orders move quickly from our kitchen to your table.",
    icon: Bike,
  },
  {
    title: "Fresh Ingredients",
    text: "Daily-prepped produce, premium proteins, and real sauces.",
    icon: Salad,
  },
  {
    title: "Best Prices",
    text: "Generous portions, smart combos, and weekly value deals.",
    icon: WalletCards,
  },
  {
    title: "Quality Service",
    text: "Friendly support and careful order handling every time.",
    icon: ShieldCheck,
  },
];

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase text-amber-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-zinc-300">{text}</p>
    </div>
  );
}

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Gigabite home">
      <span className="grid size-11 place-items-center rounded-lg bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20">
        <Flame className="size-6 fill-zinc-950" aria-hidden="true" />
      </span>
      <span className="text-xl font-black text-white">Gigabite</span>
    </Link>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const dashboardLabel =
    user?.role === "manager"
      ? "Admin Panel"
      : user?.role === "staff"
        ? "Staff Panel"
        : "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-zinc-300 transition hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm font-semibold text-zinc-300">
                {user.name}
              </span>
              <Link
                href={getDashboardPath(user.role)}
                className="rounded-md bg-amber-400 px-4 py-2 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                {dashboardLabel}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-amber-400 px-4 py-2 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Register
              </Link>
            </>
          )}
          <NavbarCartLink />
        </div>
        <div className="lg:hidden">
          <input id="mobile-menu" type="checkbox" className="peer sr-only" />
          <label
            htmlFor="mobile-menu"
            className="grid size-11 cursor-pointer place-items-center rounded-md border border-white/10 bg-white/5 text-white"
            aria-label="Toggle menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </label>
          <div className="absolute left-0 right-0 top-full hidden border-b border-white/10 bg-zinc-950 px-4 pb-5 shadow-2xl peer-checked:block">
            <nav className="grid gap-2 py-4" aria-label="Mobile primary">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className={user ? "grid gap-2" : "grid grid-cols-[1fr_1fr_auto] gap-2"}>
              {user ? (
                <>
                  <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-zinc-500">
                      Signed in
                    </p>
                    <p className="mt-1 text-sm font-black text-white">{user.name}</p>
                  </div>
                  <Link
                    href={getDashboardPath(user.role)}
                    className="rounded-md bg-amber-400 px-4 py-3 text-center text-sm font-black text-zinc-950"
                  >
                    {dashboardLabel}
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-amber-400 px-4 py-3 text-center text-sm font-black text-zinc-950"
                  >
                    Register
                  </Link>
                </>
              )}
              <NavbarCartLink className="relative grid size-12 place-items-center rounded-md border border-white/10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate min-h-[calc(100svh-68px)] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=90"
        alt="Loaded fast food table with burgers, fries, and sauces"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-zinc-950/75" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-zinc-950 to-transparent" />
      <div className="relative mx-auto flex min-h-[calc(100svh-68px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            Big flavor for fast appetites.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200 sm:text-xl">
            Order juicy burgers, pizzas, loaded sides, and cold drinks from a
            modern kitchen built for speed, quality, and serious cravings.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#products"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-6 py-4 text-base font-black text-zinc-950 shadow-xl shadow-amber-500/25 transition hover:-translate-y-1 hover:bg-amber-300"
            >
              Promo Deals <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:-translate-y-1 hover:border-emerald-300/60 hover:text-emerald-200"
            >
              View Menu <ChevronRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-20 right-8 hidden rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-5 py-4 text-emerald-100 shadow-2xl backdrop-blur-xl md:block">
          <div className="flex items-center gap-3">
            <Clock3 className="size-6" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Average delivery</p>
              <p className="text-2xl font-black">24 min</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: (typeof categories)[number] }) {
  const Icon = category.icon;

  return (
    <Link
      href={category.href}
      aria-label={`Explore ${category.title} on the menu`}
      className="group block cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-2 hover:border-amber-300/40 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <article>
        <div className="relative h-56 overflow-hidden">
          <Image
            src={category.image}
            alt={category.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
          <span className="absolute bottom-4 left-4 grid size-11 place-items-center rounded-lg bg-amber-400 text-zinc-950">
            <Icon className="size-6" aria-hidden="true" />
          </span>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-black text-white">{category.title}</h3>
          <p className="mt-3 min-h-14 text-sm leading-6 text-zinc-300">
            {category.text}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-black text-zinc-950 transition group-hover:bg-amber-300">
            Explore <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function PromotionsBanner() {
  return (
    <section className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-amber-300/20 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 text-zinc-950 sm:p-10 lg:p-14">
          <div className="inline-flex items-center gap-2 rounded-md bg-zinc-950/90 px-3 py-2 text-sm font-black text-amber-200">
            <BadgePercent className="size-4" aria-hidden="true" />
            Limited weekly offer
          </div>
          <h2 className="mt-6 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
            Combo rush: save 25% on selected meals.
          </h2>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-zinc-900/80">
            Mix a burger, side, and drink into one crave-ready bundle. Available
            while the kitchen board is hot.
          </p>
          <Link
            href="#products"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-zinc-950 px-6 py-4 text-base font-black text-white transition hover:-translate-y-1 hover:bg-zinc-900"
          >
            Claim Deal <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative min-h-72">
          <Image
            src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=90"
            alt="Combo meal with burgers, fries, and drinks"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function AppPromotion() {
  return (
    <section className="bg-zinc-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-lg border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-300">
            Mobile app coming soon
          </p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">
            Your next order, one thumb away.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
            Save favorite meals, track delivery, and unlock app-only rewards
            with the future Gigabite mobile experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-md border border-white/10 bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-300">
              App Store
            </button>
            <button className="rounded-md border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-emerald-300/60 hover:text-emerald-200">
              Google Play
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xs rounded-[2rem] border border-white/15 bg-zinc-950 p-4 shadow-2xl shadow-emerald-500/10">
          <div className="rounded-[1.5rem] bg-zinc-900 p-4">
            <div className="mb-4 h-7 rounded-full bg-white/10" />
            <div className="relative h-48 overflow-hidden rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=900&q=85"
                alt="Mobile app burger preview"
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
            <div className="mt-4 rounded-lg bg-white p-4 text-zinc-950">
              <p className="text-sm font-black">Giga Smash Burger</p>
              <div className="mt-2 flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star
                    key={item}
                    className="size-4 fill-current"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <button className="mt-4 w-full rounded-md bg-rose-500 py-3 text-sm font-black text-white">
                Quick order
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contacts" className="border-t border-white/10 bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            Premium fast food for busy people, late cravings, and fresh lunch
            breaks.
          </p>
          <div className="mt-6 flex gap-3">
            {[Store, MessageCircle, Send].map((Icon, index) => (
              <Link
                key={index}
                href="#"
                className="grid size-10 place-items-center rounded-md border border-white/10 text-zinc-300 transition hover:border-amber-300/60 hover:text-amber-300"
                aria-label="Social link"
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        <nav aria-label="Footer" className="grid gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-zinc-300 transition hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <address className="grid gap-4 text-sm not-italic text-zinc-300">
          <span className="flex gap-3">
            <MapPin className="size-5 shrink-0 text-amber-300" />
            24 Flavor Street, Sofia, Bulgaria
          </span>
          <span className="flex gap-3">
            <Mail className="size-5 shrink-0 text-amber-300" />
            hello@gigabite.test
          </span>
          <span className="flex gap-3">
            <Phone className="size-5 shrink-0 text-amber-300" />
            +359 88 123 4567
          </span>
        </address>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-zinc-500">
        Copyright 2026 Gigabite. All rights reserved.
      </div>
    </footer>
  );
}

export async function HomePage() {
  const promoProducts = await getPromoProducts();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main>
        <Hero />
        <section id="categories" className="bg-zinc-950 px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Choose your craving"
            title="Featured Categories"
            text="Fast favorites grouped for easy browsing, quick decisions, and better lunch breaks."
          />
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.title} category={category} />
            ))}
          </div>
        </section>
        <section id="products" className="bg-zinc-900 px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kitchen highlights"
            title="Promo Deals"
            text="Active Gigabite offers pulled straight from the current menu."
          />
          <PromoDealsSection products={promoProducts} />
        </section>
        <PromotionsBanner />
        <section id="why-gigabite" className="bg-zinc-900 px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why Gigabite"
            title="Built for Better Food Runs"
            text="A sharp ordering experience backed by the things customers care about most."
          />
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => {
              const Icon = reason.icon;

              return (
                <article
                  key={reason.title}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-2 hover:border-emerald-300/50 hover:bg-white/[0.07]"
                >
                  <span className="grid size-12 place-items-center rounded-lg bg-emerald-400/15 text-emerald-200">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-white">
                    {reason.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {reason.text}
                  </p>
                  <CheckCircle2
                    className="mt-5 size-5 text-amber-300"
                    aria-hidden="true"
                  />
                </article>
              );
            })}
          </div>
        </section>
        <AppPromotion />
      </main>
      <Footer />
    </div>
  );
}
