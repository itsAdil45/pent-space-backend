/** @format */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const webhookHandler = require("./webhook");
const { reqLogger } = require("./configs/logger");
const errorHandlerMiddleware = require("./middleware/errorHandler.middleware");
const app = express();
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookHandler
);
app.use(cookieParser());
const routes = require("./routes");
app.use(express.json({ limit: "100mb" }));
app.use(cors());
app.use(reqLogger);
app.use("/api", routes);
app.get("/", (req, res) => {
  res.send("Api is working...");
});
app.use(errorHandlerMiddleware);

module.exports = app;
