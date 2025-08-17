const express = require("express");
const router = express.Router();
const {
  createSalesEnquiry,
  getSalesEnquiry,
  updateSalesEnquiry,
  getSalesEnquiryById,
} = require("../controllers/sales_enquiry.controller");

router.post("/", createSalesEnquiry);
router.get("/", getSalesEnquiry);
router.get("/:id", getSalesEnquiryById);
router.put("/:id", updateSalesEnquiry);

module.exports = router;
