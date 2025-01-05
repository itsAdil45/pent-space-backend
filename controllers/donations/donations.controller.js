/** @format */

const {
  createCustomer,
  createPaymentIntent,
} = require("@/utils/stripe_helpers");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
  notFound,
  badRequestResponse,
} = require("../../constants/responses");

const createDonations = async (req, res) => {
  const { user } = req.user;
  const { crowd_funding_id, donated_amount } = req.body;
  const current_datetime = new Date().toISOString();
  try {
    const crowd_funding = await prisma.crowd_fundings.findFirst({
      where: {
        id: Number(crowd_funding_id),
      },
    });
    if (!crowd_funding) {
      const response = badRequestResponse("Crowd Funding does not exist.");
      return res.status(response.status.code).json(response);
    }
    console.log(crowd_funding.end_datetime, current_datetime);
    if (crowd_funding.end_datetime < current_datetime) {
      const response = badRequestResponse("Crowd Funding ended already.");
      return res.status(response.status.code).json(response);
    }
    let already_donated_amount =
      await prisma.$queryRaw`SELECT SUM(donated_amount) as sum FROM donations WHERE crowd_funding_id = ${crowd_funding_id} AND is_paid = ${true}`;
    already_donated_amount = already_donated_amount[0].sum || 0;

    console.log(
      already_donated_amount + donated_amount,
      "test",
      crowd_funding.amount
    );

    if (crowd_funding.amount < already_donated_amount + donated_amount) {
      const response = badRequestResponse(
        "Required donation is more than the donated amount."
      );
      return res.status(response.status.code).json(response);
    }

    const result = await prisma.donations.create({
      data: {
        crowd_funding_id,
        donated_amount: `${donated_amount}`,
        user_id: user.id,
      },
    });

    // const { id: customerId } = await createCustomer(user);
    // const paymentIntent = await createPaymentIntent({
    //   amount: Math.ceil(donated_amount * 100),
    //   metadata: {
    //     donation_id: `${result?.id}`,
    //   },
    //   customer: customerId,
    // });
    // const paymentIntentRes = {
    //   paymentIntentId: paymentIntent.id,
    //   clientSecret: paymentIntent.client_secret,
    // };

    const response = okResponse(
      // `${process.env.FRONTEND_DOMAIN}/payment?client_secret=${paymentIntentRes.clientSecret}`,
      "Successfully Created"
    );
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
    const result = await prisma.questionnaires_answers.create({
      data: {
        questionnaires_id: Number(questionnaires_id),
        user_id: user.id,
        answer_text,
      },
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
  createDonations,
  answerQuestionnaire,
  deleteAnswerQuestionnaire,
  getAllQuestionnaires,
  getQuestionnairesById,
  deleteQuestionnaires,
};
