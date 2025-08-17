const express = require("express");
const router = express.Router();
const {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  changePassword,
  getEngineerByUser,
  updateEngineer,
} = require("../controllers/user.controller");

router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/", getAllUsers);
router.put("/:id/password", changePassword);
router.put("/engineer/:id", updateEngineer);
router.get("/engineer/:id", getEngineerByUser);

module.exports = router;
