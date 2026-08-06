-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SellerCategory" AS ENUM ('DRESSES', 'TOPS', 'MEN', 'SHOES', 'BAGS', 'ACCESSORIES', 'MIXED');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('NIN', 'BVN', 'PASSPORT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "category" "SellerCategory" NOT NULL,
    "bio" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "businessName" TEXT,
    "idType" "IdType",
    "idNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_userId_key" ON "seller_profiles"("userId");

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
