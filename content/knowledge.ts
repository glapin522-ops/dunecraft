/**
 * Static knowledge base for FAQ / Guides / Server systems.
 * Blob CMS can replace this later — keep the KnowledgeEntry shape stable.
 */

import { ruleSections } from "./rules";

export type KnowledgeKind = "rules" | "faq" | "guide" | "system";

export type KnowledgeEntry = {
  id: string;
  kind: KnowledgeKind;
  tags?: string[];
  title: { ru: string; en: string };
  summary: { ru: string; en: string };
  body: { ru: string; en: string };
};

const ruleFaqEntries: KnowledgeEntry[] = ruleSections.map((section) => ({
  id: `faq-rules-${section.id}`,
  kind: "rules",
  tags: ["правила", "rules", section.id, section.title.ru, section.title.en],
  title: {
    ru: `Правила: ${section.title.ru}`,
    en: `Rules: ${section.title.en}`,
  },
  summary: {
    ru: section.items.ru[0] ?? section.title.ru,
    en: section.items.en[0] ?? section.title.en,
  },
  body: {
    ru: section.items.ru.map((line, i) => `${i + 1}. ${line}`).join("\n\n"),
    en: section.items.en.map((line, i) => `${i + 1}. ${line}`).join("\n\n"),
  },
}));

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: "faq-launcher",
    kind: "faq",
    tags: ["launcher", "лаунчер", "скачать", "download", "клиент"],
    title: {
      ru: "Как скачать и запустить лаунчер?",
      en: "How do I download and run the launcher?",
    },
    summary: {
      ru: "Лаунчер появится ближе к запуску — кнопка на главной пока заглушка.",
      en: "The launcher ships closer to launch — the home button is a stub for now.",
    },
    body: {
      ru: "Официальный лаунчер DuneCraft будет доступен на главной странице портала. Сейчас кнопка «Скачать лаунчер» — заглушка: сборка ещё не опубликована.\n\nКогда релиз состоится, скачайте клиент только с этого сайта. Сторонние сборки не поддерживаются и могут быть опасны.",
      en: "The official DuneCraft launcher will be linked from the portal home page. The «Download launcher» button is a stub until we publish a build.\n\nWhen it ships, download the client only from this site. Third-party builds are unsupported and may be unsafe.",
    },
  },
  {
    id: "faq-register",
    kind: "faq",
    tags: ["регистрация", "кабинет", "register", "cabinet", "аккаунт", "account"],
    title: {
      ru: "Как зарегистрироваться и войти в кабинет?",
      en: "How do I register and sign in to the cabinet?",
    },
    summary: {
      ru: "Ник и пароль на странице «Кабинет». Ник — только латиница.",
      en: "Username and password on the Cabinet page. Username is Latin letters only.",
    },
    body: {
      ru: "Откройте раздел «Кабинет» в шапке сайта. На вкладке регистрации укажите ник (4–24 символа, латиница и цифры, без пробелов и кириллицы) и пароль (минимум 8 символов: заглавная латинская буква, цифра и спецсимвол).\n\nПосле регистрации войдите тем же ником — сессия сохранится в браузере. Почту нужно указать сразу. 2FA можно привязать позже во вкладке «Безопасность».",
      en: "Open Cabinet in the site header. On the register tab enter a username (4–24 chars, Latin letters and digits, no spaces or Cyrillic) and a password (at least 8 chars: uppercase Latin letter, a digit, and a special character).\n\nAfter registering, sign in with the same username — the session stays in the browser. Email is required at register. You can enable 2FA later under Security.",
    },
  },
  {
    id: "faq-roles",
    kind: "faq",
    tags: ["роли", "roles", "создатель", "редактор", "игрок", "creator", "editor"],
    title: {
      ru: "Какие роли есть на портале?",
      en: "What roles exist on the portal?",
    },
    summary: {
      ru: "Игрок, Редактор и Создатель. Повышенные роли выдаёт Создатель.",
      en: "Player, Editor, and Creator. Elevated roles are granted by a Creator.",
    },
    body: {
      ru: "По умолчанию новый аккаунт получает роль «Игрок». Редакторы могут управлять новостями. Создатели — новостями, ролями игроков и служебными разделами кабинета.\n\nРоли «Редактор» и «Создатель» выдаёт только Создатель через поиск игроков в кабинете. Свою роль сменить нельзя.",
      en: "New accounts start as Player. Editors can manage news. Creators manage news, player roles, and staff cabinet tools.\n\nEditor and Creator are granted only by a Creator via player search in the cabinet. You cannot change your own role.",
    },
  },
  {
    id: "faq-donate",
    kind: "faq",
    tags: ["донат", "donate", "оплата", "payment", "привилегии", "vip"],
    title: {
      ru: "Как работает донат?",
      en: "How does donating work?",
    },
    summary: {
      ru: "Пакеты на странице «Донат» — черновики. Оплата откроется на запуске.",
      en: "Packs on the Donate page are drafts. Checkout opens at launch.",
    },
    body: {
      ru: "На странице «Донат» показаны черновые пакеты поддержки. Кнопки покупки отключены до запуска сервера — реальной оплаты и привилегий пока нет.\n\nДонат будет добровольной поддержкой проекта. Привилегии не дают права нарушать правила.",
      en: "The Donate page shows draft support packs. Buy buttons stay disabled until server launch — there are no real payments or perks yet.\n\nDonations will be voluntary project support. Perks never excuse rule breaks.",
    },
  },
  {
    id: "faq-rules",
    kind: "rules",
    tags: ["правила", "rules", "бан", "мут", "чат"],
    title: {
      ru: "Где почитать правила сервера?",
      en: "Where can I read the server rules?",
    },
    summary: {
      ru: "Те же пункты, что в разделе «Правила», разложены ниже отдельными вопросами FAQ.",
      en: "The same points as the Rules page are listed below as separate FAQ items.",
    },
    body: {
      ru: "Полный черновик живёт в меню «Правила». Те же разделы стоят в FAQ: Общие, Чат, Гриф и PvP, Донат, Наказания.\n\nЭто черновик до запуска. Новые нормы сюда не добавлялись.",
      en: "The full draft lives under Rules in the nav. The same sections are in this FAQ: General, Chat, Grief & PvP, Donate, Punishments.\n\nThis is a pre-launch draft. No new norms were added here.",
    },
  },
  ...ruleFaqEntries,
  {
    id: "faq-discord",
    kind: "faq",
    tags: ["discord", "дискорд", "сообщество", "community", "голос"],
    title: {
      ru: "Есть ли Discord сервера?",
      en: "Is there a Discord server?",
    },
    summary: {
      ru: "Ссылка-приглашение появится ближе к запуску (сейчас заглушка).",
      en: "The invite link arrives closer to launch (stub for now).",
    },
    body: {
      ru: "Сообщество DuneCraft в Discord планируется для новостей, лора и голосовых каналов. Приглашение пока не опубликовано — кнопки на сайте отмечены как «скоро».\n\nСледите за разделом «Новости» и главной страницей: ссылка появится ближе к релизу.",
      en: "The DuneCraft Discord is planned for news, lore, and voice. The invite is not public yet — site buttons are marked coming soon.\n\nWatch News and the home page: the link will appear closer to release.",
    },
  },
  {
    id: "guide-first-join",
    kind: "guide",
    tags: ["гайд", "guide", "первый вход", "first join", "старт"],
    title: {
      ru: "Гайд: первый вход",
      en: "Guide: first join",
    },
    summary: {
      ru: "Краткий маршрут новичка. Раздел пополнится.",
      en: "A short newcomer path. This section will grow.",
    },
    body: {
      ru: "Раздел пополнится.\n\nПланируется: регистрация на портале → скачивание лаунчера → первый вход на сервер → базовые системы мира. Пока это заглушка для категории «Гайды».",
      en: "This section will be filled in.\n\nPlanned: portal registration → download launcher → first server join → core world systems. Placeholder so the Guides category is visible.",
    },
  },
  {
    id: "system-craft",
    kind: "system",
    tags: ["система", "system", "крафт", "craft", "рецепты"],
    title: {
      ru: "Система: крафт",
      en: "System: crafting",
    },
    summary: {
      ru: "Кастомный крафт mid-fantasy мира. Описание появится позже.",
      en: "Custom mid-fantasy crafting. Details come later.",
    },
    body: {
      ru: "Раздел пополнится.\n\nЗдесь будет описание кастомных рецептов и станций крафта DuneCraft. Пока это пример записи типа «Системы сервера».",
      en: "This section will be filled in.\n\nCustom recipes and crafting stations for DuneCraft will be documented here. Placeholder entry for the Server systems category.",
    },
  },
];
