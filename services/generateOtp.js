/** @format */

const { prisma } = require("@/configs/prisma");

const generateRandomAlphanumericCode = () => {
  const otpLength = 4;
  let otp = "";
  for (let i = 0; i < otpLength; i++) {
    otp += Math.floor(Math.random() * 10); // Generates a random digit (0-9)
  }
  return otp;
};

const resetOtp = async (table, id) => {
  setTimeout(async () => {
    await prisma[table].update({
      data: {
        otp: "",
      },
      where: {
        id,
      },
    });
  }, 60000);
};

module.exports = { generateRandomAlphanumericCode, resetOtp };
