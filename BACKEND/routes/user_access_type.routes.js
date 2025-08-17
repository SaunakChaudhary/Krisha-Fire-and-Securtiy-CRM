const express = require("express");
const router = express.Router();
const {
  createAccessType,
  editAccessType,
  getAccessTypes
} = require("../controllers/user_access_type.controller");

router.post("/", createAccessType);
router.put("/:id", editAccessType);
router.get("/", getAccessTypes);

module.exports = router;
