const userModel = require("../models/user.model");
const engModel = require("../models/engineer.model");
const bcrypt = require("bcryptjs");
const sendMail = require("../helper/sendMail");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username and password" });
    }

    const user = await userModel
      .findOne({ username })
      .populate("accesstype_id");

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const role = user.accesstype_id?.name;

    const token = jwt.sign(
      {
        userId: user._id,
        role: role,
      },
      process.env.JWT_Token,
      { expiresIn: "24h" }
    );

    // Convert user document to plain object and remove password
    const userObj = user.toObject();
    delete userObj.password;

    // Initialize engineer as null
    let engineer = null;
    // If user is engineer, fetch their engineer data
    if (role === "Engineer") {
      engineer = await engModel.findOne({ user_id: user._id });
    }
    
    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: userObj,
      role: role,
      engineer, // null for non-engineers
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }

    const user = await userModel.findOne({ email });
    // Always respond generically to avoid user enumeration
    if (!user) {
      // Optionally, you could still send an email saying "no account" OR just return below:
      return res
        .status(200)
        .json({ message: "Password reset link sent to your email" });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_Token, {
      expiresIn: "10m",
    });

    const resetLink = `${
      process.env.FRONTEND_URL
    }/reset-password/${encodeURIComponent(resetToken)}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
  <style>
    body {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      margin: 0;
      padding: 0;
      font-family: 'Inter', Arial, sans-serif;
    }
    .container {
      max-width: 480px;
      margin: 40px auto;
      background: #fff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 32px 0 rgba(36, 38, 43, 0.17);
      border: 1px solid #ececec;
    }
    .header {
      background: #243957;
      padding: 32px 24px 16px 24px;
      text-align: center;
    }
    .header img {
      width: 60px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0;
      color: #fff;
      font-size: 28px;
      letter-spacing: .5px;
    }
    .body {
      padding: 28px 24px 24px 24px;
      text-align: center;
      color: #232323;
    }
    .body p {
      font-size: 17px;
      margin: 18px 0 24px;
      line-height: 1.6;
      color: #444;
    }
    .reset-btn {
      display: inline-block;
      background: #2957d0;
      color: #fff !important;
      font-weight: bold;
      text-decoration: none;
      padding: 15px 32px;
      border-radius: 8px;
      font-size: 17px;
      box-shadow: 0 2px 10px rgba(41, 87, 208, 0.15);
      transition: background 0.2s;
      margin-bottom: 12px;
    }
    .reset-btn:hover {
      background: #1341a0;
    }
    .footer {
      background: #f1f5f9;
      padding: 18px 10px;
      text-align: center;
      font-size: 13px;
      color: #98a6ad;
      border-top: 1px solid #ececec;
    }
    @media (max-width: 600px) {
      .container { max-width: 98%; }
      .header, .body, .footer { padding-left: 10px; padding-right: 10px; }
      .reset-btn { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://cdn-icons-png.flaticon.com/512/634/634741.png" 
           alt="Lock Icon" />
      <h1>Password Reset</h1>
    </div>
    <div class="body">
      <p>We received a request to reset your password.<br />
      Click the button below to create a new password.<br /><br />
      <a href="${resetLink}" class="reset-btn">Reset Password</a>
      <br />
      <span style="font-size:14px;color:#888;">
        This link will expire in <b>10 minutes</b>.<br>If you didn't request this, just ignore this email.
      </span>
    </div>
    <div class="footer">
      &copy; 2025 <strong>Krisha Fire & Securiry</strong>. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const emailSent = await sendMail(email, "Password Reset", "", html);
    // Optional: If user doesn't exist, you don't send email (or you can send a generic info mail).

    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is missing" });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_Token);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Reset link has expired or is invalid" });
    }

    const user = await userModel.findById(payload.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password updated successfully. Please log in." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let engineer = null;

    // If the role is Engineer, fetch related engineer info
    if (req.user.role === "Engineer") {
      engineer = await engModel.findOne({ user_id: user._id });
    }

    return res.status(200).json({
      user,
      role: req.user.role,
      engineer, // this will be null if not Engineer
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login, forgotPassword, resetPassword, getCurrentUser };
