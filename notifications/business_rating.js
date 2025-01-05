const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendRatingNotification = async ({ sender, token, rate, business_id }) => {
  const message = {
    notification: {
      title: `Profile Rated`,
      body: `${sender} has rated your profile with ${rate} stars , Click to learn more`,
    },
    token,
  };

  try {
    await prisma.business_notifications.create({
      data: {
        title: `Profile Rated`,
        message: `${sender} has rated your profile with ${rate} stars , Click to learn more`,
        metadata: `rate-${rate} stars`,
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

module.exports = sendRatingNotification;
