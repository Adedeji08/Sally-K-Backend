import crypto from "node:crypto";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  return { rawToken, hashedToken, expiresAt };
}

export function hashResetToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
