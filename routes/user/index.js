/** @format */

const express = require("express");

const validateRequest = require("../../middleware/validateRequestJoi.middleware");

const verifyToken = require("@/middleware/verifyToken");
const {
  registerSchema,
  loginSchema,
  getByIdSchema,
  verifyOtpSchema,
  resendOtpSchema,
  logoutSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  getAllUsersSchema,
  socialLoginSchema,
  createUserSchema,
  editUserSchema,
  blockUserSchema,
} = require("@/validation/user");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshUser,
  verifyOtp,
  resendOtp,
  forgetPassword,
  changePassword,
  resetPassword,
  googleLoginUser,
  facebookLoginUser,
  appleLoginUser,
  getMe,
  editMe,
  createProfile,
  deleteUser,
  getAllUsers,
  getAllBusiness,
  getUserById,
  blockUser,
} = require("@/controllers/user/user.controller");
const handleMultipartData = require("@/middleware/populateMultipartData.middleware");
const uploadImage = require("@/middleware/uploadPicture.middleware");
const handleMultipartDataUpdate = require("@/middleware/populateMultipartDataUpdate.middleware");
const verifyAdminToken = require("@/middleware/veirfyAdminToken");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/verify_otp", validateRequest(verifyOtpSchema), verifyOtp);
router.post("/resend_otp", validateRequest(resendOtpSchema), resendOtp);
router.post("/login", validateRequest(loginSchema), loginUser);
router.post(
  "/google_login",
  validateRequest(socialLoginSchema),
  googleLoginUser
);
router.post(
  "/facebook_login",
  validateRequest(socialLoginSchema),
  facebookLoginUser
);
router.post("/apple_login", validateRequest(socialLoginSchema), appleLoginUser);
router.post("/logout", validateRequest(logoutSchema), verifyToken, logoutUser);
router.post("/refresh_token", validateRequest(logoutSchema), refreshUser);
router.post(
  "/change_password",
  verifyToken,
  validateRequest(changePasswordSchema),
  changePassword
);
router.post(
  "/forget_password",
  validateRequest(forgetPasswordSchema),
  forgetPassword
);
router.post(
  "/reset_password",
  verifyToken,
  validateRequest(resetPasswordSchema),
  resetPassword
);

router.get("/me", verifyToken, getMe);
router.get("/", verifyAdminToken, getAllUsers);
router.get("/:id", verifyAdminToken, getUserById);

router.get("/business/all", verifyAdminToken, getAllBusiness);

router.delete("/delete/me", verifyToken, deleteUser);
router.post("/block", verifyToken, validateRequest(blockUserSchema), blockUser);

router.patch(
  "/me",
  verifyToken,
  handleMultipartDataUpdate,
  uploadImage,
  validateRequest(editUserSchema),
  editMe
);
router.post(
  "/create_profile",
  verifyToken,
  handleMultipartData,
  uploadImage,
  validateRequest(createUserSchema),
  createProfile
);
module.exports = router;
