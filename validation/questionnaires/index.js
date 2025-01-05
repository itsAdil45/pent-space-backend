/** @format */

const Joi = require("joi");

const createQuestionnairesSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    question_text: Joi.string().required(),
  }),
});

const answerQuestionnaireSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    questionnaires_id: Joi.number().min(1).required(),
    answer_text: Joi.string().required(),
  }),
});

const getQuestionnairesByIdSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    questionnaires_id: Joi.number().min(1).required(),
  }),
  body: Joi.object({}),
});

const deleteQuestionnaireSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ questionnaires_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});

const deleteanswerQuestionnaireSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ answer_id: Joi.number().min(1).required() }),
  body: Joi.object({}),
});

module.exports = {
  createQuestionnairesSchema,
  answerQuestionnaireSchema,
  getQuestionnairesByIdSchema,
  deleteQuestionnaireSchema,
  deleteanswerQuestionnaireSchema,
};
