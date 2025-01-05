/** @format */

const Joi = require("joi");

const createFeedsSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    about: Joi.string().required(),
  }),
});

const likeFeedSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    feed_id: Joi.number().min(1).required(),
  }),
});

const commentFeedSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    feed_id: Joi.number().min(1).required(),
    comment_text: Joi.string().required(),
  }),
});

const getFeedByIdSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    feed_id: Joi.number().min(1).required(),
  }),
  body: Joi.object({}),
});

const deleteFeedsSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ feed_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});

const deleteCommentSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ comment_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});

module.exports = {
  createFeedsSchema,
  likeFeedSchema,
  deleteFeedsSchema,
  commentFeedSchema,
  getFeedByIdSchema,
  deleteCommentSchema,
};
