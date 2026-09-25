/** Registration-only credential rules (login accepts existing passwords). */

export const USERNAME_MIN = 4;
export const USERNAME_MAX = 24;
/** Starts with Latin letter, then letters/digits only; length 4–24. No Cyrillic, spaces, underscore. */
export const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9]{3,23}$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_UPPER_RE = /[A-Z]/;
export const PASSWORD_DIGIT_RE = /[0-9]/
/** Special chars: ! # & @ $ % ^ * ( ) _ + - = [ ] { } ; : ' " , . < > / ? \ | */
export const PASSWORD_SPECIAL_RE =
  /[!#&@$%^*()_+\-=[\]{};':"\\|,.<>/?]/;

export type ValidationError =
  | "username_length"
  | "username_chars"
  | "password_length"
  | "password_upper"
  | "password_digit"
  | "password_special";

export function validateUsername(
  username: string,
): ValidationError | null {
  const normalized = username.trim();
  if (
    normalized.length < USERNAME_MIN ||
    normalized.length > USERNAME_MAX
  ) {
    return "username_length";
  }
  if (!USERNAME_RE.test(normalized)) {
    return "username_chars";
  }
  return null;
}

export function validatePassword(
  password: string,
): ValidationError | null {
  if (password.length < PASSWORD_MIN) {
    return "password_length";
  }
  if (!PASSWORD_UPPER_RE.test(password)) {
    return "password_upper";
  }
  if (!PASSWORD_DIGIT_RE.test(password)) {
    return "password_digit";
  }
  if (!PASSWORD_SPECIAL_RE.test(password)) {
    return "password_special";
  }
  return null;
}

/** Full registration validation (username + password). */
export function validateRegistration(
  username: string,
  password: string,
): ValidationError | null {
  return validateUsername(username) ?? validatePassword(password);
}
