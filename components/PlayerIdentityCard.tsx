"use client";

import { RoleBadge } from "./RoleBadge";
import { SkinHead } from "./SkinHead";
import type { Dictionary } from "@/lib/dictionaries";
import type { Role } from "@/lib/auth/types";

type Props = {
  username: string;
  role: Role;
  skinUrl?: string | null;
  dict: Dictionary;
  className?: string;
};

function frameTone(role: Role): string {
  if (role === "creator") {
    return "border-[color:var(--accent-skin)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-skin)_55%,transparent),0_0_18px_color-mix(in_srgb,var(--accent-skin)_28%,transparent)]";
  }
  if (role === "editor") {
    return "border-[color:var(--accent-creator)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-creator)_45%,transparent)]";
  }
  return "border-[color-mix(in_srgb,var(--foreground)_22%,var(--border))]";
}

/** TAB-list identity: square head fill, nick, role pill. */
export function PlayerIdentityCard({
  username,
  role,
  skinUrl,
  dict,
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border border-white/5 bg-[#10182c] px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5 ${className}`.trim()}
    >
      <div
        className={`shrink-0 overflow-hidden rounded-[6px] border-[3px] ${frameTone(role)}`}
      >
        <SkinHead skinUrl={skinUrl} size={72} alt={username} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold tracking-wide text-foreground sm:text-2xl">
          {username}
        </p>
        <div className="mt-1.5">
          <RoleBadge role={role} dict={dict} />
        </div>
      </div>
    </div>
  );
}
