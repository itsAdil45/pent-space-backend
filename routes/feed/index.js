/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");

const {
  createFeedsSchema,
  deleteFeedsSchema,
  likeFeedSchema,
  commentFeedSchema,
  getFeedByIdSchema,
  deleteCommentSchema,
} = require("@/validation/feeds");
const {
  createFeed,
  getAllFeeds,
  deleteFeed,
  getMyFeeds,
  likeFeed,
  commentFeed,
  getFeedById,
  deleteComment,
  getAllFeedsAdmin,
} = require("@/controllers/feed/feed.controller");
const handleMultipartData = require("@/middleware/populateMultipartData.middleware");
const uploadImage = require("@/middleware/uploadPicture.middleware");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  handleMultipartData,
  uploadImage,
  validateRequest(createFeedsSchema),
  createFeed
);
router.get("/", verifyToken, getAllFeeds);

router.get("/admin", getAllFeedsAdmin);

router.get("/me", verifyToken, getMyFeeds);

router.get(
  "/:feed_id",
  verifyToken,
  validateRequest(getFeedByIdSchema),
  getFeedById
);

router.post("/like", verifyToken, validateRequest(likeFeedSchema), likeFeed);

router.post(
  "/comment",
  verifyToken,
  validateRequest(commentFeedSchema),
  commentFeed
);

router.delete(
  "/comment/:comment_id",
  verifyToken,
  validateRequest(deleteCommentSchema),
  deleteComment
);

router.delete(
  "/:feed_id",
  verifyToken,
  validateRequest(deleteFeedsSchema),
  deleteFeed
);
module.exports = router;
