/** @format */

const { prisma } = require("@/configs/prisma");
const {
  sessionExpired,
  unauthorizedResponse,
} = require("@/constants/responses");
const TokenService = require("@/services/tokenService");

const tokenService = new TokenService(process.env.JWT_SECRET_KEY);

const verifyToken = async (req, res, next) => {
  const access_token = req.headers.authorization;
  if (!access_token) {
    const response = unauthorizedResponse("Unauthorized. Cookie not found.");
    return res.status(response.status.code).json(response);
  }
  const id = tokenService.verifyAccessToken(access_token)?.id;

  if (!id) {
    const response = sessionExpired("Access Token Expired.");
    return res.status(response.status.code).json(response);
  }

  const user = await prisma.users.findFirst({
    where: { id: Number(id) },
  });

  if (!user) {
    const response = unauthorizedResponse("User not found.");
    return res.status(response.status.code).json(response);
  }
  req.user = { user };
  next();
};

module.exports = verifyToken;
