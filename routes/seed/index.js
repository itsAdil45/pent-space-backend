/** @format */

const express = require("express");
const verifyAdminToken = require("@/middleware/veirfyAdminToken");
const { seed, truncate } = require("@/script");

const router = express.Router();

router.post("/", seed);
router.post("/truncate", truncate);
module.exports = router;
