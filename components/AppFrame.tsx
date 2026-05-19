"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut, Plus } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase";
import { signOut } from "@/lib/data";
import { navIcon, Owl } from "@/components/Stationery";

const navItems = [
  { href: "/", label: "Today", icon: navIcon.today },
  { href: "/questions", label: "Questions", icon: navIcon.questions },
  { href: "/streaks", label: "Streaks", icon: navIcon.streaks }
];

export function AppFrame({ children, streak = 0 }: { children: ReactNode; streak?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const FlameIcon = navIcon.streaks;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="shell">
      <aside className="aside">
        <Link className="brandmark" href="/">
          <Owl size={36} />
          <div>
            <div className="title">Interview Coach</div>
            <div className="sub">stamp it.</div>
          </div>
        </Link>
        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link className={`link ${active ? "active" : ""}`} href={item.href} key={item.href}>
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link className="button primary" href="/questions/new">
          <Plus size={17} />
          New question
        </Link>
        {hasSupabaseConfig ? (
          <button className="button ghost" onClick={handleSignOut}>
            <LogOut size={17} />
            Sign out
          </button>
        ) : null}
        <div className="aside-foot">
          <div className="row-2" style={{ marginBottom: 4 }}>
            <FlameIcon size={16} />
            <strong style={{ fontFamily: "var(--font-serif)", fontSize: 15 }}>{streak}-day streak</strong>
          </div>
          One more practice keeps it alive.
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
