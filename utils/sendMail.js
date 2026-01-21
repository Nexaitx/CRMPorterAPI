const nodemailer = require("nodemailer");

const sendMail = async (to, link) => {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sandeepverma4928@gmail.com",
      pass: "avem nabn klhw tkbs"
    }
  });

  const mailOptions = {
    from: "vitoxyz@gmail.com",
    to,
    subject: "Reset Password",
    html: `
      <h3>Password Reset</h3>
      <p>Click below link to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link is valid for 30 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
