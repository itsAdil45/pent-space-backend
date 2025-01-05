const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendCommentFeedNotification = async ({
  token,
  feed_id,
  user_id,
  user,
}) => {
  const message = {
    notification: {
      title: "Comment Feed",
      body: `${
        user.user_type == "USER" ? user.user_name : user.business_name
      } has commented on your feed`,
    },
    token,
  };

  console.log(user);

  if (user.id !== user_id) {
    try {
      await prisma.notifications.create({
        data: {
          title: "Comment Feed",
          message: `${
            user.user_type == "USER" ? user.user_name : user.business_name
          } has commented on your feed`,
          metadata: `feed_id-${feed_id}`,
          user_id: user_id,
          sender_id: user.id,
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
  }
};

module.exports = sendCommentFeedNotification;
