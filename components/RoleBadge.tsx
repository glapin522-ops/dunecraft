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

export function RoleBadge({ role, dict, className = "" }: Props) {
  const tone =
    role === "creator"
      ? "role-badge-creator"
      : role === "editor"
        ? "role-badge-editor"
        : "role-badge-player";

  return (
    <span className={`role-badge ${tone} ${className}`.trim()}>
      {labelFor(dict, role)}
    </span>
  );
}
