/** @format */
const sendEmail = require("../configs/email");
const HTML_TEMPLATE = require("./feedback");

const contactEmail = async (data) => {
  const mailOptions = {
    to: data.email,
    from: process.env.GMAIL_ACCOUNT_EMAIL,
    subject: data.subject,
    html: HTML_TEMPLATE(
      data.title,
      data.message,
      data.heading,
      "https://dolled-out-s3bucket.s3.us-east-2.amazonaws.com/product/logo-1718393193485"
    ),
  };
  try {
    const info = await sendEmail(mailOptions);
    console.log(info);
  } catch (error) {
    console.log(error);
    throw new Error("Error while sending Email");
  }
};

module.exports = contactEmail;
