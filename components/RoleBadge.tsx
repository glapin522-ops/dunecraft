import type { Dictionary } from "@/lib/dictionaries";
import type { Role } from "@/lib/auth/types";

type Props = {
  role: Role;
  dict: Dictionary;
  className?: string;
};

function labelFor(dict: Dictionary, role: Role): string {
  const c = dict.cabinet;
  if (role === "creator") return c.roleCreator;
  if (role === "editor") return c.roleEditor;
  return c.rolePlayer;
}

/** Wick lamp — creator mark only. Not the donate rune. */
function CreatorLamp() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden
      className="role-lamp"
    >
      <path
        className="role-lamp-flame"
        d="M8 2.1c.65 1 .85 1.65.85 2.35A1.5 1.5 0 1 1 6.6 4.1c0-.55.28-1.2 1.4-2"
        fill="currentColor"
      />
      <path
        d="M4.25 8.15c0-1.35 1.55-2.15 3.75-2.15s3.75.8 3.75 2.15v.45c0 1.15-1.15 1.75-2.05 1.95v1.35H6.3V10.55c-.9-.2-2.05-.8-2.05-1.95z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="miter"
      />
      <path
        d="M6.15 13.35h3.7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function RoleBadge({ role, dict, className = "" }: Props) {
  const tone =
    role === "creator"
      ? "role-badge-creator"
      : role === "editor"
        ? "role-badge-editor"
        : "role-badge-player";

  return (
    <span className={`role-badge ${tone} ${className}`.trim()}>
      {role === "creator" ? <CreatorLamp /> : null}
      {labelFor(dict, role)}
    </span>
  );
}
