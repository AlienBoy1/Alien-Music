const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function usernameValidationError(username: string): string | null {
  const n = normalizeUsername(username);
  if (!n) return "El username no puede estar vacío";
  if (n.length < 3) return "Mínimo 3 caracteres";
  if (n.length > 20) return "Máximo 20 caracteres";
  if (!USERNAME_REGEX.test(n)) {
    return "Solo letras minúsculas, números y guión bajo";
  }
  return null;
}
