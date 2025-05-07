/** @format */

const { prisma } = require("../../configs/prisma");
const bcrypt = require("bcryptjs");
const {
  serverErrorResponse,
  okResponse,
  badRequestResponse,
  forbiddenResponse,
  unauthorizedResponse,
  sessionExpired,
  notFound,
} = require("../../constants/responses");
const TokenService = require("@/services/tokenService");
const contactEmail = require("@/email/contactEmail");
const sendOtpEmail = require("@/email/sendOtp");

const {
  generateRandomAlphanumericCode,
  resetOtp,
} = require("@/services/generateOtp");
const verifyGoogleToken = require("@/services/googleAuth");
const verifyAppleToken = require("@/services/appleAuth");
const verifyFacebookToken = require("@/services/facebookAuth");
const tokenService = new TokenService(process.env.JWT_SECRET_KEY);

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        is_deleted: false,
        user_type: "USER",
      },
    });
    const response = okResponse(users, "All users");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.findFirst({
      where: {
        is_deleted: false,
        id: Number(id),
      },
    });
    if (!user) {
      const response = badRequestResponse("User not found.");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse(user, "user data");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllBusiness = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        is_deleted: false,
        user_type: "BUSINESS",
      },
    });
    const response = okResponse(users, "All business");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const blockUser = async (req, res) => {
  const { user } = req.user;
  const { blocked_user_id } = req.body;
  try {
    const already_blocked = await prisma.block_user.findFirst({
      where: {
        blocked_by_id: user.id,
        blocked_user_id,
      },
    });

    if (already_blocked) {
      await prisma.block_user.delete({
        where: {
          id: already_blocked.id,
        },
      });
    } else {
      await prisma.block_user.create({
        data: {
          blocked_by_id: user.id,
          blocked_user_id,
        },
      });
    }
    const response = okResponse(
      null,
      `User ${already_blocked ? "unblocked" : "blocked"} successfully`
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  req.body.password = hashedPassword;
  try {
    let user = await prisma.users.findFirst({
      where: {
        email,
        is_deleted: false,
      },
    });
    if (user?.is_verified) {
      const response = forbiddenResponse(
        `Email already taken as a ${user.user_type}.`
      );
      return res.status(response.status.code).json(response);
    }
    const otp = generateRandomAlphanumericCode(4);

    if (!user) {
      user = await prisma.users.create({
        data: {
          ...req.body,
          otp,
        },
      });
    } else {
      await prisma.users.update({
        data: {
          ...req.body,
          otp,
        },
        where: {
          id: user.id,
        },
      });
    }
    await resetOtp("users", user.id); //expire OTP after 60seconds

    await sendOtpEmail({
      email,
      subject: "One Time Password (OTP)",
      otp,
    });

    const response = okResponse(
      { otp },
      "User created successfully. Please verify otp"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const verifyOtp = async (req, res) => {
  const { otp, email } = req.body;
  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
        is_deleted: false,
      },
    });
    console.log(user);
    if (!user) {
      const response = badRequestResponse("Invalid email.");
      return res.status(response.status.code).json(response);
    }
    // if (user.is_verified) {
    //   const response = badRequestResponse("Already Verified.");
    //   return res.status(response.status.code).json(response);
    // }
    if (user.otp == otp) {
      await prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          is_verified: true,
          otp: "",
        },
      });
    } else {
      const response = badRequestResponse("Invalid or Expired OTP.");
      return res.status(response.status.code).json(response);
    }

    const access_token = tokenService.generateAccessToken(user.id);

    const response = okResponse({ access_token }, "User OTP verified.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      const response = notFound("User not Valid.");
      return res.status(response.status.code).json(response);
    }
    const otp = generateRandomAlphanumericCode(4);
    await prisma.users.update({
      data: {
        otp,
      },
      where: {
        id: user.id,
      },
    });
    await resetOtp("users", user.id); //expire OTP after 60seconds
    await sendOtpEmail({
      email,
      subject: "One Time Password (OTP)",
      otp,
    });

    const response = okResponse(
      { otp },
      "OTP sent successfully. Please verify OTP"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
        is_deleted: false,
      },
    });

    if (!user) {
      const response = badRequestResponse("User not found. Please create one.");
      return res.status(response.status.code).json(response);
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      const response = badRequestResponse("Invalid credentials.");
      return res.status(response.status.code).json(response);
    }

    const access_token = tokenService.generateAccessToken(user.id);
    console.log(access_token);
    const refresh_token = tokenService.generateRefreshToken(user.id);
    console.log(refresh_token);

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
        user_type: user.user_type,
      },
    });

    if (!user.is_verified) {
      const response = okResponse(
        { is_verified: user.is_verified },
        "OTP not verified."
      );
      return res.status(response.status.code).json(response);
    }

    const response = okResponse(
      {
        access_token,
        refresh_token,
        is_completed: user.is_completed,
        user_type: user.user_type,
      },
      "User login successful."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const googleLoginUser = async (req, res) => {
  const { token } = req.body;

  try {
    let registered = true;
    const user_data = await verifyGoogleToken(token);
    const { password } = user_data;

    let user = await prisma.users.findFirst({
      where: {
        password,
        is_verified: true,
        is_deleted: false,
      },
    });

    if (!user) {
      registered = false;
      user = await prisma.users.create({
        data: {
          ...user_data,
          is_verified: true,
        },
      });
    }

    const access_token = tokenService.generateAccessToken(user.id);
    const refresh_token = tokenService.generateRefreshToken(user.id);

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
      },
    });

    const response = okResponse(
      { access_token, refresh_token, registered },
      "User login successful."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const facebookLoginUser = async (req, res) => {
  const { token } = req.body;
  let registered = true;
  try {
    const user_data = await verifyFacebookToken(token);
    const { user_name, password } = user_data;

    let user = await prisma.users.findFirst({
      where: {
        password,
        is_verified: true,
        is_deleted: false,
      },
    });

    if (!user) {
      registered = false;

      user = await prisma.users.create({
        data: {
          user_name,
          password,
          is_verified: true,
        },
      });
    }

    const access_token = tokenService.generateAccessToken(user.id);
    const refresh_token = tokenService.generateRefreshToken(user.id);

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
      },
    });

    const response = okResponse(
      { access_token, refresh_token, registered },
      "User login successful."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const appleLoginUser = async (req, res) => {
  const { token } = req.body;
  let registered = true;

  try {
    const user_data = await verifyAppleToken(token);
    const { email, password } = user_data;

    let user = await prisma.users.findFirst({
      where: {
        email,
        password,
        is_verified: true,
        is_deleted: false,
      },
    });

    if (!user) {
      registered = false;
      user = await prisma.users.create({
        data: {
          email,
          password,
          is_verified: true,
        },
      });
    }

    const access_token = tokenService.generateAccessToken(user.id);
    const refresh_token = tokenService.generateRefreshToken(user.id);

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
      },
    });

    const response = okResponse(
      { access_token, refresh_token, registered },
      "User login successful."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const logoutUser = async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const user_session = await prisma.user_sessions.deleteMany({
      where: {
        refresh_token,
      },
    });
    if (!user_session.count) {
      const response = badRequestResponse("Already Logged Out.");
      return res.status(response.status.code).json(response);
    }
    const response = okResponse({ user_session }, "User logout successful.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const refreshUser = async (req, res) => {
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

const changePassword = async (req, res) => {
  const { user } = req.user;
  const { password, old_password } = req.body;
  try {
    const match = await bcrypt.compare(old_password, user.password);
    if (!match) {
      const response = unauthorizedResponse("Incorrect Password.");
      return res.status(response.status.code).json(response);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    const response = okResponse(null, "User password changed successfully.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    let user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      const response = badRequestResponse("Record not found.");
      return res.status(response.status.code).json(response);
    }

    const otp = generateRandomAlphanumericCode(4);
    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        otp,
      },
    });
    await resetOtp("users", user.id); //expire OTP after 60seconds
    await sendOtpEmail({
      email,
      subject: "One Time Password (OTP)",
      otp,
    });
    const response = okResponse(
      { otp },
      "OTP sent successfully. Please verify OTP"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const resetPassword = async (req, res) => {
  const { user } = req.user;
  const { password } = req.body;

  try {
    const newUser = await prisma.users.findFirst({
      where: {
        id: user.id,
      },
    });
    if (!newUser) {
      const response = unauthorizedResponse("Record not found.");
      return res.status(response.status.code).json(response);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    const response = okResponse(null, "User password reset successfully.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getMe = async (req, res) => {
  const { user } = req.user;
  try {
    const newUser = await prisma.$queryRaw`
  SELECT u.id, CASE 
      WHEN u.user_type = 'USER' THEN u.user_name 
      ELSE u.business_name 
    END AS user_name,u.email,u.phone,u.country, u.address,u.date_of_birth,u.gender,u.marital_status,u.school_attended,u.profile_picture,u.longitude,u.latitude,u.first_key_word,u.second_key_word,u.third_key_word,u.stripe_account_id,u.user_type,u.fcm_token,u.is_private,u.is_notification,u.is_deleted,u.is_verified,u.is_completed,u.createdAt,u.updatedAt
  FROM users as u 
  WHERE u.is_verified = ${true} 
    AND u.is_deleted = ${false} 
    AND u.id = ${user.id}
`;

    newUser[0].address = newUser[0].address || "";
    delete newUser.full_name;
    delete newUser.password;
    delete newUser.otp;
    
    console.log(newUser);

    // newUser.date_of_birth=newUser.date_of_birth.toString();

    // users.findFirst({
    //   where: {
    //     id: Number(user.id),
    //     is_verified: true,
    //     is_deleted: false,
    //   },
    // });

    if (!newUser) {
      const response = notFound("User not Valid.");
      return res.status(response.status.code).json(response);
    }

    const response = okResponse(newUser[0], "User Data");
    return res.status(response.status.code).json(response);
  } catch (error) {
    console.log(error);
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const editMe = async (req, res) => {
  if (req.body.latitude) {
    req.body.latitude = parseFloat(req.body.latitude);
  }
  if (req.body.longitude) {
    req.body.longitude = parseFloat(req.body.longitude);
  }
  if (req.body.is_deleted) {
    req.body.is_deleted = req.body.is_deleted == "true";
  }
  if (req.body.is_private) {
    req.body.is_private = req.body.is_private == "true";
  }
  if (req.user_profile_picture?.length > 0) {
    req.body.profile_picture = req.user_profile_picture[0];
  }
  const { user } = req.user;
  const obj = {};
  if (user.user_type == "USER") {
    obj.user_name = req.body.user_name;
    delete req.body.user_name;
  } else {
    obj.business_name = req.body.user_name;
    delete req.body.user_name;
  }
  try {
    await prisma.users.update({
      where: {
        id: Number(user.id),
      },
      include: {},
      data: {
        is_completed: true,
        ...obj,
        ...req.body,
      },
    });
    const newUser = await prisma.$queryRaw`
    SELECT u.id, CASE 
        WHEN u.user_type = 'USER' THEN u.user_name 
        ELSE u.business_name 
      END AS user_name,u.email,u.phone,u.country, u.address,u.date_of_birth,u.gender,u.marital_status,u.school_attended,u.profile_picture,u.longitude,u.latitude,u.first_key_word,u.second_key_word,u.third_key_word,u.stripe_account_id,u.user_type,u.fcm_token,u.is_private,u.is_notification,u.is_deleted,u.is_verified,u.is_completed,u.createdAt,u.updatedAt
    FROM users as u 
    WHERE u.is_verified = ${true} 
      AND u.is_deleted = ${false} 
      AND u.id = ${user.id}
  `;

    newUser[0].address = newUser[0].address || "";
    delete newUser.full_name;
    delete newUser.password;
    delete newUser.otp;
    const response = okResponse(
      newUser[0],
      "Your profile updated successfully."
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const createProfile = async (req, res) => {
  req.body.latitude = parseFloat(req.body.latitude);
  req.body.longitude = parseFloat(req.body.longitude);
  req.body.profile_picture = req.user_profile_picture[0];
  console.log(req.user_profile_picture);
  const { user } = req.user;
  try {
    const { date_of_birth, ...otherData } = req.body;

await prisma.users.update({
  where: {
    id: Number(user.id),
  },
  data: {
    is_completed: true,
    ...otherData,
    date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
  },
});

    const access_token = tokenService.generateAccessToken(user.id);
    const refresh_token = tokenService.generateRefreshToken(user.id);

    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        refresh_token,
        user_type: user.user_type,
      },
    });
    const response = okResponse(
      { access_token, refresh_token },
      "Your profile created successfully."
    );
    console.log("Profile Created Succesffulllyy",response);
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    console.log(response);
    return res.status(response.status.code).json(response);
    
  }
};

const deleteUser = async (req, res) => {
  const { user } = req.user;
  try {
    const _user = await prisma.users.findFirst({
      where: {
        id: user.id,
      },
    });
    if (!_user) {
      const response = badRequestResponse("User to delete not found.");
      return res.status(response.status.code).json(response);
    }
    const test = await prisma.users.delete({
      where: {
        id: user.id,
      },
    });

    const response = okResponse(test, "User deleted successful.");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  getAllUsers,
  loginUser,
  registerUser,
  logoutUser,
  refreshUser,
  verifyOtp,
  resendOtp,
  forgetPassword,
  changePassword,
  resetPassword,
  editMe,
  googleLoginUser,
  facebookLoginUser,
  appleLoginUser,
  getMe,
  createProfile,
  deleteUser,
  getAllBusiness,
  getUserById,
  blockUser,
};
