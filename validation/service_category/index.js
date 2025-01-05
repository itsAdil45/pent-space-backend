/** @format */

const Joi = require("joi");

const createServiceCategorySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
  }),
});

const updateServiceCategorySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ service_category_id: Joi.number().min(1).required() }),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    is_active: Joi.boolean(),
  }),
});

const deleteServiceCategorySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ service_category_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});

module.exports = {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  deleteServiceCategorySchema,
};
