import type { Locale } from "./i18n";
import ruBase from "@/messages/ru.json";
import enBase from "@/messages/en.json";
import ruSkin from "@/messages/skin.ru.json";
import enSkin from "@/messages/skin.en.json";
import ruDonateShop from "@/messages/donate-shop.ru.json";
import enDonateShop from "@/messages/donate-shop.en.json";

const ru = {
  ...ruBase,
  cabinet: { ...ruBase.cabinet, ...ruSkin },
  donate: { ...ruBase.donate, ...ruDonateShop },
} as const;

const en = {
  ...enBase,
  cabinet: { ...enBase.cabinet, ...enSkin },
  donate: { ...enBase.donate, ...enDonateShop },
} as const;

const dictionaries = { ru, en } as const;

export type Dictionary = typeof ru;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? (en as unknown as Dictionary) : ru;
}
