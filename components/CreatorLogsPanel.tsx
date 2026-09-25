"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { AdminLogEntry, AdminLogKind } from "@/lib/admin-logs-store";
import type { Role } from "@/lib/auth/types";

type Props = {
  dict: Dictionary;
};

type LogCategory = "all" | "balance" | "account" | "moderation" | "news";

const CATEGORY_KINDS: Record<Exclude<LogCategory, "all">, readonly AdminLogKind[]> = {
  balance: ["balance_grant", "balance_set"],
  account: ["role_change", "password_reset", "email_change_admin"],
  moderation: ["ban", "unban", "mute", "unmute", "account_delete"],
  news: ["news_publish", "news_unpublish", "news_create", "news_delete"],
};

function kindLabel(c: Dictionary["cabinet"], kind: AdminLogKind): string {
  switch (kind) {
    case "balance_grant":
      return c.logKindBalanceGrant;
    case "balance_set":
      return c.logKindBalanceSet;
    case "news_publish":
      return c.logKindNewsPublish;
    case "news_unpublish":
      return c.logKindNewsUnpublish;
    case "news_create":
      return c.logKindNewsCreate;
    case "news_delete":
      return c.logKindNewsDelete;
    case "role_change":
      return c.logKindRoleChange;
    case "password_reset":
      return c.logKindPasswordReset;
    case "email_change_admin":
      return c.logKindEmailChange;
    case "ban":
      return c.logKindBan;
    case "unban":
      return c.logKindUnban;
    case "mute":
      return c.logKindMute;
    case "unmute":
      return c.logKindUnmute;
    case "account_delete":
      return c.logKindAccountDelete;
    default:
      return kind;
  }
}

function categoryLabel(c: Dictionary["cabinet"], cat: LogCategory): string {
  switch (cat) {
    case "all":
      return c.logsFilterAll;
    case "balance":
      return c.logsFilterBalance;
    case "account":
      return c.logsFilterAccount;
    case "moderation":
      return c.logsFilterModeration;
    case "news":
      return c.logsFilterNews;
  }
}

const CATEGORIES: LogCategory[] = [
  "all",
  "balance",
  "account",
  "moderation",
  "news",
];

type BriefProfile = {
  username: string;
  role: Role;
  email: string | null;
  balance: number;
  createdAt: string | null;
  banned: boolean;
  muted: boolean;
};

function logTarget(entry: AdminLogEntry): string | null {
  const target = entry.meta?.target;
  return typeof target === "string" && target.trim() ? target.trim() : null;
}

function roleName(c: Dictionary["cabinet"], role: Role): string {
  if (role === "creator") return c.roleCreator;
  if (role === "editor") return c.roleEditor;
  return c.rolePlayer;
}

function maskMail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  return `${local.slice(0, 2)}•••@${email.slice(at + 1)}`;
}

function LogMessage({
  message,
  target,
  onOpen,
}: {
  message: string;
  target: string | null;
  onOpen: (username: string) => void;
}) {
  if (!target) return <p className="mt-1 text-foreground/90">{message}</p>;
  const at = message.toLowerCase().lastIndexOf(target.toLowerCase());
  if (at < 0) {
    return (
      <p className="mt-1 text-foreground/90">
        {message}{" "}
        <button
          type="button"
          className="underline decoration-moss-light/70 underline-offset-2 text-moss-light hover:text-foreground"
          onClick={() => onOpen(target)}
        >
          {target}
        </button>
      </p>
    );
  }
  return (
    <p className="mt-1 text-foreground/90">
      {message.slice(0, at)}
      <button
        type="button"
        className="underline decoration-moss-light/70 underline-offset-2 text-moss-light hover:text-foreground"
        onClick={() => onOpen(target)}
      >
        {message.slice(at, at + target.length)}
      </button>
      {message.slice(at + target.length)}
    </p>
  );
}

export function CreatorLogsPanel({ dict }: Props) {
  const c = dict.cabinet;
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"forbidden" | "generic" | null>(null);
  const [category, setCategory] = useState<LogCategory>("all");
  const [brief, setBrief] = useState<BriefProfile | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  async function openBrief(username: string) {
    setBrief(null);
    setBriefError(null);
    setBriefLoading(true);
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(username)}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      const data = (await res.json()) as {
        player?: BriefProfile;
        error?: string;
      };
      if (!res.ok || !data.player) {
        setBrief(null);
        setBriefError(
          data.error === "user_not_found" ? c.roleUserNotFound : c.logsLoadError,
        );
        return;
      }
      setBrief(data.player);
    } catch {
      setBriefError(c.logsLoadError);
    } finally {
      setBriefLoading(false);
    }
  }

  async function reloadLogs(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/logs?limit=100", {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      if (!res.ok) {
        throw new Error(res.status === 403 ? "forbidden" : "load");
      }
      const data = (await res.json()) as { logs: AdminLogEntry[] };
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err instanceof Error && err.message === "forbidden"
          ? "forbidden"
          : "generic",
      );
      setLogs([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void reloadLogs(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    if (category === "all") return logs;
    const kinds = new Set<AdminLogKind>(CATEGORY_KINDS[category]);
    return logs.filter((entry) => kinds.has(entry.kind));
  }, [logs, category]);

  const counts = useMemo(() => {
    const result: Record<LogCategory, number> = {
      all: logs.length,
      balance: 0,
      account: 0,
      moderation: 0,
      news: 0,
    };
    for (const entry of logs) {
      for (const cat of ["balance", "account", "moderation", "news"] as const) {
        if ((CATEGORY_KINDS[cat] as readonly AdminLogKind[]).includes(entry.kind)) {
          result[cat] += 1;
        }
      }
    }
    return result;
  }, [logs]);

  return (
    <section
      className="panel-solid rounded-2xl border border-moss-light/35 p-4 shadow-[var(--glow-moss-sm)]"
      aria-label={c.statsLogsTitle}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium text-moss-light">{c.statsLogsTitle}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void reloadLogs()}
            disabled={loading}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ash hover:text-foreground disabled:opacity-50"
          >
            {c.logsRefresh}
          </button>
          <span className="rounded border border-moss-light/30 bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-ash">
            {c.statsLogsCreatorOnly}
          </span>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={c.logsFilterLabel}
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-moss-light/50 bg-moss/25 text-moss-light"
                  : "border-border bg-surface text-ash hover:border-gold/35 hover:text-foreground"
              }`}
            >
              {categoryLabel(c, cat)}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[cat]}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error === "forbidden" ? c.errorForbidden : c.logsLoadError}
        </p>
      ) : loading ? (
        <p className="mt-3 text-sm text-ash" aria-live="polite">
          …
        </p>
      ) : logs.length === 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-ash">
          <li className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-muted">
            {c.logsEmpty}
          </li>
        </ul>
      ) : filtered.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-sm text-muted">
          {c.logsFilterEmpty}
        </p>
      ) : (
        <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto text-sm">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className="panel-solid-deep rounded-lg px-3 py-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-moss-light">
                  {kindLabel(c, entry.kind)}
                </span>
                <time
                  className="text-xs text-ash"
                  dateTime={entry.at}
                  title={entry.at}
                >
                  {new Date(entry.at).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-xs text-ash">
                {c.logActor}: <span className="text-foreground">{entry.actor}</span>
              </p>
              <LogMessage
                message={entry.message}
                target={logTarget(entry)}
                onOpen={(name) => void openBrief(name)}
              />
            </li>
          ))}
        </ul>
      )}
      {briefLoading || brief || briefError ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setBrief(null);
            setBriefError(null);
            setBriefLoading(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={brief?.username ?? c.profileOpen}
            className="panel-solid w-full max-w-sm rounded-2xl border border-border p-4"
            onClick={(event) => event.stopPropagation()}
          >
            {briefLoading ? (
              <p className="text-sm text-ash">{c.profileLoading}</p>
            ) : briefError && !brief ? (
              <p className="text-sm text-red-400">{briefError}</p>
            ) : brief ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{brief.username}</p>
                    <p className="text-sm text-ash">{roleName(c, brief.role)}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs text-ash hover:text-foreground"
                    onClick={() => {
                      setBrief(null);
                      setBriefError(null);
                    }}
                  >
                    {c.profileClose}
                  </button>
                </div>
                {briefError ? (
                  <p className="text-sm text-red-400">{briefError}</p>
                ) : (
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ash">{c.profileBalance}</dt>
                      <dd className="tabular-nums">{brief.balance}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ash">{c.profileEmail}</dt>
                      <dd className="truncate">
                        {brief.email ? maskMail(brief.email) : c.profileEmailNone}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ash">{c.profileRegistered}</dt>
                      <dd className="text-right text-xs">
                        {brief.createdAt
                          ? new Date(brief.createdAt).toLocaleString()
                          : c.profileNoData}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ash">{c.profileStatus}</dt>
                      <dd>
                        {brief.banned
                          ? c.badgeBanned
                          : brief.muted
                            ? c.badgeMuted
                            : c.profileStatusOk}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
