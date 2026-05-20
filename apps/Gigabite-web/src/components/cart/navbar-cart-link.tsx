"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { CART_UPDATED_EVENT, getWebCartCount, loadWebCart } from "@/lib/web-cart";

export function NavbarCartLink({ className }: { className?: string }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      setCartCount(getWebCartCount(loadWebCart()));
    }

    updateCount();
    window.addEventListener(CART_UPDATED_EVENT, updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <Link
      href="/menu#cart"
      className={
        className ??
        "relative grid size-11 place-items-center rounded-md border border-white/10 bg-white/5 text-white transition hover:border-amber-300/60 hover:text-amber-300"
      }
      aria-label="Open cart"
    >
      <ShoppingCart className="size-5" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-xs font-bold text-white">
        {cartCount}
      </span>
    </Link>
  );
}
