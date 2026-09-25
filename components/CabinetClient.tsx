"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { CreatorNewsPanel } from "./CreatorNewsPanel";
import { CreatorPlayersPanel } from "./CreatorPlayersPanel";
import { CreatorLogsPanel } from "./CreatorLogsPanel";
import { CabinetDashboard } from "./CabinetDashboard";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  canManageNews,
  canSearchPlayers,
  canViewAdminLogs,
  type SessionUser,
} from "@/lib/auth/types";

type Props = {
  dict: Dictionary;
  locale: Locale;
  initialUser: SessionUser | null;
};

type Tab = "overview" | "news" | "players" | "logs";

const TAB_VALUES: Tab[] = ["overview", "news", "players", "logs"];
const TAB_STORAGE_KEY = "dunecraft.cabinet.tab";

function isTab(value: string | null | undefined): value is Tab {
  return Boolean(value && (TAB_VALUES as string[]).includes(value));
}

function readStoredTab(): Tab {
  if (typeof window === "undefined") return "overview";
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("tab");
    if (isTab(fromQuery)) return fromQuery;
    const fromStorage = window.sessionStorage.getItem(TAB_STORAGE_KEY);
    if (isTab(fromStorage)) return fromStorage;
  } catch {
    /* ignore */
  }
  return "overview";
}

function writeStoredTab(tab: Tab) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

function clearStoredTab() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TAB_STORAGE_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("tab");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

type ProfileUser = SessionUser & { seedOnly?: boolean };

function mapError(dict: Dictionary, code: string | undefined): string {
  const c = dict.cabinet;
  switch (code) {
    case "invalid_credentials":
      return c.loginError;
    case "banned":
      return c.loginBanned;
    case "missing_fields":
      return c.errorMissing;
    case "username_taken":
      return c.errorUsernameTaken;
    case "username_length":
      return c.errorUsernameLength;
    case "username_chars":
      return c.errorUsernameChars;
    case "password_length":
      return c.errorPasswordLength;
    case "password_upper":
      return c.errorPasswordUpper;
    case "password_digit":
      return c.errorPasswordDigit;
    case "password_special":
      return c.errorPasswordSpecial;
    case "email_invalid":
      return c.emailInvalid;
    case "email_taken":
      return c.emailTaken;
    case "email_not_verified":
      return c.passwordNeedEmail;
    case "code_expired":
      return c.codeExpired;
    case "code_invalid":
      return c.codeInvalid;
    case "totp_invalid":
      return c.totpInvalidCode;
    case "no_pending_2fa":
      return c.loginError;
    case "password_mismatch":
      return c.passwordMismatch;
    default:
      return c.errorGeneric;
  }
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

  function setTab(next: Tab) {
    setTabState(next);
    writeStoredTab(next);
  }

  // 2FA login step
  const [pending2fa, setPending2fa] = useState(false);
  const [totpLoginCode, setTotpLoginCode] = useState("");

  // Email
  const [emailInput, setEmailInput] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [emailAwaitingCode, setEmailAwaitingCode] = useState(false);
  const [secMsg, setSecMsg] = useState("");

  // Password change
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [pwDevCode, setPwDevCode] = useState<string | null>(null);
  const [pwAwaitingCode, setPwAwaitingCode] = useState(false);

  // TOTP setup
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrDataUrl: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (!user) return;
    const stored = readStoredTab();
    const allowed =
      stored === "overview" ||
      (stored === "news" && canManageNews(user)) ||
      (stored === "players" && canSearchPlayers(user)) ||
      (stored === "logs" && canViewAdminLogs(user));
    const next = allowed ? stored : "overview";
    setTabState(next);
    writeStoredTab(next);
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
      } catch {
        /* ignore */
      }
    })();
  }, [user?.username]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mode === "register" && password !== registerPasswordConfirm) {
      setError(dict.cabinet.passwordMismatch);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            username,
            password,
            ...(mode === "register" ? { passwordConfirm: registerPasswordConfirm } : {}),
          }),
        },
      );
      const data = (await res.json()) as {
        user?: SessionUser;
        error?: string;
        requires2fa?: boolean;
      };
      if (data.requires2fa) {
        setPending2fa(true);
        setTotpLoginCode("");
        setPassword("");
        return;
      }
      if (!res.ok || !data.user) {
        setError(mapError(dict, data.error));
        return;
      }
      setUser(data.user);
      setPassword("");
      setTab("overview");
    } catch {
      setError(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function submit2fa(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code: totpLoginCode }),
      });
      const data = (await res.json()) as {
        user?: SessionUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(mapError(dict, data.error));
        return;
      }
      setPending2fa(false);
      setUser(data.user);
      setTotpLoginCode("");
      setTab("overview");
    } catch {
      setError(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      setUser(null);
      setTabState("overview");
      clearStoredTab();
      setPending2fa(false);
      setTotpSetup(null);
      setSecMsg("");
    } finally {
      setBusy(false);
    }
  }

  async function requestEmailCode() {
    setBusy(true);
    setSecMsg("");
    setEmailDevCode(null);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "request", email: emailInput }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stub?: boolean;
        devCode?: string;
      };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      setEmailAwaitingCode(true);
      setSecMsg(dict.cabinet.emailCodeSent);
      if (data.devCode) setEmailDevCode(data.devCode);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function confirmEmailCode() {
    setBusy(true);
    setSecMsg("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "confirm", code: emailCode }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: ProfileUser;
      };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      if (data.user) setUser(data.user);
      setEmailAwaitingCode(false);
      setEmailCode("");
      setEmailDevCode(null);
      setSecMsg(dict.cabinet.emailVerifiedOk);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordCode() {
    setBusy(true);
    setSecMsg("");
    setPwDevCode(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "request" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stub?: boolean;
        devCode?: string;
      };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      setPwAwaitingCode(true);
      setSecMsg(dict.cabinet.emailCodeSent);
      if (data.devCode) setPwDevCode(data.devCode);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function confirmPasswordChange() {
    setBusy(true);
    setSecMsg("");
    if (pwNew !== pwConfirm) {
      setSecMsg(dict.cabinet.passwordMismatch);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "confirm",
          code: pwCode,
          newPassword: pwNew,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      setPwAwaitingCode(false);
      setPwCode("");
      setPwNew("");
      setPwConfirm("");
      setPwDevCode(null);
      setSecMsg(dict.cabinet.passwordChangedOk);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function startTotpSetup() {
    setBusy(true);
    setSecMsg("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "setup" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        secret?: string;
        qrDataUrl?: string;
      };
      if (!res.ok || !data.secret || !data.qrDataUrl) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      setTotpSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl });
      setTotpCode("");
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotpEnable() {
    setBusy(true);
    setSecMsg("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "confirm", code: totpCode }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: ProfileUser;
      };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      if (data.user) setUser(data.user);
      setTotpSetup(null);
      setTotpCode("");
      setSecMsg(dict.cabinet.totpEnabledOk);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp() {
    setBusy(true);
    setSecMsg("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "disable", code: totpDisableCode }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: ProfileUser;
      };
      if (!res.ok) {
        setSecMsg(mapError(dict, data.error));
        return;
      }
      if (data.user) setUser(data.user);
      setTotpDisableCode("");
      setSecMsg(dict.cabinet.totpDisabledOk);
    } catch {
      setSecMsg(dict.cabinet.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const c = dict.cabinet;

  if (pending2fa) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <h2 className="text-lg font-semibold">{c.login2faTitle}</h2>
          <p className="mt-2 text-sm text-muted">{c.login2faLead}</p>
          <form className="mt-4 space-y-3" onSubmit={(e) => void submit2fa(e)}>
            <label className="block text-sm">
              <span className="text-ash">{c.totpConfirmCode}</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpLoginCode}
                onChange={(e) => setTotpLoginCode(e.target.value)}
                className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground tracking-widest"
                placeholder="000000"
                required
              />
            </label>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={busy}
            >
              {c.login2faSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => {
                setPending2fa(false);
                setError("");
              }}
            >
              {c.newsCancel}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (user) {
    const canNews = canManageNews(user);
    const canPlayers = canSearchPlayers(user);
    const canLogs = canViewAdminLogs(user);
    const emailVerified = Boolean(user.emailVerified && user.email);
    const totpOn = Boolean(user.totpEnabled);
    return (
      <div className="min-w-0 space-y-6">
        {(canNews || canPlayers || canLogs) && (
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
            <Button
              variant={tab === "overview" ? "primary" : "ghost"}
              className="shrink-0"
              onClick={() => setTab("overview")}
            >
              {c.tabOverview}
            </Button>
            {canNews && (
              <Button
                variant={tab === "news" ? "primary" : "ghost"}
                className="shrink-0"
                onClick={() => setTab("news")}
              >
                {c.tabNews}
              </Button>
            )}
            {canPlayers && (
              <Button
                variant={tab === "players" ? "primary" : "ghost"}
                className="shrink-0"
                onClick={() => setTab("players")}
              >
                {c.tabPlayers}
              </Button>
            )}
            {canLogs && (
              <Button
                variant={tab === "logs" ? "primary" : "ghost"}
                className="shrink-0"
                onClick={() => setTab("logs")}
              >
                {c.tabLogs}
              </Button>
            )}
          </div>
        )}

        {((!canNews && !canPlayers && !canLogs) || tab === "overview") && (
          <>
            <CabinetDashboard
              user={user}
              dict={dict}
              locale={locale}
              onLogout={() => void logout()}
              logoutBusy={busy}
            />

            <Card>
              <h2 className="text-lg font-semibold">{c.purchases}</h2>
              <p className="mt-3 text-sm text-ash">{c.purchasesEmpty}</p>
              <p className="mt-4 text-xs text-muted">{c.stubNote}</p>
            </Card>

            {/* Security — all logged-in users */}
            <Card>
              <h2 className="text-lg font-semibold">{c.tabSecurity}</h2>
              {secMsg && (
                <p className="mt-2 text-sm text-moss-light" role="status">
                  {secMsg}
                </p>
              )}

              {/* Email */}
              <section className="mt-6 space-y-3 border-t border-border pt-4">
                <h3 className="font-medium text-gold-light">{c.emailSection}</h3>
                <p className="text-sm text-ash">
                  {user.email ? (
                    <>
                      {c.emailCurrent}: <strong className="break-all">{user.email}</strong>{" "}
                      <span className="text-xs">
                        (
                        {emailVerified ? c.emailVerified : c.emailUnverified})
                      </span>
                    </>
                  ) : (
                    c.emailNotSet
                  )}
                </p>
                {user.seedOnly ? (
                  <p className="text-sm text-muted">
                    Seed-аккаунт (только env) — привязка почты недоступна.
                  </p>
                ) : (
                  <>
                    <label className="block text-sm">
                      <span className="text-ash">{c.emailLabel}</span>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                        placeholder={c.emailPlaceholder}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        disabled={busy || !emailInput.trim()}
                        onClick={() => void requestEmailCode()}
                      >
                        {user.email ? c.emailChange : c.emailBind} —{" "}
                        {c.emailSendCode}
                      </Button>
                    </div>
                    {emailAwaitingCode && (
                      <div className="space-y-2 rounded-md panel-solid-deep p-3">
                        {emailDevCode && (
                          <p className="rounded bg-amber-950/40 px-2 py-1 text-sm text-amber-200">
                            {c.emailStubHint}:{" "}
                            <strong className="tracking-widest">
                              {emailDevCode}
                            </strong>
                          </p>
                        )}
                        <label className="block text-sm">
                          <span className="text-ash">{c.emailCodeLabel}</span>
                          <input
                            inputMode="numeric"
                            maxLength={6}
                            value={emailCode}
                            onChange={(e) => setEmailCode(e.target.value)}
                            className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                            placeholder="000000"
                          />
                        </label>
                        <Button
                          variant="gold"
                          disabled={busy || emailCode.length !== 6}
                          onClick={() => void confirmEmailCode()}
                        >
                          {c.emailConfirmCode}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Password change */}
              <section className="mt-6 space-y-3 border-t border-border pt-4">
                <h3 className="font-medium text-gold-light">
                  {c.passwordSection}
                </h3>
                {!emailVerified ? (
                  <p className="text-sm text-amber-200/90">{c.passwordNeedEmail}</p>
                ) : user.seedOnly ? (
                  <p className="text-sm text-muted">
                    Seed-аккаунт — смена пароля через store недоступна.
                  </p>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      disabled={busy || pwAwaitingCode}
                      onClick={() => void requestPasswordCode()}
                    >
                      {c.passwordRequestCode}
                    </Button>
                    {pwAwaitingCode && (
                      <div className="space-y-2 rounded-md panel-solid-deep p-3">
                        {pwDevCode && (
                          <p className="rounded bg-amber-950/40 px-2 py-1 text-sm text-amber-200">
                            {c.emailStubHint}:{" "}
                            <strong className="tracking-widest">
                              {pwDevCode}
                            </strong>
                          </p>
                        )}
                        <label className="block text-sm">
                          <span className="text-ash">{c.emailCodeLabel}</span>
                          <input
                            inputMode="numeric"
                            maxLength={6}
                            value={pwCode}
                            onChange={(e) => setPwCode(e.target.value)}
                            className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-ash">{c.passwordNew}</span>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={pwNew}
                            onChange={(e) => setPwNew(e.target.value)}
                            className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-ash">{c.passwordConfirm}</span>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={pwConfirm}
                            onChange={(e) => setPwConfirm(e.target.value)}
                            className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                          />
                        </label>
                        <p className="text-xs text-muted">{c.passwordHint}</p>
                        <Button
                          variant="gold"
                          disabled={busy}
                          onClick={() => void confirmPasswordChange()}
                        >
                          {c.passwordChangeSubmit}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* 2FA TOTP */}
              <section className="mt-6 space-y-3 border-t border-border pt-4">
                <h3 className="font-medium text-gold-light">{c.totpSection}</h3>
                <p className="text-sm text-muted">{c.totpLead}</p>
                <p className="text-sm text-ash">
                  {totpOn ? c.totpEnabled : c.totpDisabled}
                </p>
                {user.seedOnly ? (
                  <p className="text-sm text-muted">
                    Seed-аккаунт — 2FA через store недоступна.
                  </p>
                ) : totpOn ? (
                  <div className="space-y-2">
                    <label className="block text-sm">
                      <span className="text-ash">{c.totpConfirmCode}</span>
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={totpDisableCode}
                        onChange={(e) => setTotpDisableCode(e.target.value)}
                        className="mt-1 min-w-0 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                      />
                    </label>
                    <Button
                      variant="secondary"
                      disabled={busy || totpDisableCode.length !== 6}
                      onClick={() => void disableTotp()}
                    >
                      {c.totpDisable}
                    </Button>
                  </div>
                ) : totpSetup ? (
                  <div className="space-y-3">
                    <p className="text-sm">{c.totpScanQr}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={totpSetup.qrDataUrl}
                      alt="TOTP QR"
                      width={220}
                      height={220}
                      className="rounded-md border border-border bg-white p-2"
                    />
                    <p className="font-mono text-xs break-all text-ash">
                      {c.totpManualSecret}: {totpSetup.secret}
                    </p>
                    <label className="block text-sm">
                      <span className="text-ash">{c.totpConfirmCode}</span>
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        className="mt-1 min-w-0 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="gold"
                        disabled={busy || totpCode.length !== 6}
                        onClick={() => void confirmTotpEnable()}
                      >
                        {c.totpConfirmEnable}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setTotpSetup(null)}
                      >
                        {c.newsCancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void startTotpSetup()}
                  >
                    {c.totpEnable}
                  </Button>
                )}
              </section>
            </Card>
          </>
        )}

        {canNews && tab === "news" && (
          <CreatorNewsPanel dict={dict} locale={locale} />
        )}

        {canPlayers && tab === "players" && (
          <CreatorPlayersPanel dict={dict} currentUsername={user.username} />
        )}

        {canLogs && tab === "logs" && <CreatorLogsPanel dict={dict} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === "login" ? "primary" : "ghost"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className="flex-1"
          >
            {c.login}
          </Button>
          <Button
            variant={mode === "register" ? "primary" : "ghost"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className="flex-1"
          >
            {c.register}
          </Button>
        </div>
        <form className="space-y-3" onSubmit={(e) => void submit(e)}>
          <label className="block text-sm">
            <span className="text-ash">{c.username}</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="Steve"
              required
              minLength={mode === "register" ? 4 : undefined}
              maxLength={24}
              pattern={
                mode === "register" ? "[a-zA-Z][a-zA-Z0-9]{3,23}" : undefined
              }
              title={c.usernameHint}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ash">{c.password}</span>
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="••••••••"
              required
              minLength={mode === "register" ? 8 : undefined}
            />
          </label>
          {mode === "register" && (
            <label className="block text-sm">
              <span className="text-ash">{c.passwordConfirm}</span>
              <input
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </label>
          )}
          {mode === "register" && (
            <div className="space-y-1 text-xs text-muted">
              <p>{c.usernameHint}</p>
              <p>{c.passwordHint}</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={busy}
          >
            {mode === "login" ? c.login : c.register}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted">{c.stubNote}</p>
      </Card>
    </div>
  );
}
