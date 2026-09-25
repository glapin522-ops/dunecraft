import type { Locale } from "./i18n";
import ru from "@/messages/ru.json";
import en from "@/messages/en.json";

const dictionaries = { ru, en } as const;

export type Dictionary = typeof ru;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ru;
}
