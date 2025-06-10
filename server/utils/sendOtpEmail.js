import nodemailer from "nodemailer";

export const sendOtpEmail = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Music Platform" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}\nIt is valid for 3 minutes. If you did not request this, please ignore.`,
  };

  await transporter.sendMail(mailOptions);
};
