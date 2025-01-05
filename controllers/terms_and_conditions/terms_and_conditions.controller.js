/** @format */

const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
} = require("../../constants/responses");

const createTermsAndConditions = async (req, res) => {
  try {
    const terms_and_conditions = await prisma.terms_and_conditions.findMany();
    let result;
    if (terms_and_conditions.length < 1) {
      result = await prisma.terms_and_conditions.create({
        data: {
          ...req.body,
        },
      });
    } else {
      result = await prisma.terms_and_conditions.update({
        where: {
          id: terms_and_conditions[0].id,
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

const getTermsAndConditions = async (req, res) => {
  try {
    const terms_and_conditions = await prisma.terms_and_conditions.findMany();
    if (terms_and_conditions.length < 1) {
      const response = notFound("Not found");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(
      terms_and_conditions[0],
      "Terms and conditions"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createTermsAndConditions,
  getTermsAndConditions,
};
