/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  createTermsAndConditions,
  getTermsAndConditions,
} = require("@/controllers/terms_and_conditions/terms_and_conditions.controller");
const {
  createTermsAndConditionsSchema,
} = require("@/validation/terms_and_conditions");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createTermsAndConditionsSchema),
  createTermsAndConditions
);
router.get("/", verifyToken, getTermsAndConditions);
module.exports = router;
