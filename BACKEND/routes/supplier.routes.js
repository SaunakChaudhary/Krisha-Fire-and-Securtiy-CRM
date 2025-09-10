const express = require("express");
const router = express.Router();
const {
  createSupplier,
  updateSupplier,
  getSuppliers,
  getSupplierById,
  bulkUploadSuppliers,
} = require("../controllers/supplier.controller");

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.post("/import", bulkUploadSuppliers);

module.exports = router;
