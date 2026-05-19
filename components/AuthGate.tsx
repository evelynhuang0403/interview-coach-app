"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { isDemoMode } from "@/lib/data";
import { Owl, Paper, Washi } from "@/components/Stationery";

function sessionTimeout() {
  return new Promise<"timeout">((resolve) => {
    window.setTimeout(() => resolve("timeout"), 2500);
  });
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(isDemoMode() || pathname === "/login");

  useEffect(() => {
    if (isDemoMode() || pathname === "/login") {
      setReady(true);
      return;
    }

    let mounted = true;
    Promise.race([supabase?.auth.getSession(), sessionTimeout()]).then((result) => {
      if (!mounted || ready) return;
      if (result === "timeout" || !result?.data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <Paper rotate="r1" style={{ padding: 32, textAlign: "center" }} washi={<Washi corner="tl" color="sky" pattern="dots" />}>
            <Owl size={64} mood="neutral" />
            <p className="h-eyebrow" style={{ marginTop: 12 }}>Checking your session</p>
            <p className="t-body muted" style={{ marginTop: 8 }}>Opening your practice binder...</p>
          </Paper>
        </div>
      </div>
    );
  }

  return children;
}
