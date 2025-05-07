const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendServiceSearchNotification = async ({
  token,
  business_id,
  user,
  keywords,
}) => {
  const keywordText = keywords.join(', ');
  
  const message = {
    notification: {
      title: "Service Search Notification",
      body: `${user.user_type == "USER" ? user.user_name : user.business_name} is searching for ${keywordText} services. They might be interested in your services!`,
    },
    token,
  };

  try {
    await prisma.business_notifications.create({
      data: {
        title: "Service Search Notification",
        message: `${user.user_type == "USER" ? user.user_name : user.business_name} is searching for ${keywordText} services. They might be interested in your services!`,
        metadata: `keywords-${keywordText}`,
        business_id,
      },
    });
  } catch (error) {
    console.log(error);
  }
    
  if (token) {
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
};

module.exports = sendServiceSearchNotification;