import type { NewsPost } from "@/lib/news-store";

/** Static seed posts migrated into Blob/local store on first load. */
export function seedNewsPosts(): NewsPost[] {
  const now = new Date().toISOString();
  return [
    {
      id: "seed_portal_scaffold",
      slug: "portal-scaffold",
      date: "2026-09-20",
      pinned: true,
      status: "published",
      title: {
        ru: "Портал DuneCraft: каркас сайта",
        en: "DuneCraft portal: site scaffold",
      },
      excerpt: {
        ru: "Запустили черновой портал с локалями RU/EN и заглушками IP/Discord.",
        en: "Draft portal is up with RU/EN locales and IP/Discord stubs.",
      },
      body: {
        ru: "Это placeholder-новость студии. Мы собираем публичный сайт DuneCraft: навигация, новости, донат и кабинет.\n\nIP сервера и Discord появятся ближе к запуску — сейчас вместо них отображается «скоро». Онлайн и метрики намеренно не публикуем.",
        en: "This is placeholder studio news. We are building the public DuneCraft site: navigation, news, donate, and a cabinet.\n\nServer IP and Discord will appear closer to launch — for now they show “Coming soon”. We intentionally do not publish online counts or metrics.",
      },
      coverImageUrl: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "seed_donate_stubs",
      slug: "donate-stubs",
      date: "2026-09-05",
      pinned: false,
      status: "published",
      title: {
        ru: "Донат-пакеты: только заглушки",
        en: "Donate packs: stubs only",
      },
      excerpt: {
        ru: "На странице доната лежат черновые карточки. Кнопки покупки отключены до запуска.",
        en: "Draft cards sit on the donate page. Buy buttons stay off until launch.",
      },
      body: {
        ru: "Мы не подключаем платёжку и не продаём привилегии заранее. Карточки нужны, чтобы проверить вёрстку и тексты.\n\nКогда сервер будет готов, пакеты пересмотрим и включим покупку отдельно.",
        en: "We are not wiring payments or selling perks early. Cards exist to validate layout and copy.\n\nWhen the server is ready, packs will be revised and purchases enabled separately.",
      },
      coverImageUrl: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/** @deprecated Prefer listPublishedNews() from lib/news-store — kept for type re-exports */
export type { NewsPost };
