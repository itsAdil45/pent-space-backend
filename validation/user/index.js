/** @format */

const Joi = require("joi");

const registerSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(8).max(20).required(),
    user_type: Joi.string().valid("USER", "BUSINESS").required(),
  }),
});

const verifyOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
    otp: Joi.number().integer().min(0).max(999999).required(),
  }),
});

const resendOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
  }),
});

const loginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(8).max(20).required(),
  }),
});

const socialLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    token: Joi.string().required(),
  }),
});

const logoutSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    refresh_token: Joi.string().required(),
  }),
});

const changePasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    password: Joi.string().min(8).max(20).required(),
    old_password: Joi.string().min(8).max(20).required(),
  }),
});

const forgetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
  }),
});

const resetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    password: Joi.string().min(8).max(20).required(),
  }),
});

const blockUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    blocked_user_id: Joi.number().integer().min(1).required(),
  }),
});

const getAllUsersSchema = Joi.object({
  query: Joi.object({ user_name: Joi.string() }),
  params: Joi.object({}),
  body: Joi.object({}),
});

const getByIdSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ userId: Joi.string().required() }),
  body: Joi.object({}),
});

const editUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    user_name: Joi.string(),
    full_name: Joi.string(),
    business_name: Joi.string(),
    date_of_birth: Joi.date(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER"),
    marital_status: Joi.string().valid("SINGLE", "MARRIED", "OTHER"),
    phone: Joi.string(),
    fcm_token: Joi.string(),
    school_attended: Joi.string(),
    address: Joi.string(),
    country: Joi.string(),
    longitude: Joi.number(),
    latitude: Joi.number(),
    first_key_word: Joi.string(),
    second_key_word: Joi.string(),
    third_key_word: Joi.string(),
  }),
});

const createUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    full_name: Joi.string(),
    user_name: Joi.string(),
    business_name: Joi.string(),
    phone: Joi.string().required(),
    country: Joi.string().valid("Nigeria", "Ghana", "South Africa").required(),
    address: Joi.string(),
    first_key_word: Joi.string(),
    second_key_word: Joi.string(),
    third_key_word: Joi.string(),
  }),
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  logoutSchema,
  changePasswordSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  getByIdSchema,
  editUserSchema,
  getAllUsersSchema,
  socialLoginSchema,
  createUserSchema,
  blockUserSchema,
};
