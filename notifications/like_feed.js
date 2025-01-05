const { prisma } = require("@/configs/prisma");
const admin = require("../configs/firebase/firebase.config");

const sendLikeFeedNotification = async ({
  token,
  feed_id,
  user_id,
  like,
  user,
}) => {
  const message = {
    notification: {
      title: like ? "Liked Feed" : "Unliked Feed",
      body: `${
        user.user_type == "USER" ? user.user_name : user.business_name
      } has ${
        like ? "liked" : "unliked"
      } your feed, click here for more details`,
    },
    token,
  };

  if (user.id !== user_id) {
    try {
      await prisma.notifications.create({
        data: {
          title: like ? "Liked Feed" : "Unliked Feed",
          message: `${
            user.user_type == "USER" ? user.user_name : user.business_name
          } has ${like ? "Lliked" : "Unliked"} your feed`,
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

module.exports = sendLikeFeedNotification;
