import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import {
  clientSchema,
  createMeasurementSchema,
  updateClientSchema,
  updateMeasurementSchema,
} from "./measurement.validation.js";
import * as h from "./measurement.controller.js";

const router = Router();

router.use(authenticate, authorize(Role.SELLER));

// Static paths before /:id.
router.get("/templates", h.templatesHandler);
router.get("/stats", h.statsHandler);

router.get("/clients", h.listClientsHandler);
router.post("/clients", validate(clientSchema), h.createClientHandler);
router.get("/clients/:id", h.getClientHandler);
router.patch("/clients/:id", validate(updateClientSchema), h.updateClientHandler);
router.delete("/clients/:id", h.deleteClientHandler);

router.get("/", h.listMeasurementsHandler);
router.post("/", validate(createMeasurementSchema), h.createMeasurementHandler);
router.get("/:id", h.getMeasurementHandler);
router.patch("/:id", validate(updateMeasurementSchema), h.updateMeasurementHandler);
router.delete("/:id", h.deleteMeasurementHandler);

export default router;
