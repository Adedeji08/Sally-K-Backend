-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationCode" TEXT,
ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
