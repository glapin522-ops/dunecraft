"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import type { KnowledgeEntry, KnowledgeKind } from "@/content/knowledge";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

type CategoryFilter = "all" | KnowledgeKind;

type Props = {
  locale: Locale;
  dict: Dictionary;
  entries: KnowledgeEntry[];
};

function matchesQuery(entry: KnowledgeEntry, locale: Locale, q: string): boolean {
  if (!q) return true;
  const hay = [
    entry.title[locale],
    entry.summary[locale],
    entry.body[locale],
    ...(entry.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function KindBadge({
  kind,
  labels,
}: {
  kind: KnowledgeKind;
  labels: { rules: string; faq: string; guide: string; system: string };
}) {
  const label =
    kind === "faq" ? labels.faq : kind === "guide" ? labels.guide : labels.system;
  return (
    <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold-light">
      {label}
    </span>
  );
}

function KnowledgeItem({
  entry,
  locale,
  kindLabels,
  defaultOpen,
}: {
  entry: KnowledgeEntry;
  locale: Locale;
  kindLabels: { faq: string; guide: string; system: string };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const paragraphs = entry.body[locale].split(/\n\n+/).filter(Boolean);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-3"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mt-0.5 flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <KindBadge kind={entry.kind} labels={kindLabels} />
          </span>
          <span className="text-base font-semibold text-foreground sm:text-lg">
            {entry.title[locale]}
          </span>
          {!open && (
            <span className="text-sm text-muted">{entry.summary[locale]}</span>
          )}
        </span>
        <span
          className={`mt-1 shrink-0 text-ash-light transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-5 py-4 text-sm leading-relaxed text-ash-light">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
      )}
    </Card>
  );
}

export function FaqClient({ locale, dict, entries }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const faq = dict.faq;

  const kindLabels = {
    rules: faq.kindRules,
    faq: faq.kindFaq,
    guide: faq.kindGuide,
    system: faq.kindSystem,
  };

  const chips: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: faq.all },
    { id: "rules", label: faq.kindRules },
    { id: "faq", label: faq.kindFaq },
    { id: "guide", label: faq.kindGuide },
    { id: "system", label: faq.kindSystem },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== "all" && e.kind !== category) return false;
      return matchesQuery(e, locale, q);
    });
  }, [entries, category, locale, query]);

  return (
    <div className="mt-8 space-y-6">
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          {faq.searchPlaceholder}
        </label>
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ash"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={faq.searchPlaceholder}
          className="w-full rounded-xl border border-border bg-surface-2/90 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-ash outline-none transition focus:border-gold/45 focus:ring-1 focus:ring-gold/30"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={faq.title}>
        {chips.map((chip) => {
          const active = category === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(chip.id)}
              className={`rounded-lg border px-3.5 py-1.5 text-sm font-bold tracking-wide transition-colors ${
                active
                  ? "border-gold/50 bg-moss/30 text-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-border bg-surface-2/80 text-ash-light hover:border-gold/35 hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ash">{faq.comingSoon}</p>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-2/60 px-5 py-8 text-center text-sm text-muted">
          {query.trim() || category !== "all" ? faq.noResults : faq.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <KnowledgeItem
                entry={entry}
                locale={locale}
                kindLabels={kindLabels}
                defaultOpen={false}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
