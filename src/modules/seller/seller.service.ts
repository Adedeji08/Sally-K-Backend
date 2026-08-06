import { IdType, SellerCategory } from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { StoreSetupInput, VerificationInput } from "./seller.validation.js";

const CATEGORY_MAP: Record<StoreSetupInput["category"], SellerCategory> = {
  dresses: SellerCategory.DRESSES,
  tops: SellerCategory.TOPS,
  men: SellerCategory.MEN,
  shoes: SellerCategory.SHOES,
  bags: SellerCategory.BAGS,
  accessories: SellerCategory.ACCESSORIES,
  mixed: SellerCategory.MIXED,
};

const ID_TYPE_MAP: Record<VerificationInput["idType"], IdType> = {
  nin: IdType.NIN,
  bvn: IdType.BVN,
  passport: IdType.PASSPORT,
};

export async function setupStore(userId: string, input: StoreSetupInput) {
  const profile = await prisma.sellerProfile.upsert({
    where: { userId },
    create: {
      userId,
      brandName: input.brandName,
      category: CATEGORY_MAP[input.category],
      bio: input.bio,
    },
    update: {
      brandName: input.brandName,
      category: CATEGORY_MAP[input.category],
      bio: input.bio,
    },
  });

  return profile;
}

export async function submitVerification(userId: string, input: VerificationInput) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });

  if (!profile) {
    throw ApiError.badRequest("Set up your storefront before submitting verification");
  }

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data: {
      businessName: input.businessName,
      idType: ID_TYPE_MAP[input.idType],
      idNumber: input.idNumber,
      verificationStatus: "PENDING",
    },
  });

  return updated;
}

export async function getOnboardingStatus(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  return profile;
}
