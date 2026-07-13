"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home, enabled: true },
  { href: "/speak", label: "Speak", icon: Mic, enabled: true },
  { href: "#", label: "Progress", icon: BarChart3, enabled: false },
  { href: "#", label: "Profile", icon: User, enabled: false },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.enabled && pathname === item.href;

          if (!item.enabled) {
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground/50"
              >
                <Icon className="size-5" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
