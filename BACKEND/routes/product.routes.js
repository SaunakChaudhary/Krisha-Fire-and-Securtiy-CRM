const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByStatus,
  getProductsByManufacturer,
} = require("../controllers/product.controller");
const { upload } = require("../middleware/upload.js");

router.post("/", upload.single("upload_image"), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", upload.single("upload_image"), updateProduct);
router.delete("/:id", deleteProduct);
router.get("/:id/status", getProductsByStatus);
router.get("/:id/manufacturer", getProductsByManufacturer);

module.exports = router;
