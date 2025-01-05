const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendAccountCreditNotification = async ({
  order_id,
  token,
  amount,
  business_id,
}) => {
  const message = {
    notification: {
      title: `Account Credited`,
      body: `Your account has been credited $${amount} against order# ${order_id}, Click to learn more`,
    },
    token,
  };

  try {
    await prisma.business_notifications.create({
      data: {
        title: `Account Credited`,
        message: `Your account has been credited $${amount} against order# ${order_id}, Click to learn more`,
        metadata: `order_id-${order_id}, amount-${amount}`,
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

module.exports = sendAccountCreditNotification;
