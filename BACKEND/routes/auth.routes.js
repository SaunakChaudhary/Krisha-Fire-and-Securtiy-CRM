const express = require("express");
const router = express.Router();
const {
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/me", authMiddleware, getCurrentUser);

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
