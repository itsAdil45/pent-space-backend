/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  createTermsAndConditionsSchema,
} = require("@/validation/terms_and_conditions");
const {
  createPrivacyPolicy,
  getPrivacyPolicy,
} = require("@/controllers/privacy_policy/privacy_policy.controller");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createTermsAndConditionsSchema),
  createPrivacyPolicy
);
router.get("/", verifyToken, getPrivacyPolicy);
module.exports = router;
