const express = require("express");
const { upload } = require("../middleware/upload");
const {
  uploadCustomerDocument,
  getCustomerDocuments,
  deleteCustomerDocument,
} = require("../controllers/customerDocument.controller");

const router = express.Router();

router.post(
  "/customers/:customerId/documents",
  upload.single("file"),
  uploadCustomerDocument
);

router.get("/customers/:customerId/documents", getCustomerDocuments);

router.delete("/documents/:id", deleteCustomerDocument);

module.exports = router;
