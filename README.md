# DuneCraft — портал сервера

Сайт Minecraft RPG-сервера **DuneCraft** на Next.js (App Router) + TypeScript + Tailwind CSS.

**Теглайн:** RPG-мир по пяти эпохам — от леса до чумы / An RPG world across five eras — from forest to plague.

**Live:** https://dunecraft.vercel.app

## Запуск локально

```bash
cd /workspace/dunecraft-site
npm i
cp .env.example .env.local   # или: npx vercel env pull .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — редирект на `/ru`.

Сборка:

```bash
npm run build
npm start
```

## Фаза 1: роль «Создатель» и новости из ЛК

- Роль в UI: **Создатель** (EN: Creator). Код: `creator`.
- Вход в `/cabinet` по нику + паролю (jose JWT в httpOnly cookie `dc_session`).
- Seed-создатель из env: `CREATOR_USERNAME` / `CREATOR_PASSWORD` (без 2FA, если нет записи в store).
- Регистрация создаёт аккаунт **игрока** (`player`); хэш пароля в Blob/local JSON.
- Создатели в ЛК видят вкладку **Новости**: создать / править / опубликовать / закрепить / удалить.
- Кнопка создания: **«Опубликовать новость»** / **"Publish news"**.
- Старый `/admin` редиректит в `/cabinet`.
- Публичные `/[locale]/news` читают только `published`, закреплённые сверху.
- Persist: **Vercel Blob** (`dunecraft/news-posts.json`, `dunecraft/users.json`, `dunecraft/auth-tokens.json`).

### Безопасность аккаунта (все залогиненные)

В **Обзор** ЛК — секция безопасности:

1. **Почта** — привязать / сменить email → код на почту → подтвердить.
2. **Сменить пароль** — только при подтверждённой почте → код → новый пароль (≥8, заглавная, цифра, спецсимвол).
3. **2FA (TOTP)** — QR + секрет → код из Google Authenticator → включено. При входе после пароля — второй шаг `/api/auth/login/2fa` (cookie `dc_2fa_pending`).

### Email: реал vs stub

| Режим | Условие | Поведение |
|-------|---------|-----------|
| **Resend** | `RESEND_API_KEY` задан и `EMAIL_STUB` ≠ `1` | Письма уходят через Resend |
| **Stub** | нет ключа **или** `EMAIL_STUB=1` | Код в ответе API как `devCode`; в UI: «Письмо пока не уходит — код для проверки» |

### Тестовый вход Создателя

```
ник:      creator
пароль:   change-me
```

Аккаунт **fsdf** (creator в Blob) — основной рабочий создатель.

## Переменные окружения

| Ключ | Назначение |
|------|------------|
| `SESSION_SECRET` | Подпись JWT-сессии и шифрование TOTP-секрета |
| `CREATOR_USERNAME` / `CREATOR_PASSWORD` | Seed-создатель |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `RESEND_API_KEY` | Реальная отправка писем (опционально) |
| `EMAIL_FROM` | From для Resend (по умолчанию onboarding@resend.dev) |
| `EMAIL_STUB` | `1` — принудительный stub-режим кодов |

См. `.env.example`.

## Локали (i18n)

- Сегмент: `app/[locale]/…`
- Словари: `messages/ru.json`, `messages/en.json`

## Маршруты

Публичные: `/`, `/news`, `/news/[slug]`, `/donate`, `/cabinet`, `/rules`, `/contacts`

API: `/api/auth/login`, `/api/auth/login/2fa`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/email`, `/api/auth/password`, `/api/auth/totp`, `/api/news`

`/admin` → редирект на `/cabinet`

## Стек

Next.js 16, React 19, Tailwind CSS 4, TypeScript, jose, bcryptjs, otpauth, qrcode, @vercel/blob, marked.
