const express = require("express");
const router = express.Router();
const { dashboardDetails } = require("../controllers/dashboard.controller");

router.get("/details", dashboardDetails);

module.exports = router;
