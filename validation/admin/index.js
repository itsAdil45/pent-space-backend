/** @format */

const { Order_status } = require("@prisma/client");
const Joi = require("joi");
const mobile = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

const registerSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    user_name: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
    profile_picture: Joi.string().required(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
  }),
});

const resetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().max(100).required(),
    newPassword: Joi.string().max(100).required(),
    otp: Joi.number().integer().min(0).max(999999).required(),
  }),
});

const changePasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    currentPassword: Joi.string().max(100).required(),
    newPassword: Joi.string().max(100).required(),
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
    email: Joi.string().email().max(100),
    password: Joi.string().max(100).required(),
  }),
});

const logoutSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    refresh_token: Joi.string().required(),
  }),
});

const editAdminSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    user_name: Joi.string(),
    profile_picture: Joi.string(),
    is_notification: Joi.boolean(),
    is_deleted: Joi.boolean().valid(true),
  }),
});

const getWalletSchema = Joi.object({
  query: Joi.object({
    order_status: Joi.string().valid("COMPLETED", "CANCELLED").required(),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});

module.exports = {
  registerSchema,
  changePasswordSchema,
  resetPasswordSchema,
  resendOtpSchema,
  loginSchema,
  logoutSchema,
  editAdminSchema,
  getWalletSchema,
};
