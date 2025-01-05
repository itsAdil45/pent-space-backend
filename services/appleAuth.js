const jwt = require("jsonwebtoken");

const verifyAppleToken = async (token) => {
  try {
    // const decodedToken = jwt.decode(token, { complete: true });
    // const { header, payload } = decodedToken;

    // if (
    //   header.alg !== "RS256" ||
    //   payload.iss !== "https://appleid.apple.com" ||
    //   payload.aud !== "com.your.app.bundleId" ||
    //   Date.now() >= payload.exp * 1000
    // ) {
    //   throw new Error("Invalid Apple token");
    // }
    return { email: "apple@gmail.com", password: "secret_key" };
  } catch (error) {
    console.log(error);
    throw new Error("Error verifying Google token");
  }
};

module.exports = verifyAppleToken;
