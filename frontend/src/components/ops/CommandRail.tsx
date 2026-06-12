"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MODULES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/interview", label: "Interview" },
  { href: "/learning", label: "Learning" },
];

export function CommandRail() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-12 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="h-full flex items-center justify-between px-4 lg:px-6 gap-4">
        {/* wordmark */}
        <Link href="/dashboard" className="shrink-0">
          <span className="font-display text-[0.7rem] tracking-[0.22em] text-foreground">
            CAREER PILOT
          </span>
        </Link>

        {/* nav */}
        <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {MODULES.map((m) => {
            const active = pathname.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={cn(
                  "relative px-3 py-1.5 text-[0.78rem] font-medium transition-colors duration-200 whitespace-nowrap",
                  active ? "text-signal" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.label}
                {active && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-signal"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className={cn(
            "hidden sm:block shrink-0 text-[0.78rem] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "text-signal"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
