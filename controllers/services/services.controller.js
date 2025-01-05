/** @format */

const { create } = require("domain");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
  badRequestResponse,
} = require("../../constants/responses");

const createService = async (req, res) => {
  const { user } = req.user;
  const { service_image } = req;

  const { service_category_id, longitude, latitude } = req.body;
  try {
    if (user.user_type !== "BUSINESS") {
      const response = badRequestResponse("Only business can create services");
      return res.status(response.status.code).json(response);
    }
    const result = await prisma.services.create({
      data: {
        ...req.body,
        business_id: user.id,
        service_category_id: Number(service_category_id),
        service_images: {
          createMany: {
            data: service_image.map((url) => ({
              image: url,
            })),
          },
        },
      },
    });

    const response = okResponse(result, "Successfully Created");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllServices = async (req, res) => {
  let {
    longitude,
    latitude,
    radius,
    first_key_word,
    second_key_word,
    third_key_word,
  } = req.query;
  radius = radius || 10;
  try {
    let get_all_services;

    if (first_key_word) {
      get_all_services =
        await prisma.$queryRaw`SELECT s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
        bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
        CAST((6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
            cos(radians(${latitude})) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(s.latitude))
        )) <= ${radius} AND s.is_active= ${true} AND bu.first_key_word LIKE ${
          "%" + first_key_word + "%"
        } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else if (second_key_word) {
      get_all_services =
        await prisma.$queryRaw`SELECT s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
  )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
          cos(radians(${latitude})) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND bu.second_key_word LIKE ${
          "%" + second_key_word + "%"
        } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else if (third_key_word) {
      get_all_services =
        await prisma.$queryRaw`SELECT s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
      bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
      CAST((6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
  )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
          cos(radians(${latitude})) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(s.latitude))
      )) <= ${radius} AND s.is_active= ${true} AND bu.third_key_word LIKE ${
          "%" + third_key_word + "%"
        } AND sc.is_active = ${true} ORDER BY distance DESC`;
    } else {
      get_all_services =
        await prisma.$queryRaw`SELECT s.longitude,s.latitude,s.service_name,s.description,s.country,bu.business_name,bu.email,bu.address,bu.id as business_id,
        bu.profile_picture as business_image,bu.phone, (SELECT si.image FROM service_images as si WHERE si.service_id = s.id LIMIT 1) as service_image, 
        CAST((6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
    )) AS FLOAT) AS distance FROM services as s JOIN service_categories as sc ON sc.id = s.service_category_id JOIN users as bu ON bu.id = s.business_id WHERE (6371 * acos(
            cos(radians(${latitude})) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(s.latitude))
        )) <= ${radius} AND s.is_active= ${true} AND sc.is_active = ${true} ORDER BY distance DESC`;
    }

    // const get_all_services = await prisma.services.findMany({
    //   where: {
    //     is_active: true,
    //     service_categories: {
    //       is_active: true,
    //     },
    //   },
    // });
    const response = okResponse(get_all_services, "All Services");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllServicesAdmin = async (req, res) => {
  try {
    const get_all_service = await prisma.services.findMany({
      include: {
        service_images: true,
      },
    });
    const response = okResponse(get_all_service, "All Service");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllMyServices = async (req, res) => {
  const { user } = req.user;

  try {
    const get_all_service = await prisma.services.findMany({
      where: {
        business_id: user.id,
      },
    });
    const response = okResponse(get_all_service, "My All Service");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const updateService = async (req, res) => {
  const { service_id } = req.params;
  const { service_category_id } = req.body;
  if (service_category_id) {
    const id = service_category_id;
    delete req.body.service_category_id;
    req.body.service_category_id = Number(id);
  }
  try {
    const result = await prisma.services.update({
      where: {
        id: Number(service_id),
      },
      data: {
        ...req.body,
      },
    });
    const response = okResponse(result, "Service Updated");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteService = async (req, res) => {
  const { service_id } = req.params;
  try {
    const result = await prisma.services.delete({
      where: {
        id: Number(service_id),
      },
    });
    const response = okResponse(result, "Service Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createService,
  getAllServices,
  getAllMyServices,
  updateService,
  deleteService,
  getAllServicesAdmin,
};
