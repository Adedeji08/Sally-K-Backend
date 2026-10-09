import { SellerCategory, VerificationStatus } from "../../../generated/prisma/enums.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductFiltersQuery,
  UpdateProductInput,
} from "./product.validation.js";

const CATEGORY_MAP: Record<CreateProductInput["category"], SellerCategory> = {
  dresses: SellerCategory.DRESSES,
  tops: SellerCategory.TOPS,
  men: SellerCategory.MEN,
  shoes: SellerCategory.SHOES,
  bags: SellerCategory.BAGS,
  accessories: SellerCategory.ACCESSORIES,
  mixed: SellerCategory.MIXED,
};

async function requireSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });

  if (!sellerProfile) {
    throw ApiError.badRequest("Set up your storefront before adding products");
  }

  return sellerProfile;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const sellerProfile = await requireSellerProfile(userId);

  return prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      name: input.name,
      description: input.description,
      price: input.price,
      category: CATEGORY_MAP[input.category],
      images: input.images,
      sizes: input.sizes,
      colors: input.colors,
      stock: input.stock,
    },
  });
}

export async function listMyProducts(userId: string) {
  const sellerProfile = await requireSellerProfile(userId);

  return prisma.product.findMany({
    where: { sellerId: sellerProfile.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyProduct(userId: string, productId: string) {
  return findOwnedProduct(userId, productId);
}

async function findOwnedProduct(userId: string, productId: string) {
  const sellerProfile = await requireSellerProfile(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || product.sellerId !== sellerProfile.id) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  await findOwnedProduct(userId, productId);

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.category !== undefined && { category: CATEGORY_MAP[input.category] }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.sizes !== undefined && { sizes: input.sizes }),
      ...(input.colors !== undefined && { colors: input.colors }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteProduct(userId: string, productId: string) {
  await findOwnedProduct(userId, productId);
  await prisma.product.delete({ where: { id: productId } });
}

function publicProductWhere(
  filters: ProductFiltersQuery & Partial<Omit<ListProductsQuery, "sort">>
): Prisma.ProductWhereInput {
  const { category, search, minPrice, maxPrice, sizes, sellers } = filters;

  return {
    isActive: true,
    ...(category?.length && { category: { in: category.map((c) => CATEGORY_MAP[c]) } }),
    ...(sizes?.length && { sizes: { hasSome: sizes } }),
    ...(sellers?.length && { sellerId: { in: sellers } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { seller: { brandName: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };
}

const SORT_ORDER: Record<ListProductsQuery["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  price_asc: [{ price: "asc" }, { createdAt: "desc" }],
  price_desc: [{ price: "desc" }, { createdAt: "desc" }],
  // Re-ordered below — there's no sales/views data yet to rank by.
  popular: [{ createdAt: "desc" }],
};

export async function listPublicProducts(query: ListProductsQuery) {
  const products = await prisma.product.findMany({
    where: publicProductWhere(query),
    include: { seller: { select: { brandName: true, verificationStatus: true } } },
    orderBy: SORT_ORDER[query.sort],
  });

  if (query.sort !== "popular") return products;

  // "Popular" until we track orders: verified sellers first, then in-stock
  // items, newest first within each group (Array.sort is stable).
  const rank = (p: (typeof products)[number]) =>
    (p.seller.verificationStatus === VerificationStatus.VERIFIED ? 0 : 2) + (p.stock > 0 ? 0 : 1);
  return products.sort((a, b) => rank(a) - rank(b));
}

const LETTER_SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const WORD_SIZE_ORDER = ["MINI", "ONE SIZE", "SMALL", "MEDIUM", "LARGE", "EXTRA LARGE"];

// XS..XXXL, then numeric sizes ascending, then Mini..Extra Large, then anything else A-Z.
function sizeRank(size: string): [number, number, string] {
  const upper = size.toUpperCase();
  if (LETTER_SIZE_ORDER.includes(upper)) return [0, LETTER_SIZE_ORDER.indexOf(upper), ""];
  if (/^\d+(\.\d+)?$/.test(size)) return [1, Number(size), ""];
  if (WORD_SIZE_ORDER.includes(upper)) return [2, WORD_SIZE_ORDER.indexOf(upper), ""];
  return [3, 0, upper];
}

function compareSizes(a: string, b: string) {
  const [ga, na, sa] = sizeRank(a);
  const [gb, nb, sb] = sizeRank(b);
  return ga - gb || na - nb || sa.localeCompare(sb);
}

// Options for the storefront filter panel, built from what's actually listed
// (optionally within the selected category tab).
export async function getPublicProductFilters(query: ProductFiltersQuery) {
  const where = publicProductWhere({ category: query.category });

  const [products, priceRange] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { sizes: true, sellerId: true, seller: { select: { brandName: true } } },
    }),
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
  ]);

  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort(compareSizes);

  const sellerMap = new Map<string, string>();
  for (const p of products) sellerMap.set(p.sellerId, p.seller.brandName);
  const sellers = Array.from(sellerMap, ([id, brandName]) => ({ id, brandName })).sort((a, b) =>
    a.brandName.localeCompare(b.brandName)
  );

  return {
    sizes,
    sellers,
    price: { min: priceRange._min.price ?? 0, max: priceRange._max.price ?? 0 },
  };
}

export async function getPublicProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { seller: { select: { brandName: true, verificationStatus: true } } },
  });

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}
