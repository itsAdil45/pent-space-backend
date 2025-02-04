/** @format */

const multer = require("multer");
const { badRequestResponse } = require("@/constants/responses");

const storage = multer.memoryStorage();
const limits = { fileSize: 10 * 1024 * 1024 }; // Allow up to 10 MB per file
const fields = [
  { name: "user_profile_picture", maxCount: 1 },
  { name: "feed_picture", maxCount: 5 },
  { name: "service_image", maxCount: 5 },
  { name: "crowd_funding_images", maxCount: 5 },
  { name: "crowd_funding_docs", maxCount: 5 },
  { name: "service_category_image", maxCount: 1 },
];

const handleMulterError = (err) => {
  if (err && err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return "Unable to upload image. Make sure that only allowed key name is used and only one file is uploaded at a time.";
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return "Unable to upload image. Max file size limit is 10MB.";
    }
  } else if (err) {
    return err.message;
  }
};

function handleMultipartData(req, res, next) {
  const upload = multer({
    storage,
    limits,
  }).fields(fields);

  upload(req, res, (err) => {
    if (!Object.keys(req.files).length) {
      const response = badRequestResponse("No file to upload.");
      return res.status(response.status.code).json(response);
    }

    const error = handleMulterError(err);

    if (error) {
      const response = badRequestResponse(error);
      return res.status(response.status.code).json(response);
    }

    next();
  });
}
module.exports = handleMultipartData;
