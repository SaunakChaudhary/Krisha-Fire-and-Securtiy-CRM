const { default: mongoose } = require("mongoose");
const PurchaseOrder = require("../models/purchaseOrder.model");
const Product = require("../models/product.model");

exports.createPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrderData = req.body;
    const date = new Date();
    const year = date.getFullYear();
    const count = (await PurchaseOrder.countDocuments()) + 1;
    const serial = count.toString().padStart(2, "0");

    // Generate unique PO number
    purchaseOrderData.PurchaseOrderNumber = `PO/${year}/${serial}`;

    // ---- STOCK HANDLING ----
    if (
      Array.isArray(purchaseOrderData.products) &&
      purchaseOrderData.products.length > 0
    ) {
      const bulkUpdates = purchaseOrderData.products.map(
        ({ product_id, quantity }) => ({
          updateOne: {
            filter: { _id: product_id },
            update: { $inc: { units: quantity } }, // ✅ use units instead of stock
          },
        })
      );

      await Product.bulkWrite(bulkUpdates);
    }

    // Validate placed_by
    if (
      !purchaseOrderData.placed_by ||
      !mongoose.Types.ObjectId.isValid(purchaseOrderData.placed_by)
    ) {
      delete purchaseOrderData.placed_by;
    }

    // Save Purchase Order
    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({
      message: "Failed to create purchase order",
      error: error.message,
    });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate("company_id")
      .populate("supplier_id")
      .populate("deliver_to")
      .populate("call_id")
      .populate("placed_by")
      .exec();

    res.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({
      message: "Failed to fetch purchase orders",
      error: error.message,
    });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const poId = req.params.id;
    const purchaseOrder = await PurchaseOrder.findById(poId)
      .populate("company_id")
      .populate("supplier_id")
      .populate("deliver_to")
      .populate("call_id")
      .populate("placed_by")
      .exec();

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({
      message: "Failed to fetch purchase order",
      error: error.message,
    });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const poId = req.params.id;
    const updateData = req.body;

    // Validate placed_by
    if (!updateData.placed_by || !mongoose.Types.ObjectId.isValid(updateData.placed_by)) {
      delete updateData.placed_by;
    }

    // Find existing purchase order
    const existingPO = await PurchaseOrder.findById(poId);
    if (!existingPO) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    // ---- STOCK HANDLING ----
    if (Array.isArray(updateData.products) && updateData.products.length > 0) {
      // Revert old stock
      const revertStockOps = existingPO.products
        .filter(p => p.product_id) // ensure product_id exists
        .map(({ product_id, quantity }) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(product_id) },
            update: { $inc: { units: -quantity } }
          }
        }));

      // Apply new stock
      const newStockOps = updateData.products
        .filter(p => p.product_id && mongoose.Types.ObjectId.isValid(p.product_id))
        .map(({ product_id, quantity }) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(product_id) },
            update: { $inc: { units: quantity } }
          }
        }));

      if (revertStockOps.length > 0 || newStockOps.length > 0) {
        await Product.bulkWrite([...revertStockOps, ...newStockOps]);
      }
    }

    // ---- UPDATE PURCHASE ORDER ----
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      poId,
      updateData,
      { new: true }
    );

    res.json(purchaseOrder);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    res.status(500).json({
      message: "Failed to update purchase order",
      error: error.message,
    });
  }
};



exports.deletePurchaseOrder = async (req, res) => {
  try {
    const poId = req.params.id;
    const result = await PurchaseOrder.findByIdAndDelete(poId);

    if (!result) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    res.status(500).json({
      message: "Failed to delete purchase order",
      error: error.message,
    });
  }
};
