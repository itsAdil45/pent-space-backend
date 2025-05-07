/** @format */

const Joi = require("joi");

const createServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    service_name: Joi.string().required(),
    description: Joi.string(),
    service_category_id: Joi.string().required(),
    longitude: Joi.string().required(),
    latitude: Joi.number().required(),
    country: Joi.string().valid("Ghana", "South Africa", "Nigeria").required(),
  }),
});

const getAllServicesSchema = Joi.object({
  query: Joi.object({
    radius: Joi.string(),
     longitude: Joi.string(),
    latitude: Joi.string(),
    first_key_word: Joi.string(),
    second_key_word: Joi.string(),
    third_key_word: Joi.string(),
    city: Joi.string(),
    street: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});
const updateServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ service_id: Joi.number().min(1).required() }),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    service_category_id: Joi.string(),
    is_active: Joi.boolean(),
    longitude: Joi.string(),
    latitude: Joi.number(),
    country: Joi.string().valid("Ghana", "South Africa", "Nigeria"),
  }),
});

const deleteServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ service_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});


const likeServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    service_id: Joi.number().integer().min(1).required(),
  }),
});



module.exports = {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
  getAllServicesSchema,
  likeServiceSchema,

};
