const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendReviewNotification = async ({ sender, token, business_id }) => {
  if (!token) {
    throw new Error("FCM token is required");
  }
  const message = {
    notification: {
      title: `Profile Reviewed`,
      body: `${sender} has reviewed your profile, Click to learn more`,
    },
    token,
  };

  try {
    await prisma.business_notifications.create({
      data: {
        title: `Profile Reviewed`,
        message: `${sender} has reviewed your profile, Click to learn more`,
        metadata: ``,
        business_id,
      },
    });
  } catch (error) {
    console.log(error);
  }

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
    });
};

module.exports = sendReviewNotification;
