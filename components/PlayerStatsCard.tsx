"use client";

import { Card } from "./Card";
import { ModelViewportStub } from "./ModelViewportStub";
import type { Dictionary } from "@/lib/dictionaries";
import type { SessionUser } from "@/lib/auth/types";

type Props = {
  user: SessionUser;
  dict: Dictionary;
};

function roleLabel(dict: Dictionary, role: SessionUser["role"]): string {
  const c = dict.cabinet;
  if (role === "creator") return c.roleCreator;
  if (role === "editor") return c.roleEditor;
  return c.rolePlayer;
}

/** Legacy compact stats card — overview uses CabinetDashboard instead. */
export function PlayerStatsCard({ user, dict }: Props) {
  const c = dict.cabinet;
  const level = user.level ?? 1;
  const vipLevel = user.vipLevel ?? 0;
  const vipDisplay = vipLevel <= 0 ? c.statsVipNone : `VIP ${vipLevel}`;

  return (
    <Card className="overflow-hidden">
      <h2 className="text-lg font-semibold text-gold-light">{c.statsTitle}</h2>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1.8fr)_minmax(11rem,1fr)] md:items-stretch">
        <ModelViewportStub
          placeholder={c.statsModelPlaceholder}
          hint={c.statsModelHint}
        />

        <div className="flex flex-col divide-y divide-border rounded-lg panel-solid-deep">
          <StatRow label={c.statsLevel} value={String(level)} />
          <StatRow label={c.statsRole} value={roleLabel(dict, user.role)} />
          <StatRow label={c.statsVip} value={vipDisplay} />
        </div>
      </div>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-ash">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
