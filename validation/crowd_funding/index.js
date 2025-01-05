/** @format */

const Joi = require("joi");

const createCrowdFundingSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    patient_name: Joi.string().required(),
    patient_gender: Joi.string().valid("MALE", "FEMALE").required(),
    date_of_birth: Joi.string().required(),
    hospital_name: Joi.string().required(),
    amount: Joi.string().required(),
    patient_account_number: Joi.string(),
    bank_name: Joi.string(),
    next_of_kin_name: Joi.string().required(),
    next_of_kin_relation: Joi.string().required(),
    next_of_kin_phone: Joi.string().required(),
    end_datetime: Joi.string().required(),
  }),
});

const updateCrowdFundingSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ crowd_funding_id: Joi.string().required() }),
  body: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    patient_name: Joi.string(),
    patient_gender: Joi.string().valid("MALE", "FEMALE"),
    date_of_birth: Joi.string(),
    hospital_name: Joi.string(),
    amount: Joi.string(),
    patient_account_number: Joi.string(),
    bank_name: Joi.string(),
    next_of_kin_name: Joi.string(),
    next_of_kin_relation: Joi.string(),
    next_of_kin_phone: Joi.string(),
    end_datetime: Joi.string(),
    is_active: Joi.boolean(),
  }),
});

module.exports = {
  createCrowdFundingSchema,
  updateCrowdFundingSchema,
};
