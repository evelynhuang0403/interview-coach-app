"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Owl, Paper, Washi } from "@/components/Stationery";
import { hasSupabaseConfig } from "@/lib/supabase";
import { demoModeKey, signIn, signUp } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(mode: "signin" | "signup") {
    if (!hasSupabaseConfig) {
      router.push("/");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      router.push("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <Paper rotate="r1" style={{ padding: 40 }} washi={<><Washi corner="tl" color="coral" pattern="stripes" /><Washi corner="br" color="sky" pattern="dots" /></>}>
          <div style={{ textAlign: "center" }}>
            <Owl size={80} mood="happy" />
            <h1 className="h-display" style={{ fontSize: 36, marginTop: 12 }}>Interview Coach</h1>
            <p className="t-hand" style={{ marginTop: 4 }}>welcome back.</p>
            <p className="t-body muted" style={{ marginTop: 16 }}>
              Sign in to review your private question bank and keep your streak alive.
            </p>
          </div>
          <form className="stack-3" style={{ marginTop: 24 }} onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required={hasSupabaseConfig} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input className="input" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required={hasSupabaseConfig} />
            </div>
            {message ? <div className="notice">{message}</div> : null}
            <button className="button primary" style={{ minHeight: 56, fontSize: 17 }} disabled={loading} onClick={() => submit("signin")}>
              {loading ? "Signing in..." : "Sign in ->"}
            </button>
            {hasSupabaseConfig ? (
              <button className="button" type="button" onClick={() => submit("signup")} disabled={loading}>
                Create account
              </button>
            ) : null}
            <button
              className="button ghost"
              type="button"
              style={{ alignSelf: "center", marginTop: 4 }}
              onClick={() => {
                window.localStorage.setItem(demoModeKey, "true");
                router.push("/");
              }}
            >
              Continue as demo
            </button>
          </form>
        </Paper>
      </div>
    </div>
  );
}
