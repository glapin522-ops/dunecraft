/**
 * Email delivery: Resend when RESEND_API_KEY is set, else functional stub.
 * Stub returns the plaintext code to the caller so APIs can expose `devCode`
 * when EMAIL_STUB=1 or no Resend key is configured.
 */

export type SendCodeResult = {
  ok: true;
  stub: boolean;
  /** Present only in stub/dev mode — never when real email was sent. */
  devCode?: string;
};

function hasResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Stub mode: no Resend key, or EMAIL_STUB=1 forces stub even if key exists. */
export function isEmailStubMode(): boolean {
  if (process.env.EMAIL_STUB?.trim() === "1") return true;
  return !hasResend();
}

export function generateSixDigitCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < 5 || e.length > 254) return false;
  // Basic RFC-ish: local@domain.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function sendViaResend(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const key = process.env.RESEND_API_KEY!.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "DuneCraft <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend failed: ${res.status} ${body}`);
  }
}

/**
 * Send a verification / password-change code.
 * In stub mode returns { stub: true, devCode } without sending mail.
 */
export async function sendVerificationCode(
  to: string,
  code: string,
  purpose: "email_verify" | "password_change",
): Promise<SendCodeResult> {
  const subject =
    purpose === "password_change"
      ? "DuneCraft — код смены пароля / password change code"
      : "DuneCraft — код подтверждения почты / email verification code";
  const text =
    purpose === "password_change"
      ? `Ваш код для смены пароля: ${code}\nYour password-change code: ${code}\n\nКод действует 15 минут / Valid for 15 minutes.`
      : `Ваш код подтверждения: ${code}\nYour verification code: ${code}\n\nКод действует 15 минут / Valid for 15 minutes.`;

  if (isEmailStubMode()) {
    console.info(
      `[email:stub] to=${to} purpose=${purpose} code=${code}`,
    );
    return { ok: true, stub: true, devCode: code };
  }

  await sendViaResend(to, subject, text);
  return { ok: true, stub: false };
}
