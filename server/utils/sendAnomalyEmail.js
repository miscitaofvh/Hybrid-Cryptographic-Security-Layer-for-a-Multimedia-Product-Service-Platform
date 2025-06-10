import nodemailer from 'nodemailer';

export async function sendAnomalyEmail(email, details) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Security Alert" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Suspicious login attempt detected',
    html: `
      <p>Hi,</p>
      <p>We detected a login attempt from a new device or location:</p>
      <ul>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        <li><strong>IP:</strong> ${details.ip}</li>
        <li><strong>User-Agent:</strong> ${details.userAgent}</li>
      </ul>
      <p>If this was not you, please reset your password immediately.</p>
      <p>Thanks,<br>Your Security Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
