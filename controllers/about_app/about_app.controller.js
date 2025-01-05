/** @format */

const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
} = require("../../constants/responses");

const createAboutApp = async (req, res) => {
  try {
    const about_app = await prisma.about_app.findMany();
    let result;
    if (about_app.length < 1) {
      result = await prisma.about_app.create({
        data: {
          ...req.body,
        },
      });
    } else {
      result = await prisma.about_app.update({
        where: {
          id: about_app[0].id,
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

const getAboutApp = async (req, res) => {
  try {
    const about_app = await prisma.about_app.findMany();
    if (about_app.length < 1) {
      const response = notFound("Not found");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(about_app[0], "About App");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createAboutApp,
  getAboutApp,
};
