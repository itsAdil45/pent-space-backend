/** @format */

const { prisma } = require("../../configs/prisma");
const bcrypt = require("bcryptjs");
const {
  serverErrorResponse,
  okResponse,
  badRequestResponse,
  forbiddenResponse,
  notFound,
} = require("../../constants/responses");
const TokenService = require("@/services/tokenService");
const contactEmail = require("@/email/contactEmail");
const sendOtpEmail = require("@/email/sendOtp");

const {
  generateRandomAlphanumericCode,
  resetOtp,
} = require("@/services/generateOtp");

const tokenService = new TokenService(process.env.JWT_SECRET_KEY);

const registerUser = async (req, res) => {
  const { user } = req.user;
  try {
    if (!user.is_email_verified && !user.is_phone_verified) {
      const response = forbiddenResponse("User email/phone is not verified.");
      return res.status(response.status.code).json(response);
    }
    const new_user = await prisma.users.findFirst({
      where: {
        id: user.id,
      },
    });
    if (new_user.is_completed) {
      const response = forbiddenResponse("User already registered.");
      return res.status(response.status.code).json(response);
    }

    await prisma.users.update({
      data: {
        ...req.body,
        is_completed: true,
      },
      where: {
        id: user.id,
      },
    });

    const access_token = tokenService.generateAccessToken(user.id, "user");
    const refresh_token = tokenService.generateRefreshToken(user.id, "user");

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
      },
    });

    const response = okResponse(
      { access_token, refresh_token },
      "User created successfully."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const resetPassword = async (req, res) => {
  const { otp, email, newPassword } = req.body;
  const where = { email };
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const data = { otp: "", password: hashedPassword };
  try {
    const admin = await prisma.admins.findFirst({
      where,
    });
    if (!admin) {
      const response = badRequestResponse("Admin not found.");
      return res.status(response.status.code).json(response);
    }
    if (admin.otp !== otp) {
      const response = badRequestResponse("Invalid or Expired OTP.");
      return res.status(response.status.code).json(response);
    } else {
      await prisma.admins.update({
        data,
        where: {
          id: admin.id,
        },
      });
    }

    const response = okResponse(null, "Admin password changed successfully.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const changePassword = async (req, res) => {
  const { admin } = req.admin;
  const { currentPassword, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const data = { otp: "", password: hashedPassword };
  try {
    const newAdmin = await prisma.admins.findFirst({
      where: {
        id: admin.id,
      },
    });
    if (!newAdmin) {
      const response = badRequestResponse("Admin not found.");
      return res.status(response.status.code).json(response);
    }
    const match = await bcrypt.compare(currentPassword, admin.password);

    if (!match) {
      const response = badRequestResponse("Invalid credentials.");
      return res.status(response.status.code).json(response);
    }

    await prisma.admins.update({
      data,
      where: {
        id: admin.id,
      },
    });

    const response = okResponse(null, "Admin password changed successfully.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  const where = { email };

  try {
    const admin = await prisma.admins.findFirst({
      where,
    });
    if (!admin) {
      const response = notFound("Admin not found.");
      return res.status(response.status.code).json(response);
    }
    const otp = generateRandomAlphanumericCode(6);
    await prisma.admins.update({
      data: {
        otp,
      },
      where: {
        id: admin.id,
      },
    });
    await resetOtp("admins", admin.id); //expire OTP after 60seconds
    // await contactEmail({
    //   email,
    //   html: ` <p>Hi, ${user?.user_details?.firstname}</p>
    //   <p>This is your OTP <span style="font-weight:bold;color:blue; font-size:large;">${otp}</span></p>`,
    //   subject: "One Time Password (OTP)",
    // });

    const response = okResponse(
      otp,
      "OTP sent successfully. Please verify OTP"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await prisma.admins.findFirst({
      where: { email },
    });

    if (!admin) {
      const response = badRequestResponse("Record not found.");
      return res.status(response.status.code).json(response);
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      const response = badRequestResponse("Invalid credentials.");
      return res.status(response.status.code).json(response);
    }

    const access_token = tokenService.generateAccessToken(admin.id, "admin");
    const refresh_token = tokenService.generateRefreshToken(admin.id, "admin");

    await prisma.admin_sessions.create({
      data: {
        admin_id: admin.id,
        refresh_token,
      },
    });

    const response = okResponse(
      { access_token, refresh_token },
      "Admin login successful."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    console.log(error.message);
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const logoutAdmin = async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const admin_session = await prisma.admin_sessions.deleteMany({
      where: {
        refresh_token,
      },
    });
    if (!admin_session.count) {
      const response = badRequestResponse("Already Logged Out.");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse({ admin_session }, "Admin logout successful.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const refreshAdmin = async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const access_token = tokenService.refreshAccessToken(refresh_token);
    if (!access_token) {
      const response = forbiddenResponse("Invalid Refresh Token.");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(
      { access_token },
      "New Access Token generated successfully."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getMe = async (req, res) => {
  const { admin } = req.admin;
  try {
    const newAdmin = await prisma.admins.findFirst({
      where: {
        id: Number(admin.id),
      },
      select: {
        email: true,
        id: true,
        is_notification: true,
        profile_picture: true,
        createdAt: true,
        admin_sessions: true,
      },
    });

    if (!newAdmin) {
      const response = notFound("Admin not Verified.");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(newAdmin, "Admin Data");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const editAdmin = async (req, res) => {
  const { admin } = req.admin;
  try {
    const newAdmin = await prisma.admins.update({
      where: {
        id: Number(admin.id),
      },
      data: { ...req.body },
    });
    const response = okResponse(newAdmin, "Admin updated successful.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const adminWallet = async (req, res) => {
  const { admin } = req.admin;
  const { order_status } = req.query;
  let transactions = [];
  try {
    if (order_status == "COMPLETED") {
      transactions = await prisma.$queryRaw`
  SELECT 
    *, 
    CASE 
        WHEN order_status = 'COMPLETED' OR order_status = 'PICKED_UP' THEN 'CREDIT'
        ELSE 'DEBIT'
    END AS transaction_type,
    CAST(net_amount * ${Number(process.env.PLATFORM_RATE) / 100
        } AS FLOAT) AS application_fees 
FROM orders 
WHERE is_paid = true AND order_status = "COMPLETED" OR order_status = "PICKED_UP"
`;
    } else {
      transactions = await prisma.$queryRaw`
    SELECT 
      *, 
      CASE 
          WHEN order_status = 'COMPLETED' OR order_status = 'PICKED_UP' THEN 'CREDIT'
          ELSE 'DEBIT'
      END AS transaction_type,
      CAST(net_amount * ${Number(process.env.PLATFORM_RATE) / 100
        } AS FLOAT) AS application_fees 
  FROM orders 
  WHERE is_paid = true AND order_status = "CANCELLED"
  `;
    }

    const response = okResponse(transactions, "All Transactions.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const adminWalletBalance = async (req, res) => {
  const { admin } = req.admin;
  try {
    const balace = await prisma.$queryRaw`
    SELECT 
      SUM(CAST(net_amount * ${Number(process.env.PLATFORM_RATE) / 100
      } AS FLOAT) ) AS balance
    FROM orders 
    WHERE is_paid = true AND order_status = "COMPLETED" OR order_status = "PICKED_UP"
`;
    const response = okResponse(balace, "Balace.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  loginAdmin,
  refreshAdmin,
  registerUser,
  resetPassword,
  changePassword,
  resendOtp,
  editAdmin,
  getMe,
  logoutAdmin,
  adminWallet,
  adminWalletBalance,
};
