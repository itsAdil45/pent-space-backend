const axios = require("axios");

const verifyFacebookToken = async (token) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/me?access_token=${token}`
    );
    console.log(response);
    const { name, id } = response.data;
    return { user_name: name, password: id };
  } catch (error) {
    console.log(error);
    throw new Error("Error verifying Google token");
  }
};

module.exports = verifyFacebookToken;
