import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadBuffer, type UploadPurpose } from "./upload.service.js";

const VALID_PURPOSES: UploadPurpose[] = ["brand-logo", "kyc-document", "product-image"];

export const uploadFileHandler = asyncHandler(async (req: Request, res: Response) => {
  const purpose = req.params.purpose as string;

  if (!VALID_PURPOSES.includes(purpose as UploadPurpose)) {
    throw ApiError.badRequest(`Purpose must be one of: ${VALID_PURPOSES.join(", ")}`);
  }

  if (!req.file) {
    throw ApiError.badRequest("No file uploaded — attach it under the 'file' field");
  }

  const result = await uploadBuffer(req.file.buffer, purpose as UploadPurpose);
  sendSuccess(res, { statusCode: 201, message: "File uploaded successfully", data: result });
});
