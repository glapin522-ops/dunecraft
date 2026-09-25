"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { StubBadge } from "./StubBadge";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { NewsPost, NewsStatus } from "@/lib/news-store";

type Props = { dict: Dictionary; locale: Locale };

type FormState = {
  id?: string;
  slug: string;
  date: string;
  pinned: boolean;
  status: NewsStatus;
  titleRu: string;
  titleEn: string;
  excerptRu: string;
  excerptEn: string;
  bodyRu: string;
  bodyEn: string;
  coverImageUrl: string;
};

const emptyForm = (): FormState => ({
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  pinned: false,
  status: "draft",
  titleRu: "",
  titleEn: "",
  excerptRu: "",
  excerptEn: "",
  bodyRu: "",
  bodyEn: "",
  coverImageUrl: "",
});

function fromPost(p: NewsPost): FormState {
  return {
    id: p.id,
    slug: p.slug,
    date: p.date,
    pinned: p.pinned,
    status: p.status,
    titleRu: p.title.ru,
    titleEn: p.title.en,
    excerptRu: p.excerpt.ru,
    excerptEn: p.excerpt.en,
    bodyRu: p.body.ru,
    bodyEn: p.body.en,
    coverImageUrl: p.coverImageUrl || "",
  };
}

export function CreatorNewsPanel({ dict, locale }: Props) {
  const c = dict.cabinet;
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news?all=1", { credentials: "same-origin" });
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { posts: NewsPost[] };
      setPosts(data.posts);
    } catch {
      setMsg(c.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [c.errorGeneric]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setEditing(true);
    setMsg("");
  }

  function openEdit(p: NewsPost) {
    setForm(fromPost(p));
    setEditing(true);
    setMsg("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const payload = {
      slug: form.slug.trim() || undefined,
      date: form.date,
      pinned: form.pinned,
      status: form.status,
      title: { ru: form.titleRu, en: form.titleEn },
      excerpt: { ru: form.excerptRu, en: form.excerptEn },
      body: { ru: form.bodyRu, en: form.bodyEn },
      coverImageUrl: form.coverImageUrl.trim() || null,
    };
    try {
      const res = await fetch(
        form.id ? `/api/news/${form.id}` : "/api/news",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error("save");
      setMsg(c.newsSaved);
      setEditing(false);
      await load();
    } catch {
      setMsg(c.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("patch");
      await load();
    } catch {
      setMsg(c.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(c.newsConfirmDelete)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("delete");
      setMsg(c.newsDeleted);
      await load();
    } catch {
      setMsg(c.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">
          {form.id ? c.newsEdit : c.newsCreate}
        </h2>
        <p className="mt-1 text-xs text-muted">{c.newsMarkdownHint}</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ash">{c.newsTitleRu}</span>
              <input
                required
                value={form.titleRu}
                onChange={(e) => setForm({ ...form, titleRu: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ash">{c.newsTitleEn}</span>
              <input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ash">{c.newsExcerptRu}</span>
              <textarea
                rows={2}
                value={form.excerptRu}
                onChange={(e) =>
                  setForm({ ...form, excerptRu: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ash">{c.newsExcerptEn}</span>
              <textarea
                rows={2}
                value={form.excerptEn}
                onChange={(e) =>
                  setForm({ ...form, excerptEn: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ash">{c.newsBodyRu}</span>
              <textarea
                rows={8}
                value={form.bodyRu}
                onChange={(e) => setForm({ ...form, bodyRu: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ash">{c.newsBodyEn}</span>
              <textarea
                rows={8}
                value={form.bodyEn}
                onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="text-ash">{c.newsSlug}</span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
                placeholder="auto"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ash">{c.newsDate}</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ash">{c.newsCover}</span>
              <input
                value={form.coverImageUrl}
                onChange={(e) =>
                  setForm({ ...form, coverImageUrl: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
                placeholder="https://…"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) =>
                  setForm({ ...form, pinned: e.target.checked })
                }
              />
              {c.newsPin}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.status === "published"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.checked ? "published" : "draft",
                  })
                }
              />
              {c.newsPublished}
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="gold" disabled={busy}>
              {c.newsSave}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              {c.newsCancel}
            </Button>
          </div>
        </form>
        {msg && (
          <p className="mt-3 text-sm text-moss-light" role="status">
            {msg}
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{c.newsTitle}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{c.newsLead}</p>
        </div>
        <Button variant="gold" onClick={openCreate} disabled={busy}>
          {c.newsCreate}
        </Button>
      </div>
      {msg && (
        <p className="text-sm text-moss-light" role="status">
          {msg}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-ash">…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-ash">{c.newsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ash">
                    <time dateTime={p.date}>{p.date}</time>
                    <StubBadge
                      label={
                        p.status === "published"
                          ? c.newsPublished
                          : c.newsDraft
                      }
                    />
                    {p.pinned && <StubBadge label={dict.common.pinned} />}
                  </div>
                  <p className="mt-1 font-medium">{p.title[locale]}</p>
                  <p className="truncate text-xs text-muted">{p.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openEdit(p)}
                  >
                    {c.newsEdit}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void patch(p.id, {
                        pinned: !p.pinned,
                      })
                    }
                  >
                    {p.pinned ? c.newsUnpin : c.newsPin}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void patch(p.id, {
                        status:
                          p.status === "published" ? "draft" : "published",
                      })
                    }
                  >
                    {p.status === "published"
                      ? c.newsUnpublish
                      : c.newsPublish}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void remove(p.id)}
                  >
                    {c.newsDelete}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
