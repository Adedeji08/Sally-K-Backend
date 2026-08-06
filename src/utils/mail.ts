import { transporter } from "../config/mailer.js";
import { env } from "../config/env.js";

export async function sendVerificationEmail(to: string, fullName: string, code: string) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Verify your Sally K account",
    html: `
      <p>Hi ${fullName},</p>
      <p>Your verification code is:</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, fullName: string, rawToken: string) {
  const resetLink = `${env.CORS_ORIGIN}/reset-password?token=${rawToken}`;

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Reset your Sally K password",
    html: `
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If your app doesn't have that page yet, here's the raw reset token: <strong>${rawToken}</strong></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
