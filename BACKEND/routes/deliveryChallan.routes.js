const express = require("express");
const {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan,
} = require("../controllers/deliverychallan.controller");

const router = express.Router();

// Routes
router.post("/", createDeliveryChallan);        // Create challan
router.get("/", getAllDeliveryChallans);        // Get all challans
router.get("/:id", getDeliveryChallanById);     // Get challan by ID
router.put("/:id", updateDeliveryChallan);      // Update challan
router.delete("/:id", deleteDeliveryChallan);   // Delete challan

module.exports = router;
