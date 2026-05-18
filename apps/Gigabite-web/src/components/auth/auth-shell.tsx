import { Flame } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Footer, Header } from "@/components/home/home-page";

type AuthShellProps = {
  mode: "login" | "register";
};

export function AuthShell({ mode }: AuthShellProps) {
  const isRegister = mode === "register";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.2),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
              <Flame className="size-4 fill-amber-200" aria-hidden="true" />
              Gigabite account access
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              {isRegister ? "Start ordering faster." : "Welcome back."}
            </h1>
            <p className="mt-5 text-lg leading-8 text-zinc-300">
              {isRegister
                ? "Create your customer account and get ready for quick orders, saved details, and future rewards."
                : "Login with your Gigabite account to continue to your role-based dashboard."}
            </p>
          </section>
          <section className="rounded-lg border border-white/10 bg-zinc-900/90 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase text-amber-300">
                {isRegister ? "Create account" : "Secure login"}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {isRegister ? "Register" : "Login"}
              </h2>
            </div>
            <AuthForm mode={mode} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
