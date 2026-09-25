"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { PlayerProfileModal } from "./PlayerProfileModal";
import type { Dictionary } from "@/lib/dictionaries";
import { ROLES, type Role } from "@/lib/auth/types";

type Props = { dict: Dictionary; currentUsername: string };

type Player = {
  username: string;
  role: Role;
  email: string | null;
  emailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string | null;
  balance: number;
  banned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  bannedBy: string | null;
  muted: boolean;
  mutedUntil: string | null;
  muteReason: string | null;
  mutedBy: string | null;
};

type RoleFilter = "all" | Role;
type SortDir = "asc" | "desc";

function roleLabel(c: Dictionary["cabinet"], role: Role): string {
  if (role === "creator") return c.roleCreator;
  if (role === "editor") return c.roleEditor;
  return c.rolePlayer;
}

function mapAuthError(c: Dictionary["cabinet"], code: string | undefined): string {
  switch (code) {
    case "password_length":
      return c.errorPasswordLength;
    case "password_upper":
      return c.errorPasswordUpper;
    case "password_digit":
      return c.errorPasswordDigit;
    case "password_special":
      return c.errorPasswordSpecial;
    case "email_invalid":
    case "invalid_email":
      return c.emailInvalid;
    case "email_taken":
      return c.emailTaken;
    case "user_not_found":
      return c.roleUserNotFound;
    case "forbidden":
      return c.errorForbidden;
    case "invalid_amount":
      return c.grantBalanceInvalid;
    case "cannot_delete_self":
      return c.modCannotDeleteSelf;
    case "cannot_moderate_self":
      return c.modCannotModerateSelf;
    case "last_creator":
      return c.roleLastCreator;
    case "reason_required":
      return c.modReasonRequired;
    case "invalid_days":
      return c.modInvalidDays;
    case "invalid_minutes":
      return c.modInvalidMinutes;
    default:
      return c.errorGeneric;
  }
}

function mapRoleError(c: Dictionary["cabinet"], code: string | undefined): string {
  switch (code) {
    case "cannot_change_own_role":
      return c.roleCannotChangeOwn;
    case "last_creator":
      return c.roleLastCreator;
    case "user_not_found":
      return c.roleUserNotFound;
    case "invalid_role":
      return c.roleInvalid;
    case "forbidden":
      return c.errorForbidden;
    default:
      return c.roleError;
  }
}

function mergePlayer(prev: Player, next: Partial<Player>): Player {
  return { ...prev, ...next };
}

export function CreatorPlayersPanel({ dict, currentUsername }: Props) {
  const c = dict.cabinet;
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<Role>("player");
  const [grantAmount, setGrantAmount] = useState("");
  const [pwDraft, setPwDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [modReason, setModReason] = useState("");
  const [banDays, setBanDays] = useState("7");
  const [muteMinutes, setMuteMinutes] = useState("60");
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"forbidden" | "generic" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (role !== "all") params.set("role", role);
        const suffix = params.toString();
        const response = await fetch(
          `/api/admin/players${suffix ? `?${suffix}` : ""}`,
          { credentials: "same-origin", signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(response.status === 403 ? "forbidden" : "load");
        }
        const data = (await response.json()) as { players: Player[] };
        setPlayers(data.players);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error && err.message === "forbidden"
              ? "forbidden"
              : "generic",
          );
          setPlayers([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, role]);

  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      const cmp = a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [players, sortDir]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.username === selected) ?? null,
    [players, selected],
  );

  useEffect(() => {
    if (!selectedPlayer) return;
    setDraftRole(selectedPlayer.role);
    setEmailDraft(selectedPlayer.email ?? "");
    setGrantAmount("");
    setPwDraft("");
    setModReason("");
    setBanDays("7");
    setMuteMinutes("60");
    setMsg(null);
    setConfirmDelete(false);
    setProfileOpen(false);
  }, [selectedPlayer?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const selfLower = currentUsername.toLowerCase();

  function openPlayer(username: string) {
    setSelected(username);
  }

  function closePanel() {
    setSelected(null);
    setMsg(null);
    setConfirmDelete(false);
  }

  function updateLocal(username: string, patch: Partial<Player>) {
    setPlayers((prev) =>
      prev.map((p) => (p.username === username ? mergePlayer(p, patch) : p)),
    );
  }

  async function saveRole(player: Player) {
    if (draftRole === player.role) return;
    setSaving("role");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ role: draftRole }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        setMsg({ ok: false, text: mapRoleError(c, data.error) });
        setDraftRole(player.role);
        return;
      }
      updateLocal(player.username, { role: data.user.role });
      setDraftRole(data.user.role);
      setMsg({ ok: true, text: c.roleUpdated });
    } catch {
      setMsg({ ok: false, text: c.roleError });
      setDraftRole(player.role);
    } finally {
      setSaving(null);
    }
  }

  async function patchBalance(
    player: Player,
    mode: "grant" | "set",
  ) {
    const amount = Number(grantAmount);
    if (mode === "grant") {
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
        setMsg({ ok: false, text: c.grantBalanceInvalid });
        return;
      }
    } else if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
      setMsg({ ok: false, text: c.setBalanceInvalid });
      return;
    }
    setSaving(mode === "grant" ? "balance" : "balance-set");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/balance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ amount, mode }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        const mapped = mapAuthError(c, data.error);
        const fallback =
          mode === "grant" ? c.grantBalanceError : c.setBalanceError;
        const invalid =
          data.error === "invalid_amount"
            ? mode === "grant"
              ? c.grantBalanceInvalid
              : c.setBalanceInvalid
            : null;
        setMsg({
          ok: false,
          text: invalid ?? (mapped === c.errorGeneric ? fallback : mapped),
        });
        return;
      }
      updateLocal(player.username, { balance: data.user.balance ?? player.balance });
      setGrantAmount("");
      setMsg({
        ok: true,
        text: mode === "grant" ? c.grantBalanceOk : c.setBalanceOk,
      });
    } catch {
      setMsg({
        ok: false,
        text: mode === "grant" ? c.grantBalanceError : c.setBalanceError,
      });
    } finally {
      setSaving(null);
    }
  }

  async function grantBalance(player: Player) {
    await patchBalance(player, "grant");
  }

  async function setBalance(player: Player) {
    await patchBalance(player, "set");
  }

  async function savePassword(player: Player) {
    if (!pwDraft) {
      setMsg({ ok: false, text: c.errorPasswordLength });
      return;
    }
    setSaving("pw");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password: pwDraft }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        const mapped = mapAuthError(c, data.error);
        setMsg({
          ok: false,
          text: mapped === c.errorGeneric ? c.adminPasswordError : mapped,
        });
        return;
      }
      setPwDraft("");
      setMsg({ ok: true, text: c.adminPasswordOk });
    } catch {
      setMsg({ ok: false, text: c.adminPasswordError });
    } finally {
      setSaving(null);
    }
  }

  async function saveEmail(player: Player, clear = false) {
    const email = clear ? null : emailDraft.trim();
    setSaving("email");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/email`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        const mapped = mapAuthError(c, data.error);
        setMsg({
          ok: false,
          text:
            data.detail ||
            (mapped === c.errorGeneric ? c.adminEmailError : mapped),
        });
        return;
      }
      updateLocal(player.username, {
        email: data.user.email,
        emailVerified: data.user.emailVerified,
      });
      setEmailDraft(data.user.email ?? "");
      setMsg({ ok: true, text: c.adminEmailOk });
    } catch {
      setMsg({ ok: false, text: c.adminEmailError });
    } finally {
      setSaving(null);
    }
  }

  async function banPlayer(player: Player, days: number) {
    const reason = modReason.trim();
    if (!reason) {
      setMsg({ ok: false, text: c.modReasonRequired });
      return;
    }
    setSaving("ban");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/ban`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ days, reason }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        setMsg({ ok: false, text: mapAuthError(c, data.error) });
        return;
      }
      updateLocal(player.username, data.user);
      setModReason("");
      setMsg({
        ok: true,
        text: days >= 9999 ? c.modBanPermanentOk : c.modBanOk,
      });
    } catch {
      setMsg({ ok: false, text: c.modBanError });
    } finally {
      setSaving(null);
    }
  }

  async function unbanPlayer(player: Player) {
    setSaving("unban");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/unban`,
        {
          method: "PATCH",
          credentials: "same-origin",
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        setMsg({ ok: false, text: mapAuthError(c, data.error) });
        return;
      }
      updateLocal(player.username, data.user);
      setMsg({ ok: true, text: c.modUnbanOk });
    } catch {
      setMsg({ ok: false, text: c.modUnbanError });
    } finally {
      setSaving(null);
    }
  }

  async function mutePlayer(player: Player) {
    const reason = modReason.trim();
    if (!reason) {
      setMsg({ ok: false, text: c.modReasonRequired });
      return;
    }
    const minutes = Number(muteMinutes);
    if (!Number.isFinite(minutes) || minutes < 1) {
      setMsg({ ok: false, text: c.modInvalidMinutes });
      return;
    }
    setSaving("mute");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/mute`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ minutes: Math.floor(minutes), reason }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        setMsg({ ok: false, text: mapAuthError(c, data.error) });
        return;
      }
      updateLocal(player.username, data.user);
      setModReason("");
      setMsg({ ok: true, text: c.modMuteOk });
    } catch {
      setMsg({ ok: false, text: c.modMuteError });
    } finally {
      setSaving(null);
    }
  }

  async function unmutePlayer(player: Player) {
    setSaving("unmute");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}/unmute`,
        {
          method: "PATCH",
          credentials: "same-origin",
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: Player;
      };
      if (!res.ok || !data.ok || !data.user) {
        setMsg({ ok: false, text: mapAuthError(c, data.error) });
        return;
      }
      updateLocal(player.username, data.user);
      setMsg({ ok: true, text: c.modUnmuteOk });
    } catch {
      setMsg({ ok: false, text: c.modUnmuteError });
    } finally {
      setSaving(null);
    }
  }

  async function deletePlayer(player: Player) {
    const reason = modReason.trim();
    if (!reason) {
      setMsg({ ok: false, text: c.modReasonRequired });
      return;
    }
    setSaving("delete");
    try {
      const res = await fetch(
        `/api/admin/players/${encodeURIComponent(player.username)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMsg({ ok: false, text: mapAuthError(c, data.error) });
        setConfirmDelete(false);
        return;
      }
      setPlayers((prev) => prev.filter((p) => p.username !== player.username));
      setSelected(null);
      setConfirmDelete(false);
      setMsg(null);
    } catch {
      setMsg({ ok: false, text: c.modDeleteError });
      setConfirmDelete(false);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{c.playersTitle}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">{c.playersLead}</p>
        <p className="mt-1 max-w-xl text-sm text-ash">{c.playersSelectHint}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
        <label className="block text-sm">
          <span className="text-ash">{c.playersSearch}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={c.playersSearchPlaceholder}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ash">{c.playersRoleFilter}</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as RoleFilter)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="all">{c.playersAllRoles}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(c, r)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ash">{c.playersSort}</span>
          <select
            value={sortDir}
            onChange={(event) => setSortDir(event.target.value as SortDir)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="asc">{c.playersSortAsc}</option>
            <option value="desc">{c.playersSortDesc}</option>
          </select>
        </label>
      </div>

      <div
        className={`grid gap-4 ${selectedPlayer ? "lg:grid-cols-[minmax(0,1fr)_minmax(32rem,42rem)]" : ""}`}
      >
        <div className="min-w-0">
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error === "forbidden" ? c.errorForbidden : c.errorGeneric}
            </p>
          ) : loading ? (
            <p className="text-sm text-ash" aria-live="polite">
              …
            </p>
          ) : sortedPlayers.length === 0 ? (
            <p className="text-sm text-ash">
              {query.trim() ? c.playersNotFound : c.playersEmpty}
            </p>
          ) : (
            <ul className="space-y-2" role="listbox" aria-label={c.playersTitle}>
              {sortedPlayers.map((player) => {
                const active = selected === player.username;
                return (
                  <li key={player.username}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => openPlayer(player.username)}
                      className={`panel-solid flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-moss-light/50 ring-1 ring-moss-light/35"
                          : "hover:border-gold/30 hover:bg-surface-3"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {player.username}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ash">
                          {roleLabel(c, player.role)} · {c.playersBalance}:{" "}
                          <span className="tabular-nums text-foreground">
                            {player.balance ?? 0}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        {player.banned ? (
                          <span className="rounded-full border border-[color-mix(in_srgb,var(--accent-danger)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent-danger)_14%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-danger">
                            {c.badgeBanned}
                          </span>
                        ) : null}
                        {player.muted ? (
                          <span className="rounded-full border border-gold/40 bg-[color-mix(in_srgb,var(--gold)_12%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-light">
                            {c.badgeMuted}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedPlayer ? (
          <aside
            className="panel-solid-raised h-fit min-w-0 overflow-visible rounded-2xl p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
            aria-label={c.playersEditTitle}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold">
                    {selectedPlayer.username}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold-light hover:bg-gold/20"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
                      <circle cx="9" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
                      <path d="M5.5 16.5c.8-1.7 2.2-2.5 3.5-2.5s2.7.8 3.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                      <path d="M14 9h5M14 12h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    {c.profileOpen}
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-ash">
                  {roleLabel(c, selectedPlayer.role)}
                  {selectedPlayer.createdAt
                    ? ` · ${new Date(selectedPlayer.createdAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ash hover:text-foreground"
              >
                {c.playersClosePanel}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedPlayer.banned ? (
                <span className="rounded-full border border-[color-mix(in_srgb,var(--accent-danger)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent-danger)_14%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase text-accent-danger">
                  {c.badgeBanned}
                </span>
              ) : null}
              {selectedPlayer.muted ? (
                <span className="rounded-full border border-gold/40 bg-[color-mix(in_srgb,var(--gold)_12%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase text-gold-light">
                  {c.badgeMuted}
                </span>
              ) : null}
            </div>

            {msg ? (
              <p
                className={`mt-3 text-xs ${msg.ok ? "text-moss-light" : "text-red-400"}`}
                role="status"
              >
                {msg.text}
              </p>
            ) : null}

            {/* Role */}
            <section className="mt-4 space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-ash">
                {c.assignRole}
              </p>
              {selectedPlayer.username.toLowerCase() === selfLower ? (
                <p className="text-xs text-muted">{c.roleSelfLocked}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value as Role)}
                    disabled={saving === "role"}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(c, r)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    disabled={draftRole === selectedPlayer.role || saving === "role"}
                    onClick={() => void saveRole(selectedPlayer)}
                  >
                    {c.roleSave}
                  </Button>
                </div>
              )}
            </section>

            {/* Balance */}
            <section className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-ash">
                {c.playersBalance} ·{" "}
                <span className="tabular-nums text-foreground">
                  {selectedPlayer.balance ?? 0}
                </span>
              </p>
              <p className="text-[11px] text-muted">{c.setBalanceHint}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={1_000_000}
                  step={1}
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  disabled={saving === "balance" || saving === "balance-set"}
                  placeholder="0"
                  className="w-28 rounded-md border border-border bg-surface px-2 py-1 text-sm tabular-nums"
                  aria-label={c.grantBalanceAmount}
                />
                <Button
                  variant="secondary"
                  className="glow-btn-balance"
                  disabled={saving === "balance" || saving === "balance-set"}
                  onClick={() => void grantBalance(selectedPlayer)}
                >
                  {c.grantBalance}
                </Button>
                <Button
                  variant="secondary"
                  disabled={saving === "balance" || saving === "balance-set"}
                  onClick={() => void setBalance(selectedPlayer)}
                >
                  {c.setBalance}
                </Button>
              </div>
            </section>

            {/* Password */}
            <section className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-ash">
                {c.adminPassword}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwDraft}
                  onChange={(e) => setPwDraft(e.target.value)}
                  disabled={saving === "pw"}
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                />
                <Button
                  variant="secondary"
                  disabled={saving === "pw"}
                  onClick={() => void savePassword(selectedPlayer)}
                >
                  {c.adminPasswordSave}
                </Button>
              </div>
            </section>

            {/* Email */}
            <section className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-ash">
                {c.adminEmail}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  autoComplete="off"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  disabled={saving === "email"}
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                />
                <Button
                  variant="secondary"
                  disabled={saving === "email"}
                  onClick={() => void saveEmail(selectedPlayer, false)}
                >
                  {c.adminEmailSave}
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving === "email"}
                  onClick={() => void saveEmail(selectedPlayer, true)}
                >
                  {c.adminEmailClear}
                </Button>
              </div>
            </section>

            {/* Moderation */}
            <section className="mt-3 space-y-3 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-ash">
                {c.modSection}
              </p>
              <label className="block text-sm">
                <span className="text-ash">{c.modReason}</span>
                <textarea
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="mt-1 min-h-[6rem] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  placeholder={c.modReasonPlaceholder}
                />
              </label>

              {selectedPlayer.username.toLowerCase() === selfLower ? (
                <p className="text-xs text-muted">{c.modCannotModerateSelf}</p>
              ) : (
                <>
                  <div className="space-y-2.5 rounded-lg border border-border bg-surface p-4">
                    <p className="text-xs font-medium text-ash">{c.modBan}</p>
                    {selectedPlayer.banned ? (
                      <div className="space-y-2">
                        <p className="text-xs text-accent-danger">
                          {c.modBannedUntil}:{" "}
                          {selectedPlayer.bannedUntil
                            ? new Date(selectedPlayer.bannedUntil).toLocaleString()
                            : "—"}
                          {selectedPlayer.banReason
                            ? ` — ${selectedPlayer.banReason}`
                            : ""}
                        </p>
                        <Button
                          variant="secondary"
                          disabled={saving === "unban"}
                          onClick={() => void unbanPlayer(selectedPlayer)}
                        >
                          {c.modUnban}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={banDays}
                          onChange={(e) => setBanDays(e.target.value)}
                          disabled={Boolean(saving)}
                          className="w-20 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm tabular-nums"
                          aria-label={c.modBanDays}
                        />
                        <span className="text-xs text-ash">{c.modBanDays}</span>
                        <Button
                          variant="danger"
                          disabled={Boolean(saving)}
                          onClick={() => {
                            const d = Number(banDays);
                            if (!Number.isFinite(d) || d < 1 || d > 9999) {
                              setMsg({ ok: false, text: c.modInvalidDays });
                              return;
                            }
                            void banPlayer(selectedPlayer, Math.floor(d));
                          }}
                        >
                          {c.modBan}
                        </Button>
                        <Button
                          variant="danger"
                          disabled={Boolean(saving)}
                          onClick={() => void banPlayer(selectedPlayer, 9999)}
                        >
                          {c.modBanPermanent}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 rounded-lg border border-border bg-surface p-4">
                    <p className="text-xs font-medium text-ash">{c.modMute}</p>
                    {selectedPlayer.muted ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gold-light">
                          {c.modMutedUntil}:{" "}
                          {selectedPlayer.mutedUntil
                            ? new Date(selectedPlayer.mutedUntil).toLocaleString()
                            : "—"}
                          {selectedPlayer.muteReason
                            ? ` — ${selectedPlayer.muteReason}`
                            : ""}
                        </p>
                        <Button
                          variant="secondary"
                          disabled={saving === "unmute"}
                          onClick={() => void unmutePlayer(selectedPlayer)}
                        >
                          {c.modUnmute}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={muteMinutes}
                          onChange={(e) => setMuteMinutes(e.target.value)}
                          disabled={Boolean(saving)}
                          className="w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm tabular-nums"
                          aria-label={c.modMuteMinutes}
                        />
                        <span className="text-xs text-ash">{c.modMuteMinutes}</span>
                        <Button
                          variant="secondary"
                          disabled={Boolean(saving)}
                          onClick={() => void mutePlayer(selectedPlayer)}
                        >
                          {c.modMute}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 rounded-lg border border-[color-mix(in_srgb,var(--accent-danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent-danger)_8%,var(--surface))] p-4">
                    <p className="text-xs font-medium text-accent-danger">
                      {c.modDelete}
                    </p>
                    {!confirmDelete ? (
                      <Button
                        variant="danger"
                        disabled={Boolean(saving)}
                        onClick={() => setConfirmDelete(true)}
                      >
                        {c.modDelete}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-accent-danger">
                          {c.modDeleteConfirm}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="danger"
                            disabled={saving === "delete"}
                            onClick={() => void deletePlayer(selectedPlayer)}
                          >
                            {c.modDeleteConfirmYes}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={saving === "delete"}
                            onClick={() => setConfirmDelete(false)}
                          >
                            {c.modDeleteConfirmNo}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </aside>
        ) : null}
      </div>

      {selectedPlayer ? (
        <PlayerProfileModal
          dict={dict}
          username={selectedPlayer.username}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}
