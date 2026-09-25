"use client";

import { useRef, useState } from "react";
import { PlayerSkinView } from "./PlayerSkinView";
import { DEFAULT_CAPE_URL } from "@/lib/default-skin";
import type { Dictionary } from "@/lib/dictionaries";
import type { SessionUser } from "@/lib/auth/types";

type Props = {
  user: SessionUser;
  dict: Dictionary;
  open: boolean;
  onClose: () => void;
  onUser: (user: SessionUser) => void;
};

function mapCosmeticError(dict: Dictionary, code: string | undefined): string {
  const c = dict.cabinet;
  switch (code) {
    case "file_too_large":
      return c.skinFileTooLarge;
    case "not_png":
      return c.skinNotPng;
    case "bad_dimensions":
      return c.skinBadSize;
    case "need_account":
      return c.skinNeedAccount;
    case "missing_file":
      return c.skinMissingFile;
    default:
      return c.skinUploadError;
  }
}

export function SkinCapeStudio({ user, dict, open, onClose, onUser }: Props) {
  const c = dict.cabinet;
  const skinInput = useRef<HTMLInputElement>(null);
  const capeInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<
    "skin" | "cape" | "clear-skin" | "clear-cape" | null
  >(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  async function upload(kind: "skin" | "cape", file: File) {
    setBusy(kind);
    setErr("");
    setMsg("");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("file", file);
      const res = await fetch("/api/auth/cosmetics", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const data = (await res.json()) as {
        error?: string;
        user?: SessionUser;
      };
      if (!res.ok || !data.user) {
        setErr(mapCosmeticError(dict, data.error));
        return;
      }
      onUser(data.user);
      setMsg(kind === "skin" ? c.skinUploaded : c.capeUploaded);
    } catch {
      setErr(c.skinUploadError);
    } finally {
      setBusy(null);
    }
  }

  async function clearKind(kind: "skin" | "cape") {
    setBusy(kind === "skin" ? "clear-skin" : "clear-cape");
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/auth/cosmetics", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: SessionUser;
      };
      if (!res.ok || !data.user) {
        setErr(mapCosmeticError(dict, data.error));
        return;
      }
      onUser(data.user);
      setMsg(kind === "skin" ? c.skinCleared : c.capeCleared);
    } catch {
      setErr(c.skinUploadError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skin-studio-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[color:var(--glass-stroke)] bg-[#0c0a14] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="skin-studio-title" className="text-lg font-bold tracking-tight sm:text-xl">
              {c.skinStudioTitle}
            </h3>
            <p className="mt-1 text-sm text-ash">{c.skinStudioLead}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3 py-1.5 text-sm text-ash-light hover:text-foreground"
          >
            {c.skinStudioClose}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center rounded-3xl border border-white/5 bg-[#12101c] p-4">
            <div className="flex h-64 w-full items-center justify-center sm:h-72">
              <PlayerSkinView skinUrl={user.skinUrl} capeUrl={user.capeUrl} autoRotate />
            </div>
            <input
              ref={skinInput}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload("skin", file);
              }}
            />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => skinInput.current?.click()}
              className="mt-3 inline-flex min-w-[10rem] items-center justify-center rounded-full bg-[#ff2d8b] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,45,139,0.35)] transition hover:bg-[#ff4aa0] disabled:opacity-50"
            >
              {busy === "skin" ? c.skinUploading : c.skinUpload}
            </button>
            {user.skinUrl ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void clearKind("skin")}
                className="mt-2 text-xs text-ash hover:text-foreground"
              >
                {busy === "clear-skin" ? c.skinUploading : c.skinReset}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col items-center rounded-3xl border border-white/5 bg-[#12101c] p-4">
            <div className="flex h-64 w-full items-center justify-center sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.capeUrl || DEFAULT_CAPE_URL}
                alt=""
                width={320}
                height={160}
                className="h-40 w-80 max-w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <input
              ref={capeInput}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload("cape", file);
              }}
            />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => capeInput.current?.click()}
              className="mt-3 inline-flex min-w-[10rem] items-center justify-center rounded-full bg-[#ff2d8b] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,45,139,0.35)] transition hover:bg-[#ff4aa0] disabled:opacity-50"
            >
              {busy === "cape" ? c.skinUploading : c.skinUpload}
            </button>
            {user.capeUrl ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void clearKind("cape")}
                className="mt-2 text-xs text-ash hover:text-foreground"
              >
                {busy === "clear-cape" ? c.skinUploading : c.capeReset}
              </button>
            ) : null}
          </div>
        </div>

        {(msg || err) && (
          <p
            className={`mt-4 text-center text-sm ${err ? "text-red-400" : "text-moss-light"}`}
            role="status"
          >
            {err || msg}
          </p>
        )}
      </div>
    </div>
  );
}
