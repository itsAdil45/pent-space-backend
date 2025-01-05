/** @format */

const { prisma } = require("@/configs/prisma");
const { okResponse, forbiddenResponse } = require("@/constants/responses");

const sendHelpAndFeedback = async (req, res, next) => {
  const { user } = req.user;
  const { subject, message, images } = req.body;

  try {
    
    //send notification
    const response = okResponse(result);
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = { sendHelpAndFeedback };
