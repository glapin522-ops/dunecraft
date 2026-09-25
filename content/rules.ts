export type RuleSection = {
  id: string;
  title: { ru: string; en: string };
  items: { ru: string[]; en: string[] };
};

export const ruleSections: RuleSection[] = [
  {
    id: "general",
    title: { ru: "Общие", en: "General" },
    items: {
      ru: [
        "Уважайте игроков и администрацию. Оскорбления и травля запрещены.",
        "Запрещены читы, дюпы и эксплуатация критических багов — сообщайте о них.",
        "Аккаунт и доступ — ваша ответственность. Не передавайте данные третьим лицам.",
      ],
      en: [
        "Respect players and staff. Insults and harassment are forbidden.",
        "Cheats, dupes, and critical bug abuse are banned — report issues instead.",
        "You are responsible for your account. Do not share credentials.",
      ],
    },
  },
  {
    id: "chat",
    title: { ru: "Чат", en: "Chat" },
    items: {
      ru: [
        "Без спама, рекламы сторонних проектов и флуда.",
        "Политика и токсичные провокации — вне правил сообщества.",
        "Язык общения: русский и английский. Мат — по ситуации, без целенаправленного оскорбления.",
      ],
      en: [
        "No spam, third-party ads, or flood.",
        "Politics and toxic baiting are outside community rules.",
        "Chat languages: Russian and English. Swearing only without targeted abuse.",
      ],
    },
  },
  {
    id: "grief-pvp",
    title: { ru: "Гриф и PvP", en: "Grief & PvP" },
    items: {
      ru: [
        "Гриф чужих построек вне разрешённых зон запрещён.",
        "PvP — по правилам зон (уточняется к запуску).",
        "Кража из защищённых сундуков и обход приватов — наказуемы.",
      ],
      en: [
        "Griefing builds outside allowed zones is forbidden.",
        "PvP follows zone rules (to be finalized at launch).",
        "Theft from protected chests and bypassing claims is punishable.",
      ],
    },
  },
  {
    id: "donate",
    title: { ru: "Донат", en: "Donate" },
    items: {
      ru: [
        "Донат — добровольная поддержка. Привилегии не дают права нарушать правила.",
        "Возвраты и споры — по отдельной политике (появится к запуску).",
        "Покупка на портале пока недоступна: кнопки — заглушки.",
      ],
      en: [
        "Donations are voluntary support. Perks do not excuse rule breaks.",
        "Refunds and disputes follow a separate policy (at launch).",
        "Checkout is unavailable for now: buttons are stubs.",
      ],
    },
  },
  {
    id: "punishments",
    title: { ru: "Наказания", en: "Punishments" },
    items: {
      ru: [
        "Предупреждение, мут, кик, временный или постоянный бан — по тяжести.",
        "Обход наказания новыми аккаунтами ужесточает меры.",
        "Апелляции — через контакты студии, когда каналы будут открыты.",
      ],
      en: [
        "Warn, mute, kick, temp or permanent ban — by severity.",
        "Evading punishment with alts escalates the response.",
        "Appeals go through studio contacts once channels open.",
      ],
    },
  },
];
