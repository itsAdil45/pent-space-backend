/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");

const handleMultipartData = require("@/middleware/populateMultipartData.middleware");
const uploadImage = require("@/middleware/uploadPicture.middleware");
const {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
  getAllServicesSchema,
} = require("@/validation/service");
const {
  createService,
  getAllServices,
  updateService,
  deleteService,
  getAllMyServices,
  getAllServicesAdmin,
} = require("@/controllers/services/services.controller");
const verifyAdminToken = require("@/middleware/veirfyAdminToken");

const { likeServiceSchema } = require("@/validation/service");
const { verify } = require("crypto");



const router = express.Router();

router.post(
  "/",
  verifyToken,
  handleMultipartData,
  uploadImage,
  validateRequest(createServiceSchema),
  createService
);
router.get(
  "/",
  verifyToken,
  validateRequest(getAllServicesSchema),
  getAllServices
);

router.get("/admin", verifyAdminToken, getAllServicesAdmin);

router.get("/me", verifyToken, getAllMyServices);

router.patch(
  "/:service_id",
  verifyToken,
  validateRequest(updateServiceSchema),
  updateService
);

router.delete(
  "/:service_id",
  verifyToken,
  validateRequest(deleteServiceSchema),
  deleteService
);



// router.get(
//   "/search",
//   verifyToken,
//   validateRequest(searchServiceSchema), 
//   searchServices
// );


module.exports = router;
