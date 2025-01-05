/** @format */

const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
} = require("../../constants/responses");

const createPrivacyPolicy = async (req, res) => {
  try {
    const privacy_policy = await prisma.privacy_policy.findMany();
    let result;
    if (privacy_policy.length < 1) {
      result = await prisma.privacy_policy.create({
        data: {
          ...req.body,
        },
      });
    } else {
      result = await prisma.privacy_policy.update({
        where: {
          id: privacy_policy[0].id,
        },
        data: {
          ...req.body,
        },
      });
    }

    const response = okResponse(result, "Successfully Saved");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getPrivacyPolicy = async (req, res) => {
  try {
    const privacy_policy = await prisma.privacy_policy.findMany();
    if (privacy_policy.length < 1) {
      const response = notFound("Not found");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(privacy_policy[0], "Privacy Policy");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createPrivacyPolicy,
  getPrivacyPolicy,
};
