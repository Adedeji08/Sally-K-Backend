/*
  Warnings:

  - You are about to drop the column `businessName` on the `seller_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `seller_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seller_profiles" DROP COLUMN "businessName",
DROP COLUMN "category",
ADD COLUMN     "businessDocumentUrl" TEXT,
ADD COLUMN     "businessRegistrationNumber" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "categories" "SellerCategory"[],
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT;
