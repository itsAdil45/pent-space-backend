/** @format */

const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  badRequestResponse,
} = require("../../constants/responses");

const createCrowdFunding = async (req, res) => {
  const { user } = req.user;
  const { crowd_funding_images, crowd_funding_docs } = req;
  const medias = [];
  if (crowd_funding_images?.length > 0)
    crowd_funding_images.map((crowd_funding_media) => {
      medias.push({ crowd_funding_media, type: "image" });
    });
  if (crowd_funding_docs?.length > 0)
    crowd_funding_docs.map((crowd_funding_media) => {
      medias.push({ crowd_funding_media, type: "docs" });
    });

  try {
    const result = await prisma.crowd_fundings.create({
      data: {
        ...req.body,
        user_id: user.id,
        crowd_funding_media: {
          createMany: {
            data: medias.map((media) => ({
              crowd_funding_media: media.crowd_funding_media,
              media_type: media.type,
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

const getAllCrowdFundings = async (req, res) => {
  try {
    const get_all_crowd_fundings =
      await prisma.$queryRaw`SELECT cf.id AS crowd_funding_id, cf.*, (SELECT SUM(donated_amount)  FROM donations WHERE is_paid=${true}  AND crowd_funding_id = cf.id) as raised_so_far,u.*,CASE WHEN CAST(TIMESTAMPDIFF(HOUR, NOW(), cf.end_datetime) AS FLOAT) > 0 THEN CAST(TIMESTAMPDIFF(HOUR, NOW(), cf.end_datetime) AS FLOAT) ELSE 0 END AS hours_left ,(SELECT crowd_funding_media FROM crowd_funding_media WHERE crowd_funding_id = 
        cf.id
       AND media_type = "image" LIMIT 1) as crowd_funding_image, CASE WHEN u.user_type = "BUSINESS" THEN business_name ELSE user_name END as created_by FROM crowd_fundings as cf JOIN users AS u ON cf.user_id = u.id WHERE cf.is_active = ${true} ORDER BY cf.createdAt DESC`;
    console.log(get_all_crowd_fundings);
    const response = okResponse(get_all_crowd_fundings, "All Feeds");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getMyCrowdFundings = async (req, res) => {
  const { user } = req.user;
  try {
    const get_all_crowd_fundings =
      await prisma.$queryRaw`SELECT cf.*, (SELECT SUM(donated_amount)  FROM donations WHERE is_paid=${true}) as raised_so_far, CAST(TIMESTAMPDIFF(HOUR, NOW(), cf.end_datetime) AS FLOAT) AS hours_left,(SELECT crowd_funding_media FROM crowd_funding_media WHERE crowd_funding_id = 
        cf.id
       AND media_type = "image" LIMIT 1) as crowd_funding_image, CASE WHEN u.user_type = "BUSINESS" THEN business_name ELSE user_name END as created_by FROM crowd_fundings as cf JOIN users AS u ON cf.user_id = u.id WHERE cf.is_active = ${true} AND cf.user_id = ${user.id
        } ORDER BY cf.createdAt DESC`;
    console.log(get_all_crowd_fundings);
    const response = okResponse(get_all_crowd_fundings, "All Feeds");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const updateCrowdFunding = async (req, res) => {
  const { crowd_funding_id } = req.params;
  const { user } = req.user;
  const { is_active } = req.body;

  try {
    const result = await prisma.crowd_fundings.update({
      where: {
        id: Number(crowd_funding_id),
        user_id: user.id,
      },
      data: {
        is_active,
      },
    });
    if (!result) {
      const response = badRequestResponse(
        "You don't have access to this record."
      );
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(
      result,
      `CrowdFunding ${is_active ? "Actived" : "Disabled"}`
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    if (error.meta.cause == "Record to delete does not exist.") {
      const response = badRequestResponse(
        "Record to delete does not exist or you don't have access to deleted."
      );
      return res.status(response.status.code).json(response);
    }
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createCrowdFunding,
  getAllCrowdFundings,
  getMyCrowdFundings,
  updateCrowdFunding,
};
