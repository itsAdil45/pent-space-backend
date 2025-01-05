/** @format */

const { create } = require("domain");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
  badRequestResponse,
} = require("../../constants/responses");

const createServiceCategory = async (req, res) => {
  const { service_category_image } = req;
  try {
    const result = await prisma.service_categories.create({
      data: {
        ...req.body,
        icon_image: service_category_image[0],
      },
    });

    const response = okResponse(result, "Successfully Created");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllServiceCategory = async (req, res) => {
  try {
    const get_all_service_categories =
      await prisma.service_categories.findMany();
    const response = okResponse(
      get_all_service_categories,
      "All Service Categories"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const updateServiceCategory = async (req, res) => {
  const { service_category_id } = req.params;
  try {
    const result = await prisma.service_categories.update({
      where: {
        id: Number(service_category_id),
      },
      data: {
        ...req.body,
      },
    });
    const response = okResponse(result, "Service Category Updated");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteServiceCategory = async (req, res) => {
  const { service_category_id } = req.params;
  try {
    const result = await prisma.service_categories.delete({
      where: {
        id: Number(service_category_id),
      },
    });
    const response = okResponse(result, "Service Category Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createServiceCategory,
  getAllServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
};
