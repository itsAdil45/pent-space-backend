/** @format */

const Joi = require("joi");

const createTermsAndConditionsSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    data: Joi.string().required(),
  }),
});

module.exports = {
  createTermsAndConditionsSchema,
};
