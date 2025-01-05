/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  createTermsAndConditionsSchema,
} = require("@/validation/terms_and_conditions");
const {
  createAboutApp,
  getAboutApp,
} = require("@/controllers/about_app/about_app.controller");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createTermsAndConditionsSchema),
  createAboutApp
);
router.get("/", verifyToken, getAboutApp);
module.exports = router;
