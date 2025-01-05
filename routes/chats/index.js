/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  getAllMessagesByChatId,
} = require("@/controllers/chats/chats.controller");

const router = express.Router();

router.get("/", verifyToken, getAllMessagesByChatId);

module.exports = router;
