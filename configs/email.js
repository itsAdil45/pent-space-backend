const nodemailer = require("nodemailer");

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_ACCOUNT_EMAIL,
    pass: process.env.GMAIL_ACCOUNT_PASSWORD,
  },
});

const sendEmail = async (mailDetails) => {
  try {
    const info = await transporter.sendMail(mailDetails);
    return info;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
