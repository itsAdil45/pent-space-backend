/** @format */

const express = require("express");
const validateRequest = require("../../middleware/validateRequestJoi.middleware");
const verifyToken = require("@/middleware/verifyToken");
const {
  createQuestionnairesSchema,
  getQuestionnairesByIdSchema,
  answerQuestionnaireSchema,
  deleteanswerQuestionnaireSchema,
  deleteQuestionnaireSchema,
} = require("@/validation/questionnaires");
const {
  createQuestionnaire,
  getAllQuestionnaires,
  getQuestionnairesById,
  answerQuestionnaire,
  deleteAnswerQuestionnaire,
  deleteQuestionnaires,
} = require("@/controllers/questionnaires/questionnaires.controller");
const { createDonationSchema } = require("@/validation/donations");
const {
  createDonations,
} = require("@/controllers/donations/donations.controller");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  validateRequest(createDonationSchema),
  createDonations
);
router.get("/", verifyToken, getAllQuestionnaires);

router.get(
  "/:questionnaires_id",
  verifyToken,
  validateRequest(getQuestionnairesByIdSchema),
  getQuestionnairesById
);

router.post(
  "/answer",
  verifyToken,
  validateRequest(answerQuestionnaireSchema),
  answerQuestionnaire
);

router.delete(
  "/answer/:answer_id",
  verifyToken,
  validateRequest(deleteanswerQuestionnaireSchema),
  deleteAnswerQuestionnaire
);

router.delete(
  "/:questionnaires_id",
  verifyToken,
  validateRequest(deleteQuestionnaireSchema),
  deleteQuestionnaires
);
module.exports = router;
