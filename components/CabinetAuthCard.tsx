"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import type { Dictionary } from "@/lib/dictionaries";

type Mode = "login" | "register";

type Props = {
  dict: Dictionary;
  mode: Mode;
  setMode: (mode: Mode) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  registerPasswordConfirm: string;
  setRegisterPasswordConfirm: (v: string) => void;
  registerEmail: string;
  setRegisterEmail: (v: string) => void;
  error: string;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function CabinetAuthCard({
  dict,
  mode,
  setMode,
  username,
  setUsername,
  password,
  setPassword,
  registerPasswordConfirm,
  setRegisterPasswordConfirm,
  registerEmail,
  setRegisterEmail,
  error,
  busy,
  onSubmit,
}: Props) {
  const c = dict.cabinet;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function syncFromDom() {
      const form = formRef.current;
      if (!form) return;
      const u = form.elements.namedItem("username") as HTMLInputElement | null;
      const p = form.elements.namedItem("password") as HTMLInputElement | null;
      if (u?.value && u.value !== username) setUsername(u.value);
      if (p?.value && p.value !== password) setPassword(p.value);
      if (mode === "register") {
        const em = form.elements.namedItem("email") as HTMLInputElement | null;
        const pc = form.elements.namedItem("passwordConfirm") as HTMLInputElement | null;
        if (em?.value && em.value !== registerEmail) setRegisterEmail(em.value);
        if (pc?.value && pc.value !== registerPasswordConfirm) setRegisterPasswordConfirm(pc.value);
      }
    }
    syncFromDom();
    const t1 = window.setTimeout(syncFromDom, 50);
    const t2 = window.setTimeout(syncFromDom, 300);
    const t3 = window.setTimeout(syncFromDom, 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [mode]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card tone="raised">
        <div className="mb-4 flex gap-2">
          <Button variant={mode === "login" ? "primary" : "ghost"} onClick={() => setMode("login")} className="flex-1">
            {c.login}
          </Button>
          <Button variant={mode === "register" ? "primary" : "ghost"} onClick={() => setMode("register")} className="flex-1">
            {c.register}
          </Button>
        </div>
        <form ref={formRef} className="space-y-3" method="post" action="/api/auth/login" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="text-ash">{c.username}</span>
            <input name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} onInput={(e) => setUsername((e.target as HTMLInputElement).value)} className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" placeholder="Steve" required minLength={mode === "register" ? 4 : undefined} maxLength={24} pattern={mode === "register" ? "[a-zA-Z][a-zA-Z0-9]{3,23}" : undefined} title={c.usernameHint} />
          </label>
          {mode === "register" && (
            <label className="block text-sm">
              <span className="text-ash">{c.emailLabel}</span>
              <input name="email" type="email" autoComplete="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" placeholder={c.emailPlaceholder} required />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-ash">{c.password}</span>
            <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" placeholder="••••••••" required minLength={mode === "register" ? 8 : undefined} />
          </label>
          {mode === "register" && (
            <label className="block text-sm">
              <span className="text-ash">{c.passwordConfirm}</span>
              <input name="passwordConfirm" type="password" autoComplete="new-password" value={registerPasswordConfirm} onChange={(e) => setRegisterPasswordConfirm(e.target.value)} onPaste={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" placeholder="••••••••" required minLength={8} />
            </label>
          )}
          {mode === "register" && (
            <div className="space-y-1 text-xs text-muted">
              <p>{c.usernameHint}</p>
              <p>{c.passwordHint}</p>
              <p>{c.registerEmailHint}</p>
            </div>
          )}
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" disabled={busy}>{mode === "login" ? c.login : c.register}</Button>
        </form>
        <p className="mt-4 text-xs text-muted">{c.stubNote}</p>
      </Card>
    </div>
  );
}

type TwoFaProps = {
  dict: Dictionary;
  code: string;
  setCode: (v: string) => void;
  error: string;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export function CabinetTwoFaCard({ dict, code, setCode, error, busy, onSubmit, onCancel }: TwoFaProps) {
  const c = dict.cabinet;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card tone="raised">
        <h2 className="text-lg font-semibold">{c.login2faTitle}</h2>
        <p className="mt-2 text-sm text-muted">{c.login2faLead}</p>
        <form className="mt-4 space-y-3" method="post" action="/api/auth/login/2fa" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="text-ash">{c.totpConfirmCode}</span>
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground tracking-widest" placeholder="000000" required />
          </label>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" disabled={busy}>{c.login2faSubmit}</Button>
          <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={onCancel}>{c.newsCancel}</Button>
        </form>
      </Card>
    </div>
  );
}
