const admin = require("../configs/firebase/firebase.config");

const sendPrivateChatMessageNotification = ({ sender, message, fcm_token }) => {
  const message_data = {
    notification: {
      title: `One new message from ${sender}`,
      body: message,
    },
    token: fcm_token,
  };

  if (fcm_token) {
    admin
      .messaging()
      .send(message_data)
      .then((response) => {
        console.log(response);
        // console.log(response.responses);
      })
      .catch((error) => {
        console.error("Error sending notification:", error);
        //   res.status(500).send(error);
      });
  }
};

module.exports = sendPrivateChatMessageNotification;
