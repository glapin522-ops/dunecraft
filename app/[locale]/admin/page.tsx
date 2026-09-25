import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

/** Old password stub removed — creator tools live in /cabinet. */
export default async function AdminRedirectPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ru";
  redirect(`/${locale}/cabinet`);
}
