// routes/jobCostingRoutes.js
const express = require("express");
const router = express.Router();
const {
  addJobCosting,
  getJobCostings,
  getJobCostingById,
  updateJobCosting,
  deleteJobCosting,
} = require("../controllers/jobcosting.controller");

router.post("/", addJobCosting);
router.get("/", getJobCostings);
router.get("/:id", getJobCostingById);
router.put("/:id", updateJobCosting);
router.delete("/:id", deleteJobCosting);

module.exports = router;
