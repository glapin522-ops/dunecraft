import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionaries";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export function Footer({ dict }: Props) {
  return (
    <footer className="mt-auto border-t border-[color:var(--glass-stroke)] bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-gold-light">DuneCraft</p>
          <p className="mt-1 max-w-md text-sm text-muted">{dict.footer.tagline}</p>
        </div>
        <p className="text-xs text-ash">{dict.footer.rights}</p>
      </div>
    </footer>
  );
}
