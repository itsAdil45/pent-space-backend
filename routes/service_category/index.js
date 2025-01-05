/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");

const handleMultipartData = require("@/middleware/populateMultipartData.middleware");
const uploadImage = require("@/middleware/uploadPicture.middleware");
const {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  deleteServiceCategorySchema,
} = require("@/validation/service_category");
const {
  createServiceCategory,
  getAllServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} = require("@/controllers/service_category/service_category.controller");
const verifyAdminToken = require("@/middleware/veirfyAdminToken");

const router = express.Router();

router.post(
  "/",
  verifyAdminToken,
  handleMultipartData,
  uploadImage,
  validateRequest(createServiceCategorySchema),
  createServiceCategory
);
router.get("/", getAllServiceCategory);

router.patch(
  "/:service_category_id",
  verifyAdminToken,
  validateRequest(updateServiceCategorySchema),
  updateServiceCategory
);

router.delete(
  "/:service_category_id",
  verifyAdminToken,
  validateRequest(deleteServiceCategorySchema),
  deleteServiceCategory
);
module.exports = router;
