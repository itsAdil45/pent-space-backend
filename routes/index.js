/** @format */

const { Router } = require("express");
const router = Router();

const userRouter = require("./user");

const feedRouter = require("./feed");

const termsAndConditionsRouter = require("./terms_and_conditions");
const privacyPolicy = require("./privacy_policy");
const aboutApp = require("./about_app");
const questionnaires = require("./questionnaires");
const serviceRouter = require("./service");
const serviceCategoryRouter = require("./service_category");
const crowdFundingRouter = require("./crowd_funding");
const donationRouter = require("./donations");
const chatRouter = require("./chats");
const notificationRouter = require("./notifications");
const adminRouter = require("./admin");
const seedRouter = require("./seed");

router.use("/user", userRouter);
router.use("/chat", chatRouter);
router.use("/feed", feedRouter);
router.use("/notifications", notificationRouter);
router.use("/terms_and_conditions", termsAndConditionsRouter);
router.use("/privacy_policy", privacyPolicy);
router.use("/about_app", aboutApp);
router.use("/questionnaires", questionnaires);
router.use("/service", serviceRouter);
router.use("/service_category", serviceCategoryRouter);
router.use("/crowd_funding", crowdFundingRouter);
router.use("/donation", donationRouter);
router.use("/admin", adminRouter);
router.use("/seed", seedRouter);

module.exports = router;
