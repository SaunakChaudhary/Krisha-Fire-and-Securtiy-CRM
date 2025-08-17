const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotation.controller");

// Quotation routes
router
  .route("/")
  .post(quotationController.createQuotation)
  .get(quotationController.getAllQuotations);

router
  .route("/:id")
  .get(quotationController.getQuotationById)
  .put(quotationController.updateQuotation)
  .delete(quotationController.deleteQuotation);

module.exports = router;
