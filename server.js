/** @format */

require("module-alias/register");
const env = require("dotenv");
const path = require("path");
const app = require("./app");

const { logger } = require("./configs/logger");

if (process.env.NODE_ENV === "dev") {
  env.config({ path: path.join(__dirname, ".env.dev") });
} else if (process.env.NODE_ENV === "production") {
  env.config({ path: path.join(__dirname, ".env.production") });
} else if (process.env.NODE_ENV === "qa") {
  env.config({ path: path.join(__dirname, ".env.qa") });
} else {
  env.config();
}
const connectSocket = require("./configs/socket");

const httpServer = require("http").createServer(app);
connectSocket(httpServer);

httpServer.listen(process.env.PORT, () => {
  logger.info(`listening on http://localhost:${process.env.PORT}`);
});
