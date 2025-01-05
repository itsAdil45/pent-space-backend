/** @format */

const sendAnswerQuestionnaireNotification = require("@/notifications/answer_questionnaire");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
  badRequestResponse,
} = require("../../constants/responses");

const createQuestionnaire = async (req, res) => {
  const { user } = req.user;
  try {
    const result = await prisma.questionnaires.create({
      data: {
        ...req.body,
        user_id: user.id,
      },
    });

    const response = okResponse(result, "Successfully Created");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const answerQuestionnaire = async (req, res) => {
  const { user } = req.user;
  const { questionnaires_id, answer_text } = req.body;

  try {
    const questionnaires = await prisma.questionnaires.findFirst({
      where: {
        id: Number(questionnaires_id),
      },
      include: {
        users: true,
      },
    });
    const result = await prisma.questionnaires_answers.create({
      data: {
        questionnaires_id: Number(questionnaires_id),
        user_id: user.id,
        answer_text,
      },
    });

    await sendAnswerQuestionnaireNotification({
      questionnaire_id: questionnaires_id,
      token: questionnaires.users.fcm_token,
      user_id: questionnaires.users.id,
      user,
    });

    const answer =
      await prisma.$queryRaw`SELECT qa.id,qa.user_id,qa.answer_text,qa.createdAt, CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture FROM questionnaires_answers AS qa JOIN users AS u ON u.id=qa.user_id WHERE qa.id=${result.id}`;

    const response = okResponse(answer[0], "A new answer added");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteAnswerQuestionnaire = async (req, res) => {
  const { user } = req.user;
  const { answer_id } = req.params;
  try {
    const result = await prisma.questionnaires_answers.delete({
      where: {
        id: Number(answer_id),
      },
    });
    const response = okResponse(result, "Answer Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    if (error.meta.cause == "Record to delete does not exist.") {
      const response = badRequestResponse(
        "Record to delete does not exist or you don't have access to deleted."
      );
      return res.status(response.status.code).json(response);
    }
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getAllQuestionnaires = async (req, res) => {
  try {
    const get_all_questionnaires_answers =
      await prisma.$queryRaw`SELECT q.id,q.user_id,q.createdAt,q.question_text, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM questionnaires_answers WHERE questionnaires_id = q.id) AS total_answers FROM questionnaires AS q
      JOIN users AS u ON u.id = q.user_id`;

    const response = okResponse(
      get_all_questionnaires_answers,
      "All Questionnaires Answers"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getMyQuestionnaires = async (req, res) => {
  const { user } = req.user;
  try {
    const get_all_questionnaires_answers =
      await prisma.$queryRaw`SELECT q.id,q.user_id,q.createdAt,q.question_text, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM questionnaires_answers WHERE questionnaires_id = q.id) AS total_answers FROM questionnaires AS q
      JOIN users AS u ON u.id = q.user_id WHERE q.user_id = ${user.id}`;

    const response = okResponse(
      get_all_questionnaires_answers,
      "All Questionnaires Answers"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const getQuestionnairesById = async (req, res) => {
  const { questionnaires_id } = req.params;
  try {
    const get_questionnaires_by_id =
      await prisma.$queryRaw`SELECT q.id,q.user_id,q.createdAt,q.question_text, 
      CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture,
      (SELECT CAST(COUNT(id) AS FLOAT) FROM questionnaires_answers WHERE questionnaires_id = q.id) AS total_answers FROM questionnaires AS q 
      JOIN users AS u ON u.id = q.user_id WHERE q.id=${questionnaires_id}`;

    const answers =
      await prisma.$queryRaw`SELECT qa.id,qa.user_id,qa.answer_text,qa.createdAt, CASE WHEN u.user_type = "BUSINESS" THEN u.business_name ELSE u.full_name END AS user_name,u.profile_picture FROM questionnaires_answers AS qa JOIN users AS u ON u.id=qa.user_id WHERE qa.questionnaires_id=${questionnaires_id}`;

    const response = okResponse(
      { get_questionnaires_by_id, answers },
      "Questionnaires Details"
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const deleteQuestionnaires = async (req, res) => {
  const { questionnaires_id } = req.params;
  const { user } = req.user;
  try {
    const result = await prisma.questionnaires.delete({
      where: {
        id: Number(questionnaires_id),
        user_id: user.id,
      },
    });
    const response = okResponse(result, "Questionnaires Deleted");
    return res.status(response.status.code).json(response);
  } catch (error) {
    if (error.meta.cause == "Record to delete does not exist.") {
      const response = badRequestResponse(
        "Record to delete does not exist or you don't have access to deleted."
      );
      return res.status(response.status.code).json(response);
    }
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  createQuestionnaire,
  answerQuestionnaire,
  deleteAnswerQuestionnaire,
  getAllQuestionnaires,
  getQuestionnairesById,
  deleteQuestionnaires,
  getMyQuestionnaires,
};
