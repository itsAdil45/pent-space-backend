const { service_categories, admins } = require("./seeding_data");
const { prisma } = require("./configs/prisma");
const { okResponse } = require("./constants/responses");

const createDummyData = async (table, dummyData) => {
  try {
    await Promise.all(
      dummyData.map(async (element) => {
        const result = await prisma[table].create({
          data: element,
        });
        console.log(result);
      })
    );
  } catch (error) {
    console.log(error);
  }
};

const truncateTableData = async (table) => {
  try {
    const result = await prisma[table].deleteMany();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};

const seed = async (req, res, next) => {
  const { field } = req.body;
  try {
    //service_categories
    if (field === "service_categories")
      await createDummyData("service_categories", service_categories);

    //admin
    if (field === "admins") await createDummyData("admins", admins);

    const response = okResponse(null, "seeding successfull");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const truncate = async (req, res, next) => {
  const { field } = req.body;

  try {
    //service_categories
    if (field === "service_categories") truncateTableData("service_categories");

    //admin
    if (field === "admins") truncateTableData("admins");
    const response = okResponse(null, "truncate successfull");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = { seed, truncate };
