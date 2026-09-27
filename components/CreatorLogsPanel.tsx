"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { AdminLogEntry, AdminLogKind } from "@/lib/admin-logs-store";
import { PlayerProfileModal } from "./PlayerProfileModal";

type Props = {
  dict: Dictionary;
};

type LogCategory = "all" | "balance" | "account" | "moderation" | "news";

const CATEGORY_KINDS: Record<Exclude<LogCategory, "all">, readonly AdminLogKind[]> = {
  balance: ["balance_grant", "balance_set"],
  account: [
    "role_change",
    "password_reset",
    "email_change_admin",
    "login_failed",
    "login_blocked_ban",
    "login_success",
    "password_change_self",
    "email_bind_self",
    "email_change_self",
    "totp_enable",
    "totp_disable",
    "logout",
  ],
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
    case "login_failed":
      return c.logKindLoginFailed;
    case "login_blocked_ban":
      return c.logKindLoginBlockedBan;
    case "login_success":
      return c.logKindLoginSuccess;
    case "password_change_self":
      return c.logKindPasswordChangeSelf;
    case "email_bind_self":
      return c.logKindEmailBindSelf;
    case "email_change_self":
      return c.logKindEmailChangeSelf;
    case "totp_enable":
      return c.logKindTotpEnable;
    case "totp_disable":
      return c.logKindTotpDisable;
    case "logout":
      return c.logKindLogout;
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

function logTarget(entry: AdminLogEntry): string | null {
  const target = entry.meta?.target;
  return typeof target === "string" && target.trim() ? target.trim() : null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUser, setProfileUser] = useState<string | null>(null);

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
    const q = searchQuery.trim().toLowerCase();
    const byCategory =
      category === "all"
        ? logs
        : logs.filter((entry) =>
            (CATEGORY_KINDS[category] as readonly AdminLogKind[]).includes(
              entry.kind,
            ),
          );
    if (!q) return byCategory;
    return byCategory.filter((entry) => {
      const haystack = [
        entry.actor,
        entry.message,
        entry.kind,
        kindLabel(c, entry.kind),
        logTarget(entry) ?? "",
        ...Object.values(entry.meta ?? {}).map((v) =>
          v === null || v === undefined ? "" : String(v),
        ),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, category, searchQuery, c]);

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

      <div className="mt-3 max-w-md">
        <label htmlFor="creator-logs-search" className="mb-1.5 block text-sm text-ash">
          {c.logsSearch}
        </label>
        <input
          id="creator-logs-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={c.logsSearchPlaceholder}
          className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
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
          {searchQuery.trim() ? c.logsSearchEmpty : c.logsFilterEmpty}
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
                onOpen={setProfileUser}
              />
            </li>
          ))}
        </ul>
      )}
      <PlayerProfileModal
        dict={dict}
        username={profileUser ?? ""}
        open={profileUser !== null}
        onClose={() => setProfileUser(null)}
      />
    </section>
  );
}
