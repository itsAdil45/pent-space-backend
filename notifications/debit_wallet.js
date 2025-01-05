const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendAccountDebitedNotification = async ({
  account_no,
  token,
  amount,
  business_id,
}) => {
  console.log(token);
  const message = {
    notification: {
      title: `Account Debited`,
      body: `Your account has been debited $${amount} against bank account# ${account_no}, Click to learn more`,
    },
    token,
  };

  try {
    await prisma.business_notifications.create({
      data: {
        title: `Account Debited`,
        message: `Your account has been debited $${amount} against bank account# ${account_no}, Click to learn more`,
        metadata: `account_no-${account_no}, amount-${amount}`,
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

module.exports = sendAccountDebitedNotification;
