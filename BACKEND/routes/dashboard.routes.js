const express = require("express");
const router = express.Router();
const { dashboarddDetails } = require("../controllers/dashboard.controller");

router.get("/details", dashboarddDetails);

module.exports = router;
