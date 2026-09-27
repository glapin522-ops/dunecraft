import { readPublicJson, writePublicJson } from "./blob-json";
import { promises as fs } from "fs";
import path from "path";
import { seedNewsPosts } from "@/content/news";

export type Localized = { ru: string; en: string };

export type NewsStatus = "draft" | "published";

export type NewsPost = {
  id: string;
  slug: string;
  date: string;
  pinned: boolean;
  status: NewsStatus;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** List row for cabinet summary responses — body may be omitted. */
export type NewsListItem = Omit<NewsPost, "body"> & { body?: Localized };

export type NewsInput = {
  slug?: string;
  date?: string;
  pinned?: boolean;
  status?: NewsStatus;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  coverImageUrl?: string | null;
};

const BLOB_PATHNAME = "dunecraft/news-posts.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "news-posts.json");

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function sortPosts(posts: NewsPost[]): NewsPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt);
  });
}

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(input: string): string {
  const lowered = input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const translit = [...lowered]
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("");
  return (
    translit
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `post-${Date.now()}`
  );
}

async function readLocal(): Promise<NewsPost[] | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw) as NewsPost[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeLocal(posts: NewsPost[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(posts, null, 2), "utf8");
}

async function readBlob(): Promise<NewsPost[] | null> {
  const { data } = await readPublicJson<NewsPost[]>(BLOB_PATHNAME);
  return Array.isArray(data) ? data : null;
}

async function writeBlob(posts: NewsPost[]): Promise<void> {
  await writePublicJson(BLOB_PATHNAME, posts);
}

async function persist(posts: NewsPost[]): Promise<void> {
  if (hasBlob()) {
    try {
      await writeBlob(posts);
      // also mirror locally for offline/debug
      await writeLocal(posts).catch(() => undefined);
      return;
    } catch (err) {
      console.error("[news-store] blob write failed, writing local", err);
    }
  }
  await writeLocal(posts);
}

async function loadRaw(): Promise<NewsPost[]> {
  if (hasBlob()) {
    try {
      const fromBlob = await readBlob();
      if (fromBlob && fromBlob.length > 0) return fromBlob;
    } catch (err) {
      console.error("[news-store] blob read failed", err);
    }
  }
  const local = await readLocal();
  if (local && local.length > 0) return local;
  const seeded = seedNewsPosts();
  await persist(seeded);
  return seeded;
}

export async function listAllNews(): Promise<NewsPost[]> {
  return sortPosts(await loadRaw());
}

export async function listPublishedNews(): Promise<NewsPost[]> {
  return sortPosts(
    (await loadRaw()).filter((p) => p.status === "published"),
  );
}

export async function getNewsBySlug(
  slug: string,
  opts?: { includeDrafts?: boolean },
): Promise<NewsPost | undefined> {
  const posts = await loadRaw();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return undefined;
  if (!opts?.includeDrafts && post.status !== "published") return undefined;
  return post;
}

export async function getNewsById(id: string): Promise<NewsPost | undefined> {
  return (await loadRaw()).find((p) => p.id === id);
}

function ensureUniqueSlug(posts: NewsPost[], slug: string, exceptId?: string): string {
  let base = slugify(slug);
  let candidate = base;
  let i = 2;
  while (
    posts.some(
      (p) => p.slug === candidate && (!exceptId || p.id !== exceptId),
    )
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

export async function createNews(input: NewsInput): Promise<NewsPost> {
  const posts = await loadRaw();
  const now = new Date().toISOString();
  const date = input.date || now.slice(0, 10);
  const preferred =
    input.slug?.trim() ||
    input.title.ru.trim() ||
    input.title.en.trim() ||
    `post-${Date.now()}`;
  const post: NewsPost = {
    id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    slug: ensureUniqueSlug(posts, preferred),
    date,
    pinned: Boolean(input.pinned),
    status: input.status === "published" ? "published" : "draft",
    title: {
      ru: input.title.ru.trim(),
      en: input.title.en.trim() || input.title.ru.trim(),
    },
    excerpt: {
      ru: input.excerpt.ru.trim(),
      en: input.excerpt.en.trim() || input.excerpt.ru.trim(),
    },
    body: {
      ru: input.body.ru,
      en: input.body.en || input.body.ru,
    },
    coverImageUrl: input.coverImageUrl?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  await persist(posts);
  return post;
}

export async function updateNews(
  id: string,
  patch: Partial<NewsInput>,
): Promise<NewsPost | null> {
  const posts = await loadRaw();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const current = posts[idx];
  const nextSlug = patch.slug
    ? ensureUniqueSlug(posts, patch.slug, id)
    : current.slug;
  const updated: NewsPost = {
    ...current,
    slug: nextSlug,
    date: patch.date ?? current.date,
    pinned: patch.pinned ?? current.pinned,
    status: patch.status ?? current.status,
    title: patch.title
      ? {
          ru: patch.title.ru.trim(),
          en: patch.title.en.trim() || patch.title.ru.trim(),
        }
      : current.title,
    excerpt: patch.excerpt
      ? {
          ru: patch.excerpt.ru.trim(),
          en: patch.excerpt.en.trim() || patch.excerpt.ru.trim(),
        }
      : current.excerpt,
    body: patch.body
      ? {
          ru: patch.body.ru,
          en: patch.body.en || patch.body.ru,
        }
      : current.body,
    coverImageUrl:
      patch.coverImageUrl !== undefined
        ? patch.coverImageUrl?.trim() || null
        : current.coverImageUrl,
    updatedAt: new Date().toISOString(),
  };
  posts[idx] = updated;
  await persist(posts);
  return updated;
}

export async function deleteNews(id: string): Promise<boolean> {
  const posts = await loadRaw();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await persist(next);
  return true;
}
