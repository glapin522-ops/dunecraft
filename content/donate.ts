export type DonatePack = {
  id: string;
  priceLabel: { ru: string; en: string };
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  featured?: boolean;
};

export const donatePacks: DonatePack[] = [
  {
    id: "wanderer",
    priceLabel: { ru: "99 ₽", en: "≈ $1" },
    title: { ru: "Странник", en: "Wanderer" },
    description: {
      ru: "Небольшой жест поддержки. Привилегии не выдаются — пакет-заглушка.",
      en: "A small support gesture. No perks yet — stub pack.",
    },
  },
  {
    id: "pathfinder",
    priceLabel: { ru: "299 ₽", en: "≈ $3" },
    title: { ru: "Следопыт", en: "Pathfinder" },
    description: {
      ru: "Средний пакет для проверки карточки доната. Покупка отключена.",
      en: "Mid pack to validate the donate card. Purchase disabled.",
    },
    featured: true,
  },
  {
    id: "chronicler",
    priceLabel: { ru: "799 ₽", en: "≈ $8" },
    title: { ru: "Летописец", en: "Chronicler" },
    description: {
      ru: "Крупный stub-пакет. Реальная оплата появится на запуске.",
      en: "Larger stub pack. Real checkout arrives at launch.",
    },
  },
];
