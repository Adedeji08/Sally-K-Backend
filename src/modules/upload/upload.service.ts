import { cloudinary } from "../../config/cloudinary.js";

const FOLDER_MAP = {
  "brand-logo": "sallyk/brand-logos",
  "kyc-document": "sallyk/kyc-documents",
  "product-image": "sallyk/product-images",
} as const;

export type UploadPurpose = keyof typeof FOLDER_MAP;

export function uploadBuffer(buffer: Buffer, purpose: UploadPurpose): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER_MAP[purpose], resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}
