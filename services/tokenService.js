/** @format */

const jwt = require("jsonwebtoken");

class TokenService {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  // Generate an access token
  generateAccessToken(id, type) {
    return jwt.sign({ id, type }, this.secretKey, { expiresIn: "1d" }); // Expires in 1 day
  }

  // Generate a refresh token
  generateRefreshToken(id, type) {
    return jwt.sign({ id, type }, this.secretKey, { expiresIn: "7d" }); // Expires in 7 days
  }

  // Verify and decode the access token
  verifyAccessToken(accessToken) {
    try {
      const { id, type } = jwt.verify(accessToken, this.secretKey);
      return { id, type };
    } catch (error) {
      return null; // Token verification failed
    }
  }

  // Refresh the access token using the refresh token
  refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.secretKey);
      const { id, type } = decoded;
      return this.generateAccessToken(id, type);
    } catch (error) {
      return null; // Token verification failed
    }
  }
}

module.exports = TokenService;
