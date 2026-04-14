"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ApiKeyModal } from "@/features/settings/components/api-key-modal";
import { cn } from "@/shared/lib/cn";
import { useAppState } from "@/shared/providers/app-state";
import { PerformanceMeter } from "@/shared/layout/performance-meter";

const navItems = [
  { href: "/", label: "搜尋" },
  { href: "/watchlist", label: "待看清單" },
  { href: "/recommendations", label: "推薦廣場" },
  { href: "/watchlist/lottery", label: "Lottery" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { auth } = useAppState();
  const [username] = useState(() => {
    if (typeof window === "undefined") {
      return "未登录";
    }
    try {
      const raw = window.localStorage.getItem("movies-to-watch.user.v1");
      if (!raw) {
        return "未登录";
      }
      const payload = JSON.parse(raw) as { username?: unknown };
      if (typeof payload.username === "string" && payload.username.trim()) {
        return payload.username.trim();
      }
    } catch {
      return "未登录";
    }
    return "未登录";
  });

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090c12]/80 backdrop-blur">
        <div className="content-container py-2">
          <div className="md:hidden">
            <div className="flex min-h-12 items-center justify-between gap-2">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap text-2xl text-[var(--primary)] sm:text-3xl"
              >
                MOVIES
              </Link>

              <span className="rounded-[var(--radius-sm)] border border-white/12 bg-black/30 px-2 py-1 text-xs text-[var(--text-muted)]">
                {username}
              </span>
            </div>

            <nav className="mt-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors",
                        isActive && "bg-white/12 text-[var(--text)]",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          <div className="hidden min-h-16 items-center justify-between gap-2 md:flex">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap text-2xl text-[var(--primary)] sm:text-3xl"
              >
                MOVIES
              </Link>
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      className={cn(
                        "whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors",
                        isActive && "bg-white/12 text-[var(--text)]",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-[var(--radius-sm)] border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--text-muted)]">
                {username}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="content-container mt-6 flex-1">{children}</main>

      <ApiKeyModal isRequired={!auth} onOpenChange={() => {}} open={!auth} />
      <PerformanceMeter />
    </div>
  );
}
