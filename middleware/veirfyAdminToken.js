/** @format */

const { prisma } = require("@/configs/prisma");
const {
  sessionExpired,
  unauthorizedResponse,
} = require("@/constants/responses");
const TokenService = require("@/services/tokenService");

const tokenService = new TokenService(process.env.JWT_SECRET_KEY);

const verifyAdminToken = async (req, res, next) => {
  const access_token = req.headers.authorization;
  if (!access_token) {
    const response = unauthorizedResponse("Unauthorized. Cookie not found.");
    return res.status(response.status.code).json(response);
  }
  const id = tokenService.verifyAccessToken(access_token)?.id;
  const type = tokenService.verifyAccessToken(access_token)?.type;

  if (!id) {
    const response = sessionExpired("Access Token Expired.");
    return res.status(response.status.code).json(response);
  }
  if (type !== "admin") {
    const response = sessionExpired(
      "Unauthorized, User/Business can not access admin data."
    );
    return res.status(response.status.code).json(response);
  }
  const admin = await prisma.admins.findFirst({
    where: { id: Number(id) },
  });

  if (!admin) {
    const response = unauthorizedResponse("Admin not found.");
    return res.status(response.status.code).json(response);
  }
  req.admin = { admin_id: id, admin };
  next();
};

module.exports = verifyAdminToken;
