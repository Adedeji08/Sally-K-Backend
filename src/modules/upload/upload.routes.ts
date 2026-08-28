import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import { uploadFileHandler } from "./upload.controller.js";

const router = Router();

// POST /api/v1/uploads/:purpose  (purpose: brand-logo | kyc-document | product-image)
// multipart/form-data, file field name: "file"
router.post("/:purpose", authenticate, upload.single("file"), uploadFileHandler);

export default router;
