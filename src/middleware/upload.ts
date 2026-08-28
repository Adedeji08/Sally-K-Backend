import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "application/pdf"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the frontend's stated limit
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only PNG, JPG, GIF, WEBP, or PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});
