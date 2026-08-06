import { Role } from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { createResetToken, hashResetToken } from "../../utils/resetToken.js";
import { createVerificationCode, hashVerificationCode } from "../../utils/emailVerification.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../utils/mail.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "./auth.validation.js";

const ROLE_MAP: Record<SignupInput["role"], Role> = {
  shopper: Role.BUYER,
  seller: Role.SELLER,
};

function toAuthUser(user: { id: string; fullName: string; email: string; role: Role; emailVerified: boolean }) {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role, emailVerified: user.emailVerified };
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashedPassword = await hashPassword(input.password);
  const { code, hashedCode, expiresAt } = createVerificationCode();

  const user = await prisma.user.create({
    data: {
      fullName: input.full_name,
      email: input.email,
      password: hashedPassword,
      role: ROLE_MAP[input.role],
      emailVerificationCode: hashedCode,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  try {
    await sendVerificationEmail(user.email, user.fullName, code);
  } catch (err) {
    console.error(`[email] failed to send verification email to ${user.email}`, err);
  }

  const token = signToken({ sub: user.id, name: user.fullName, email: user.email, role: user.role });

  return { user: toAuthUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await comparePassword(input.password, user.password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, name: user.fullName, email: user.email, role: user.role });

  return { user: toAuthUser(user), token };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always respond the same way whether or not the account exists, to avoid leaking
  // which emails are registered.
  if (!user) {
    return;
  }

  const { rawToken, hashedToken, expiresAt } = createResetToken();

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: hashedToken, resetPasswordExpiresAt: expiresAt },
  });

  try {
    await sendPasswordResetEmail(user.email, user.fullName, rawToken);
  } catch (err) {
    console.error(`[email] failed to send password reset email to ${user.email}`, err);
  }
}

export async function resetPassword(input: ResetPasswordInput) {
  const hashedToken = hashResetToken(input.token);

  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: hashedToken, resetPasswordExpiresAt: { gt: new Date() } },
  });

  if (!user) {
    throw ApiError.badRequest("This reset link is invalid or has expired");
  }

  const isSameAsOldPassword = await comparePassword(input.password, user.password);

  if (isSameAsOldPassword) {
    throw ApiError.badRequest("New password must be different from your current password");
  }

  const hashedPassword = await hashPassword(input.password);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpiresAt: null },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return { ...toAuthUser(user), sellerProfile: user.sellerProfile };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.emailVerified) {
    return { user: toAuthUser(user) };
  }

  if (!user.emailVerificationCode || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw ApiError.badRequest("Verification code is invalid or has expired");
  }

  if (hashVerificationCode(input.code) !== user.emailVerificationCode) {
    throw ApiError.badRequest("Invalid verification code");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationCode: null, emailVerificationExpiresAt: null },
  });

  return { user: toAuthUser(updated) };
}

export async function resendVerification(input: ResendVerificationInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always respond the same way whether or not the account exists / is already
  // verified, to avoid leaking which emails are registered.
  if (!user || user.emailVerified) {
    return;
  }

  const { code, hashedCode, expiresAt } = createVerificationCode();

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationCode: hashedCode, emailVerificationExpiresAt: expiresAt },
  });

  try {
    await sendVerificationEmail(user.email, user.fullName, code);
  } catch (err) {
    console.error(`[email] failed to send verification email to ${user.email}`, err);
  }
}
