/** @format */

const express = require("express");

const validateRequest = require("../../middleware/validateRequestJoi.middleware");

const verifyToken = require("@/middleware/verifyToken");

const verifyAdminToken = require("@/middleware/veirfyAdminToken");

const {
  changePasswordSchema,
  resendOtpSchema,
  loginSchema,
  logoutSchema,
  editAdminSchema,
  resetPasswordSchema,
  getWalletSchema,
  registerSchema
} = require("@/validation/admin");
const {
  registerUser,
  changePassword,
  resendOtp,
  loginAdmin,
  logoutAdmin,
  refreshAdmin,
  getMe,
  editAdmin,
  resetPassword,
  adminWallet,
  adminWalletBalance,
} = require("@/controllers/admin/admin.controller");

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  verifyToken,
  registerUser
);
router.post(
  "/change_password",
  verifyAdminToken,
  validateRequest(changePasswordSchema),
  changePassword
);
router.post(
  "/reset_password",
  validateRequest(resetPasswordSchema),
  resetPassword
);
router.post("/resend_otp", validateRequest(resendOtpSchema), resendOtp);
router.post("/login", validateRequest(loginSchema), loginAdmin);
router.post(
  "/logout",
  validateRequest(logoutSchema),
  verifyAdminToken,
  logoutAdmin
);
router.post("/refresh_token", validateRequest(logoutSchema), refreshAdmin);
router.get("/me", verifyAdminToken, getMe);
router.patch(
  "/me",
  verifyAdminToken,
  validateRequest(editAdminSchema),
  editAdmin
);
router.get(
  "/wallet",
  verifyAdminToken,
  validateRequest(getWalletSchema),
  adminWallet
);

router.get("/wallet_balance", verifyAdminToken, adminWalletBalance);

module.exports = router;
