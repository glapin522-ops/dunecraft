import type { Locale } from "./i18n";

/** 1 эфир, 2 эфира, 5 эфиров, 21 эфир, 145 эфиров. */
export function currencyForm(
  amount: number,
  locale: Locale,
  forms: { one: string; few: string; many: string },
): string {
  const n = Math.abs(Math.trunc(amount));
  const rule = new Intl.PluralRules(locale === "en" ? "en" : "ru").select(n);
  if (rule === "one") return forms.one;
  if (rule === "few") return forms.few;
  return forms.many;
}
