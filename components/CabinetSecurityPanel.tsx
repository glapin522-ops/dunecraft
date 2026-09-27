"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import type { Dictionary } from "@/lib/dictionaries";
import type { SessionUser } from "@/lib/auth/types";

type ProfileUser = SessionUser & { seedOnly?: boolean };

type Props = {
  dict: Dictionary;
  user: ProfileUser;
  busy: boolean;
  secMsg: string;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailCode: string;
  setEmailCode: (v: string) => void;
  emailDevCode: string | null;
  emailAwaitingCode: boolean;
  requestEmailCode: () => void;
  confirmEmailCode: () => void;
  pwNew: string;
  setPwNew: (v: string) => void;
  pwConfirm: string;
  setPwConfirm: (v: string) => void;
  pwCode: string;
  setPwCode: (v: string) => void;
  pwDevCode: string | null;
  pwAwaitingCode: boolean;
  requestPasswordCode: () => void;
  confirmPasswordChange: () => void;
  totpSetup: { secret: string; qrDataUrl: string } | null;
  setTotpSetup: (v: { secret: string; qrDataUrl: string } | null) => void;
  totpCode: string;
  setTotpCode: (v: string) => void;
  totpDisableCode: string;
  setTotpDisableCode: (v: string) => void;
  startTotpSetup: () => void;
  confirmTotpEnable: () => void;
  disableTotp: () => void;
  title?: string;
};

/** Avoid SSR hydrate fights with password-manager DOM injections on email/password fields. */
const fieldIgnore = {
  autoComplete: "off" as const,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

export function CabinetSecurityPanel(p: Props) {
  const c = p.dict.cabinet;
  const emailVerified = Boolean(p.user.emailVerified && p.user.email);
  const totpOn = Boolean(p.user.totpEnabled);
  // Client-only mounts (e.g. settings tab) start mounted to avoid empty-frame flash.
  // SSR/hydration still starts false, then flips in effect (password-manager safe).
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");
  useEffect(() => setMounted(true), []);

  return (
    <Card tone="default">
      <h2 className="text-lg font-semibold">{p.title ?? c.tabSecurity}</h2>
      {p.secMsg && <p className="mt-2 text-sm text-moss-light" role="status">{p.secMsg}</p>}
      <section className="mt-6 space-y-3 border-t border-border pt-4">
        <h3 className="font-medium text-gold-light">{c.emailSection}</h3>
        <p className="text-sm text-ash">
          {p.user.email ? (
            <>
              {c.emailCurrent}: <strong className="break-all">{p.user.email}</strong>{" "}
              <span className="text-xs">({emailVerified ? c.emailVerified : c.emailUnverified})</span>
            </>
          ) : (
            c.emailNotSet
          )}
        </p>
        {p.user.seedOnly ? (
          <p className="text-sm text-muted">Seed-аккаунт (только env) — привязка почты недоступна.</p>
        ) : !mounted ? (
          <div className="h-24 animate-pulse rounded-md bg-surface/50" aria-hidden />
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-ash">{c.emailLabel}</span>
              <input
                type="email"
                name="dunecraft-bind-email"
                value={p.emailInput}
                onChange={(e) => p.setEmailInput(e.target.value)}
                className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                placeholder={c.emailPlaceholder}
                {...fieldIgnore}
              />
            </label>
            <Button variant="secondary" disabled={p.busy || !p.emailInput.trim()} onClick={p.requestEmailCode}>
              {p.user.email ? c.emailChange : c.emailBind} — {c.emailSendCode}
            </Button>
            {p.emailAwaitingCode && (
              <div className="space-y-2 rounded-md panel-solid-deep p-3">
                {p.emailDevCode && (
                  <p className="rounded bg-amber-950/40 px-2 py-1 text-sm text-amber-200">
                    {c.emailStubHint}: <strong className="tracking-widest">{p.emailDevCode}</strong>
                  </p>
                )}
                <label className="block text-sm">
                  <span className="text-ash">{c.emailCodeLabel}</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    name="dunecraft-email-code"
                    value={p.emailCode}
                    onChange={(e) => p.setEmailCode(e.target.value)}
                    className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                    placeholder="000000"
                    {...fieldIgnore}
                  />
                </label>
                <Button variant="gold" disabled={p.busy || p.emailCode.length !== 6} onClick={p.confirmEmailCode}>
                  {c.emailConfirmCode}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      <section className="mt-6 space-y-3 border-t border-border pt-4">
        <h3 className="font-medium text-gold-light">{c.passwordSection}</h3>
        {!emailVerified ? (
          <p className="text-sm text-amber-200/90">{c.passwordNeedEmail}</p>
        ) : p.user.seedOnly ? (
          <p className="text-sm text-muted">Seed-аккаунт — смена пароля через store недоступна.</p>
        ) : !mounted ? (
          <div className="h-10 animate-pulse rounded-md bg-surface/50" aria-hidden />
        ) : (
          <>
            <Button variant="secondary" disabled={p.busy || p.pwAwaitingCode} onClick={p.requestPasswordCode}>
              {c.passwordRequestCode}
            </Button>
            {p.pwAwaitingCode && (
              <div className="space-y-2 rounded-md panel-solid-deep p-3">
                {p.pwDevCode && (
                  <p className="rounded bg-amber-950/40 px-2 py-1 text-sm text-amber-200">
                    {c.emailStubHint}: <strong className="tracking-widest">{p.pwDevCode}</strong>
                  </p>
                )}
                <label className="block text-sm">
                  <span className="text-ash">{c.emailCodeLabel}</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    name="dunecraft-pw-code"
                    value={p.pwCode}
                    onChange={(e) => p.setPwCode(e.target.value)}
                    className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                    {...fieldIgnore}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ash">{c.passwordNew}</span>
                  <input
                    type="password"
                    name="dunecraft-pw-new"
                    autoComplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    value={p.pwNew}
                    onChange={(e) => p.setPwNew(e.target.value)}
                    className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ash">{c.passwordConfirm}</span>
                  <input
                    type="password"
                    name="dunecraft-pw-confirm"
                    autoComplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    value={p.pwConfirm}
                    onChange={(e) => p.setPwConfirm(e.target.value)}
                    className="mt-1 min-w-0 w-full rounded-md border border-border bg-surface px-3 py-2"
                  />
                </label>
                <p className="text-xs text-muted">{c.passwordHint}</p>
                <Button variant="gold" disabled={p.busy} onClick={p.confirmPasswordChange}>
                  {c.passwordChangeSubmit}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      <section className="mt-6 space-y-3 border-t border-border pt-4">
        <h3 className="font-medium text-gold-light">{c.totpSection}</h3>
        <p className="text-sm text-muted">{c.totpLead}</p>
        <p className="text-sm text-ash">{totpOn ? c.totpEnabled : c.totpDisabled}</p>
        {p.user.seedOnly ? (
          <p className="text-sm text-muted">Seed-аккаунт — 2FA через store недоступна.</p>
        ) : !mounted ? (
          <div className="h-10 animate-pulse rounded-md bg-surface/50" aria-hidden />
        ) : totpOn ? (
          <div className="space-y-2">
            <label className="block text-sm">
              <span className="text-ash">{c.totpConfirmCode}</span>
              <input
                inputMode="numeric"
                maxLength={6}
                name="dunecraft-totp-disable"
                value={p.totpDisableCode}
                onChange={(e) => p.setTotpDisableCode(e.target.value)}
                className="mt-1 min-w-0 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                {...fieldIgnore}
              />
            </label>
            <Button variant="secondary" disabled={p.busy || p.totpDisableCode.length !== 6} onClick={p.disableTotp}>
              {c.totpDisable}
            </Button>
          </div>
        ) : p.totpSetup ? (
          <div className="space-y-3">
            <p className="text-sm">{c.totpScanQr}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.totpSetup.qrDataUrl} alt="TOTP QR" width={220} height={220} className="rounded-md border border-border bg-white p-2" />
            <p className="font-mono text-xs break-all text-ash">
              {c.totpManualSecret}: {p.totpSetup.secret}
            </p>
            <label className="block text-sm">
              <span className="text-ash">{c.totpConfirmCode}</span>
              <input
                inputMode="numeric"
                maxLength={6}
                name="dunecraft-totp-enable"
                value={p.totpCode}
                onChange={(e) => p.setTotpCode(e.target.value)}
                className="mt-1 min-w-0 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 tracking-widest"
                {...fieldIgnore}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="gold" disabled={p.busy || p.totpCode.length !== 6} onClick={p.confirmTotpEnable}>
                {c.totpConfirmEnable}
              </Button>
              <Button variant="ghost" disabled={p.busy} onClick={() => p.setTotpSetup(null)}>
                {c.newsCancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" disabled={p.busy} onClick={p.startTotpSetup}>
            {c.totpEnable}
          </Button>
        )}
      </section>
    </Card>
  );
}
