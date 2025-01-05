/** @format */

const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../configs/s3");
const { okResponse } = require("../constants/responses");
const { logger } = require("../configs/logger");

const uploadImage = async (req, res, next) => {
  let files;
  if (req?.files) {
    files = Object.values(req.files);
  }

  const date = Date.now();

  if (files) {
    await Promise.all(
      files.map(async (file_s) => {
        const images = file_s.map(async (file) => {
          const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${file.fieldname}/${file.originalname.split(".")[0]}-${date}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          });

          try {
            await s3.send(command);
            return {
              public_id: `/${file.fieldname}/${
                file.originalname.split(".")[0]
              }-${date}`,
            };
          } catch (error) {
            logger.error("Error uploading image to cloudinary.", error);
            return next(error);
          }
        });

        const s3Response = await Promise.all(images);
        let fieldname = null;
        const urls = s3Response.map((response) => {
          fieldname =
            fieldname == null ? response.public_id.split("/")[1] : fieldname;
          return process.env.S3_ACCESS_URL + response.public_id;
        });
        req[`${fieldname}`] = urls;
      })
    );
    // const response = okResponse(urls);
    // return res.status(response.status.code).json(response);
  }
  next();
};

module.exports = uploadImage;
