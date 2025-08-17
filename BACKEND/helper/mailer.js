const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,          // smtp.gmail.com
  port: Number(process.env.EMAIL_PORT),  // 465
  secure: true,                          // true for port 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER,        // your Gmail address
    pass: process.env.EMAIL_PASS,        // your Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,           // allow self-signed cert (dev only)
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});

module.exports = transporter;
