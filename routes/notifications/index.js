/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  readNotifications,
  getAllNotifications,
  sendNotificationToAll,
} = require("@/controllers/notifications/notifications.controller");
const verifyAdminToken = require("@/middleware/veirfyAdminToken");

const router = express.Router();

router.patch("/:id", verifyToken, readNotifications);
router.get("/", verifyToken, getAllNotifications);
router.post("/all", verifyAdminToken, sendNotificationToAll);


module.exports = router;
