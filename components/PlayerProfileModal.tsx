"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Button } from "./Button";
import { RoleBadge } from "./RoleBadge";
import type { Dictionary } from "@/lib/dictionaries";
import type { GeoInfo, LoginHistoryEntry } from "@/lib/auth/types";
import type { SafePlayerProfile } from "@/lib/auth/safe-player";
import { ipv4Subnet24 } from "@/lib/client-ip";

const PlayerSkinView = dynamic(
  () => import("./PlayerSkinView").then((m) => m.PlayerSkinView),
  { ssr: false },
);

type Props = {
  dict: Dictionary;
  username: string;
  open: boolean;
  onClose: () => void;
};

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}${"•".repeat(Math.max(3, local.length - keep))}@${domain}`;
}

function formatGeo(geo: GeoInfo | null | undefined, empty: string): string {
  if (!geo) return empty;
  const parts = [geo.city, geo.country, geo.org].filter(Boolean);
  return parts.length ? parts.join(" · ") : empty;
}

function mapPwError(c: Dictionary["cabinet"], code: string | undefined): string {
  switch (code) {
    case "password_length":
      return c.errorPasswordLength;
    case "password_upper":
      return c.errorPasswordUpper;
    case "password_digit":
      return c.errorPasswordDigit;
    case "password_special":
      return c.errorPasswordSpecial;
    case "user_not_found":
      return c.roleUserNotFound;
    case "forbidden":
      return c.errorForbidden;
    default:
      return c.adminPasswordError;
  }
}

export function PlayerProfileModal({ dict, username, open, onClose }: Props) {
  const c = dict.cabinet;
  const [profile, setProfile] = useState<SafePlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVisible, setEmailVisible] = useState(false);
  const [pwDraft, setPwDraft] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok?: boolean; text: string } | null>(
    null,
  );
  const [revealedPw, setRevealedPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmailVisible(false);
    setPwDraft("");
    setPwMsg(null);
    setRevealedPw(null);
    setCopied(false);
    setError(null);
    setProfile(null);

    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/players/${encodeURIComponent(username)}`,
          { credentials: "same-origin", signal: controller.signal },
        );
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as { player: SafePlayerProfile };
        setProfile(data.player);
      } catch {
        if (!controller.signal.aborted) setError(c.profileLoadError);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open, username, c.profileLoadError]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const subnet = useMemo(
    () => ipv4Subnet24(profile?.registrationIp),
    [profile?.registrationIp],
  );

  if (!open) return null;

  async function changePassword() {
    if (!profile) return;
    if (!pwDraft) {
      setPwMsg({ ok: false, text: c.errorPasswordLength });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    setRevealedPw(null);
    const once = pwDraft;
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(profile.username)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password: once }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setPwMsg({ ok: false, text: mapPwError(c, data.error) });
        return;
      }
      setPwDraft("");
      setRevealedPw(once);
      setPwMsg({ ok: true, text: c.adminPasswordOk });
      setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev));
    } catch {
      setPwMsg({ ok: false, text: c.adminPasswordError });
    } finally {
      setSavingPw(false);
    }
  }

  async function copyPassword() {
    if (!revealedPw) return;
    try {
      await navigator.clipboard.writeText(revealedPw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const vipDisplay =
    !profile || profile.vipLevel <= 0
      ? c.profileVipNone
      : `VIP ${profile.vipLevel}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={c.profileTitle}
      onClick={onClose}
    >
      <div
        className="panel-solid-raised my-auto flex max-h-[min(92vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border shadow-[0_0_40px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gold-light">
              {c.profileTitle}
              {profile ? ` · ${profile.username}` : ` · ${username}`}
            </h2>
            {profile ? (
              <div className="mt-2">
                <RoleBadge role={profile.role} dict={dict} />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ash hover:text-foreground"
          >
            {c.profileClose}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-ash">{c.profileLoading}</p>
          ) : error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : profile ? (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-border bg-[#12101c]">
                    <div className="h-64">
                      <PlayerSkinView
                        skinUrl={profile.skinUrl}
                        capeUrl={profile.capeUrl}
                        autoRotate={false}
                      />
                    </div>
                    <p className="px-3 pb-3 text-center text-[11px] text-ash">
                      {c.skinHintLive}
                    </p>
                  </div>
                  <dl className="divide-y divide-border rounded-lg border border-border bg-surface-2 text-sm">
                    <div className="flex justify-between gap-2 px-3 py-2">
                      <dt className="text-ash">{c.profileLevel}</dt>
                      <dd className="font-semibold tabular-nums">
                        {profile.level}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 px-3 py-2">
                      <dt className="text-ash">{c.profileVip}</dt>
                      <dd className="font-semibold">{vipDisplay}</dd>
                    </div>
                    <div className="flex justify-between gap-2 px-3 py-2">
                      <dt className="text-ash">{c.profileBalance}</dt>
                      <dd className="font-semibold tabular-nums">
                        {profile.balance}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 px-3 py-2">
                      <dt className="text-ash">{c.profileStatus}</dt>
                      <dd className="text-right font-semibold">
                        {profile.banned ? (
                          <span className="text-accent-danger">
                            {c.badgeBanned}
                            {profile.bannedUntil
                              ? ` · ${new Date(profile.bannedUntil).toLocaleString()}`
                              : ""}
                          </span>
                        ) : profile.muted ? (
                          <span className="text-gold-light">
                            {c.badgeMuted}
                            {profile.mutedUntil
                              ? ` · ${new Date(profile.mutedUntil).toLocaleString()}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-moss-light">
                            {c.profileStatusOk}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 px-3 py-2">
                      <dt className="text-ash">{c.profileRegistered}</dt>
                      <dd className="text-right text-xs">
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleString()
                          : c.profileNoData}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <section className="space-y-2 rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-ash">
                      {c.profileEmail}
                    </p>
                    {profile.email ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm">
                          {emailVisible
                            ? profile.email
                            : maskEmail(profile.email)}
                        </code>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setEmailVisible((v) => !v)}
                        >
                          {emailVisible
                            ? c.profileEmailHide
                            : c.profileEmailReveal}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-ash">{c.profileEmailNone}</p>
                    )}
                  </section>

                  <section className="space-y-2 rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-ash">
                      {c.profilePassword}
                    </p>
                    <p className="text-sm text-foreground">
                      {profile.hasPassword
                        ? c.profilePasswordSet
                        : c.profilePasswordUnset}
                    </p>
                    <p className="text-[11px] text-muted">
                      {c.profilePasswordHint}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        autoComplete="new-password"
                        value={pwDraft}
                        onChange={(e) => setPwDraft(e.target.value)}
                        disabled={savingPw}
                        placeholder={c.profilePasswordNew}
                        className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm"
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={savingPw}
                        onClick={() => void changePassword()}
                      >
                        {c.profilePasswordChange}
                      </Button>
                    </div>
                    {pwMsg ? (
                      <p
                        className={`text-xs ${pwMsg.ok ? "text-moss-light" : "text-red-400"}`}
                        role="status"
                      >
                        {pwMsg.text}
                      </p>
                    ) : null}
                    {revealedPw ? (
                      <div className="rounded-md border border-gold/35 bg-gold/10 p-3 text-xs">
                        <p className="text-ash">
                          {c.profilePasswordChangedOnce}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <code className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-sm text-foreground">
                            {revealedPw}
                          </code>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => void copyPassword()}
                          >
                            {copied
                              ? c.profilePasswordCopied
                              : c.profilePasswordCopy}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>

              <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-ash">
                  {c.profileNetwork}
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-ash">{c.profileRegIp}</p>
                    <p className="font-mono text-foreground">
                      {profile.registrationIp ?? c.profileNoData}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ash">{c.profileRegGeo}</p>
                    <p className="text-foreground">
                      {formatGeo(profile.registrationGeo, c.profileNoData)}
                      {profile.registrationGeo?.isDatacenter ? (
                        <span className="ml-2 rounded-full border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-light">
                          {c.profileVpnBadge}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ash">{c.profileSubnet}</p>
                    <p className="font-mono text-foreground">
                      {subnet ?? c.profileNoData}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs uppercase tracking-wide text-ash">
                    {c.profileLoginHistory}
                  </p>
                  {profile.loginHistory.length === 0 ? (
                    <p className="text-sm text-ash">{c.profileLoginEmpty}</p>
                  ) : (
                    <ul className="space-y-2">
                      {profile.loginHistory.map(
                        (entry: LoginHistoryEntry, idx: number) => (
                          <li
                            key={`${entry.at}-${entry.ip}-${idx}`}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-mono text-sm text-foreground">
                                {entry.ip}
                                {ipv4Subnet24(entry.ip)
                                  ? ` · ${ipv4Subnet24(entry.ip)}`
                                  : ""}
                              </p>
                              <p className="text-ash">
                                {formatGeo(entry.geo, c.profileNoData)}
                              </p>
                              {entry.userAgent ? (
                                <p className="truncate text-[10px] text-muted">
                                  {entry.userAgent}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <time className="tabular-nums text-ash">
                                {new Date(entry.at).toLocaleString()}
                              </time>
                              {entry.geo?.isDatacenter ? (
                                <span className="rounded-full border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-light">
                                  {c.profileVpnBadge}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
