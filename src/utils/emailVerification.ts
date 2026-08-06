import crypto from "node:crypto";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createVerificationCode() {
  const code = crypto.randomInt(0, 10000).toString().padStart(4, "0");
  const hashedCode = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  return { code, hashedCode, expiresAt };
}

export function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
