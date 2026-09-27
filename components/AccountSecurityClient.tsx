"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CabinetSecurityPanel } from "./CabinetSecurityPanel";
import { mapError } from "./CabinetClient";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { SessionUser } from "@/lib/auth/types";

type ProfileUser = SessionUser & { seedOnly?: boolean };

type Props = {
  dict: Dictionary;
  locale: Locale;
  title: string;
  initialUser: SessionUser | null;
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  return { res, data };
}

export function AccountSecurityClient({ dict, locale, title, initialUser }: Props) {
  const c = dict.cabinet;
  const s = dict.settings;
  const [user, setUser] = useState<ProfileUser | null>(initialUser);
  const [busy, setBusy] = useState(false);
  const [emailInput, setEmailInput] = useState(initialUser?.email ?? "");
  const [emailCode, setEmailCode] = useState("");
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [emailAwaitingCode, setEmailAwaitingCode] = useState(false);
  const [secMsg, setSecMsg] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [pwDevCode, setPwDevCode] = useState<string | null>(null);
  const [pwAwaitingCode, setPwAwaitingCode] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: ProfileUser | null };
        if (cancelled || !data.user) return;
        setUser(data.user);
        if (data.user.email) setEmailInput(data.user.email);
      } catch {
        /* keep SSR user */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestEmailCode() {
    setBusy(true); setSecMsg(""); setEmailDevCode(null);
    try {
      const { res, data } = await postJson("/api/auth/email", { action: "request", email: emailInput });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      setEmailAwaitingCode(true);
      setSecMsg(c.emailCodeSent);
      if (typeof data.devCode === "string") setEmailDevCode(data.devCode);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function confirmEmailCode() {
    setBusy(true); setSecMsg("");
    try {
      const { res, data } = await postJson("/api/auth/email", { action: "confirm", code: emailCode });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      if (data.user) setUser(data.user as ProfileUser);
      setEmailAwaitingCode(false); setEmailCode(""); setEmailDevCode(null);
      setSecMsg(c.emailVerifiedOk);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function requestPasswordCode() {
    setBusy(true); setSecMsg(""); setPwDevCode(null);
    try {
      const { res, data } = await postJson("/api/auth/password", { action: "request" });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      setPwAwaitingCode(true);
      setSecMsg(c.emailCodeSent);
      if (typeof data.devCode === "string") setPwDevCode(data.devCode);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function confirmPasswordChange() {
    setBusy(true); setSecMsg("");
    if (pwNew !== pwConfirm) { setSecMsg(c.passwordMismatch); setBusy(false); return; }
    try {
      const { res, data } = await postJson("/api/auth/password", { action: "confirm", code: pwCode, newPassword: pwNew });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      setPwAwaitingCode(false); setPwCode(""); setPwNew(""); setPwConfirm(""); setPwDevCode(null);
      setSecMsg(c.passwordChangedOk);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function startTotpSetup() {
    setBusy(true); setSecMsg("");
    try {
      const { res, data } = await postJson("/api/auth/totp", { action: "setup" });
      if (!res.ok || typeof data.secret !== "string" || typeof data.qrDataUrl !== "string") {
        setSecMsg(mapError(dict, data.error as string | undefined)); return;
      }
      setTotpSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl });
      setTotpCode("");
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function confirmTotpEnable() {
    setBusy(true); setSecMsg("");
    try {
      const { res, data } = await postJson("/api/auth/totp", { action: "confirm", code: totpCode });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      if (data.user) setUser(data.user as ProfileUser);
      setTotpSetup(null); setTotpCode("");
      setSecMsg(c.totpEnabledOk);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  async function disableTotp() {
    setBusy(true); setSecMsg("");
    try {
      const { res, data } = await postJson("/api/auth/totp", { action: "disable", code: totpDisableCode });
      if (!res.ok) { setSecMsg(mapError(dict, data.error as string | undefined)); return; }
      if (data.user) setUser(data.user as ProfileUser);
      setTotpDisableCode("");
      setSecMsg(c.totpDisabledOk);
    } catch { setSecMsg(c.errorGeneric); } finally { setBusy(false); }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border panel-solid p-5 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted sm:text-base">{s.loginRequired}</p>
        <Link
          href={`/${locale}/cabinet`}
          className="inline-flex text-sm font-semibold text-gold-light underline-offset-4 hover:underline"
        >
          {s.goCabinet}
        </Link>
      </div>
    );
  }

  return (
    <CabinetSecurityPanel
      dict={dict}
      user={user}
      busy={busy}
      secMsg={secMsg}
      emailInput={emailInput}
      setEmailInput={setEmailInput}
      emailCode={emailCode}
      setEmailCode={setEmailCode}
      emailDevCode={emailDevCode}
      emailAwaitingCode={emailAwaitingCode}
      requestEmailCode={() => void requestEmailCode()}
      confirmEmailCode={() => void confirmEmailCode()}
      pwNew={pwNew}
      setPwNew={setPwNew}
      pwConfirm={pwConfirm}
      setPwConfirm={setPwConfirm}
      pwCode={pwCode}
      setPwCode={setPwCode}
      pwDevCode={pwDevCode}
      pwAwaitingCode={pwAwaitingCode}
      requestPasswordCode={() => void requestPasswordCode()}
      confirmPasswordChange={() => void confirmPasswordChange()}
      totpSetup={totpSetup}
      setTotpSetup={setTotpSetup}
      totpCode={totpCode}
      setTotpCode={setTotpCode}
      totpDisableCode={totpDisableCode}
      setTotpDisableCode={setTotpDisableCode}
      startTotpSetup={() => void startTotpSetup()}
      confirmTotpEnable={() => void confirmTotpEnable()}
      disableTotp={() => void disableTotp()}
      title={title}
    />
  );
}
