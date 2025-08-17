const transporter = require("./mailer");

const sendMail = async (to, subject, text, html) => {
  if (!to || !subject || !html) {
    return {
      success: false,
      error: "Missing required fields: 'to', 'subject', or 'html'",
    };
  }

  const mailOptions = {
    from: `"Krisha Fire and Safety" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: text || "",
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "Failed to send email" };
  }
};

module.exports = sendMail;
