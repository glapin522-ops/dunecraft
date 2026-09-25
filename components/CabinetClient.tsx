"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { CreatorNewsPanel } from "./CreatorNewsPanel";
import { CreatorPlayersPanel } from "./CreatorPlayersPanel";
import { CreatorLogsPanel } from "./CreatorLogsPanel";
import { CabinetDashboard } from "./CabinetDashboard";
import { CabinetAuthCard, CabinetTwoFaCard } from "./CabinetAuthCard";
import { CabinetSecurityPanel } from "./CabinetSecurityPanel";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  canManageNews,
  canSearchPlayers,
  canViewAdminLogs,
  type SessionUser,
} from "@/lib/auth/types";

type Props = { dict: Dictionary; locale: Locale; initialUser: SessionUser | null };
type Tab = "overview" | "news" | "players" | "logs";
const TABS: Tab[] = ["overview", "news", "players", "logs"];
const TAB_KEY = "dunecraft.cabinet.tab";
type ProfileUser = SessionUser & { seedOnly?: boolean };

function isTab(v: string | null | undefined): v is Tab {
  return Boolean(v && (TABS as string[]).includes(v));
}

function readTab(): Tab {
  if (typeof window === "undefined") return "overview";
  try {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (isTab(q)) return q;
    const s = window.sessionStorage.getItem(TAB_KEY);
    if (isTab(s)) return s;
  } catch { /* ignore */ }
  return "overview";
}

function writeTab(tab: Tab) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TAB_KEY, tab);
    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch { /* ignore */ }
}

function clearTab() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TAB_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("tab");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch { /* ignore */ }
}

function mapError(dict: Dictionary, code: string | undefined): string {
  const c = dict.cabinet;
  const table: Record<string, string> = {
    invalid_credentials: c.loginError,
    banned: c.loginBanned,
    missing_fields: c.errorMissing,
    username_taken: c.errorUsernameTaken,
    username_length: c.errorUsernameLength,
    username_chars: c.errorUsernameChars,
    password_length: c.errorPasswordLength,
    password_upper: c.errorPasswordUpper,
    password_digit: c.errorPasswordDigit,
    password_special: c.errorPasswordSpecial,
    email_invalid: c.emailInvalid,
    email_taken: c.emailTaken,
    email_not_verified: c.passwordNeedEmail,
    code_expired: c.codeExpired,
    code_invalid: c.codeInvalid,
    totp_invalid: c.totpInvalidCode,
    no_pending_2fa: c.loginError,
    password_mismatch: c.passwordMismatch,
  };
  return table[code ?? ""] ?? c.errorGeneric;
}

export function CabinetClient({ dict, locale, initialUser }: Props) {
  const [user, setUser] = useState<ProfileUser | null>(initialUser);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTabState] = useState<Tab>("overview");
  const [pending2fa, setPending2fa] = useState(false);
  const [totpLoginCode, setTotpLoginCode] = useState("");
  const [emailInput, setEmailInput] = useState("");
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
  const c = dict.cabinet;

  function setTab(next: Tab) {
    setTabState(next);
    writeTab(next);
  }

  useEffect(() => setUser(initialUser), [initialUser]);

  useEffect(() => {
    if (!user) return;
    const stored = readTab();
    const allowed =
      stored === "overview" ||
      (stored === "news" && canManageNews(user)) ||
      (stored === "players" && canSearchPlayers(user)) ||
      (stored === "logs" && canViewAdminLogs(user));
    const next = allowed ? stored : "overview";
    setTabState(next);
    writeTab(next);
  }, [user?.username, user?.role]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { user: ProfileUser };
        if (data.user) {
          setUser(data.user);
          if (data.user.email) setEmailInput(data.user.email);
        }
      } catch { /* ignore */ }
    })();
  }, [user?.username]);

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

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mode === "register" && password !== registerPasswordConfirm) {
      setError(c.passwordMismatch);
      setBusy(false);
      return;
    }
    try {
      const { res, data } = await postJson(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          username,
          password,
          ...(mode === "register" ? { passwordConfirm: registerPasswordConfirm } : {}),
        },
      );
      if (data.requires2fa) {
        setPending2fa(true);
        setTotpLoginCode("");
        setPassword("");
        return;
      }
      if (!res.ok || !data.user) {
        setError(mapError(dict, data.error as string | undefined));
        return;
      }
      setUser(data.user as SessionUser);
      setPassword("");
      setTab("overview");
    } catch {
      setError(c.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function submit2fa(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/auth/login/2fa", { code: totpLoginCode });
      if (!res.ok || !data.user) {
        setError(mapError(dict, data.error as string | undefined));
        return;
      }
      setPending2fa(false);
      setUser(data.user as SessionUser);
      setTotpLoginCode("");
      setTab("overview");
    } catch {
      setError(c.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      setUser(null);
      setTabState("overview");
      clearTab();
      setPending2fa(false);
      setTotpSetup(null);
      setSecMsg("");
    } finally {
      setBusy(false);
    }
  }

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

  if (pending2fa) {
    return (
      <CabinetTwoFaCard dict={dict} code={totpLoginCode} setCode={setTotpLoginCode} error={error} busy={busy} onSubmit={(e) => void submit2fa(e)} onCancel={() => { setPending2fa(false); setError(""); }} />
    );
  }

  if (!user) {
    return (
      <CabinetAuthCard dict={dict} mode={mode} setMode={(next) => { setMode(next); setError(""); }} username={username} setUsername={setUsername} password={password} setPassword={setPassword} registerPasswordConfirm={registerPasswordConfirm} setRegisterPasswordConfirm={setRegisterPasswordConfirm} error={error} busy={busy} onSubmit={(e) => void submit(e)} />
    );
  }

  const canNews = canManageNews(user);
  const canPlayers = canSearchPlayers(user);
  const canLogs = canViewAdminLogs(user);

  return (
    <div className="min-w-0 space-y-6">
      {(canNews || canPlayers || canLogs) && (
        <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
          <Button variant={tab === "overview" ? "primary" : "ghost"} className="shrink-0" onClick={() => setTab("overview")}>{c.tabOverview}</Button>
          {canNews && <Button variant={tab === "news" ? "primary" : "ghost"} className="shrink-0" onClick={() => setTab("news")}>{c.tabNews}</Button>}
          {canPlayers && <Button variant={tab === "players" ? "primary" : "ghost"} className="shrink-0" onClick={() => setTab("players")}>{c.tabPlayers}</Button>}
          {canLogs && <Button variant={tab === "logs" ? "primary" : "ghost"} className="shrink-0" onClick={() => setTab("logs")}>{c.tabLogs}</Button>}
        </div>
      )}
      {((!canNews && !canPlayers && !canLogs) || tab === "overview") && (
        <>
          <CabinetDashboard user={user} dict={dict} locale={locale} onLogout={() => void logout()} logoutBusy={busy} onUser={setUser} />
          <Card>
            <h2 className="text-lg font-semibold">{c.purchases}</h2>
            <p className="mt-3 text-sm text-ash">{c.purchasesEmpty}</p>
            <p className="mt-4 text-xs text-muted">{c.stubNote}</p>
          </Card>
          <CabinetSecurityPanel dict={dict} user={user} busy={busy} secMsg={secMsg} emailInput={emailInput} setEmailInput={setEmailInput} emailCode={emailCode} setEmailCode={setEmailCode} emailDevCode={emailDevCode} emailAwaitingCode={emailAwaitingCode} requestEmailCode={() => void requestEmailCode()} confirmEmailCode={() => void confirmEmailCode()} pwNew={pwNew} setPwNew={setPwNew} pwConfirm={pwConfirm} setPwConfirm={setPwConfirm} pwCode={pwCode} setPwCode={setPwCode} pwDevCode={pwDevCode} pwAwaitingCode={pwAwaitingCode} requestPasswordCode={() => void requestPasswordCode()} confirmPasswordChange={() => void confirmPasswordChange()} totpSetup={totpSetup} setTotpSetup={setTotpSetup} totpCode={totpCode} setTotpCode={setTotpCode} totpDisableCode={totpDisableCode} setTotpDisableCode={setTotpDisableCode} startTotpSetup={() => void startTotpSetup()} confirmTotpEnable={() => void confirmTotpEnable()} disableTotp={() => void disableTotp()} />
        </>
      )}
      {canNews && tab === "news" && <CreatorNewsPanel dict={dict} locale={locale} />}
      {canPlayers && tab === "players" && <CreatorPlayersPanel dict={dict} currentUsername={user.username} />}
      {canLogs && tab === "logs" && <CreatorLogsPanel dict={dict} />}
    </div>
  );
}
