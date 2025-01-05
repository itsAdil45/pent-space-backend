const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendAnswerQuestionnaireNotification = async ({
  token,
  questionnaire_id,
  user_id,
  user,
}) => {
  console.log(user);
  const message = {
    notification: {
      title: "Answer Questionnaire",
      body: `${
        user.user_type == "USER" ? user.user_name : user.business_name
      } has answered on your question`,
    },
    token,
  };

  if (user_id !== user.id) {
    try {
      await prisma.notifications.create({
        data: {
          title: "Answer Questionnaire",
          message: `${
            user.user_type == "USER" ? user.user_name : user.business_name
          } has answered on your question`,
          metadata: `questionnaire_id-${questionnaire_id}`,
          user_id: user_id,
          sender_id: user.id,
        },
      });
    } catch (error) {
      console.log(error);
    }

    if (token) {
      console.log(token);
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
        });
    }
  }
};

module.exports = sendAnswerQuestionnaireNotification;
