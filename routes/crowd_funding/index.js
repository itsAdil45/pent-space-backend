/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");

const handleMultipartData = require("@/middleware/populateMultipartData.middleware");
const uploadImage = require("@/middleware/uploadPicture.middleware");
const {
  createCrowdFundingSchema,
  updateCrowdFundingSchema,
} = require("@/validation/crowd_funding");
const {
  createCrowdFunding,
  getAllCrowdFundings,
  getMyCrowdFundings,
  updateCrowdFunding,
} = require("@/controllers/crowd_funding/crowd_funding.controller");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  handleMultipartData,
  uploadImage,
  validateRequest(createCrowdFundingSchema),
  createCrowdFunding
);
router.get("/", getAllCrowdFundings);

router.patch(
  "/:crowd_funding_id",
  verifyToken,
  validateRequest(updateCrowdFundingSchema),
  updateCrowdFunding
);

router.get("/me", verifyToken, getMyCrowdFundings);

module.exports = router;
