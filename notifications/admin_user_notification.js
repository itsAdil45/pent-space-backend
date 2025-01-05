const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendAdminUserNotification = async ({
  token,
  title,
  user_id,
  message,
}) => {
  const message_data = {
    notification: {
      title: `Admin Notification. ${title}`,
      body: `${message}, click here for more details`,
    },
    token,
  };

  try {
    await prisma.notifications.create({
      data: {
        message,
        title: `Admin has sent you a notification. ${title}`,
        user_id,
      },
    });
  } catch (error) {
    console.log(error);
  }

  if (token)
    admin
      .messaging()
      .send(message_data)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("Error sending notification:", error);
      });
};

module.exports = sendAdminUserNotification;
