const DeliveryChallan = require("../models/deliveryChallan.model");
const Product = require("../models/product.model");

// 📌 Create a new Delivery Challan
const createDeliveryChallan = async (req, res) => {
  try {
    const { products, ...challanData } = req.body;

    // Validate products

    // Generate Delivery Challan ID in format: DC/YYYY/NN
    const currentYear = new Date().getFullYear();
    const challanCount = await DeliveryChallan.countDocuments({
      challan_id: { $regex: `^DC/${currentYear}/` }
    });
    const challanNumber = String(challanCount + 1).padStart(2, "0");
    challanData.challan_id = `DC/${currentYear}/${challanNumber}`;
    
    for (let item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      // Check stock availability
      if (product.units < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.product_name}`,
        });
      }

      // Reduce stock
      product.units -= item.quantity;
      await product.save();
    }

    // Save challan
    const deliveryChallan = new DeliveryChallan({
      ...challanData,
      products,
    });

    await deliveryChallan.save();
    res.status(201).json(deliveryChallan);
  } catch (error) {
    console.error("Error creating delivery challan:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// 📌 Get all challans
const getAllDeliveryChallans = async (req, res) => {
  try {
    const challans = await DeliveryChallan.find()
      .populate("company customer site call_number issued_by")
      .populate("products.product");
    res.status(200).json(challans);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// 📌 Get a challan by ID
const getDeliveryChallanById = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id)
      .populate("company customer site call_number issued_by")
      .populate("products.product");

    if (!challan) {
      return res.status(404).json({ message: "Delivery Challan not found" });
    }

    res.status(200).json(challan);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// 📌 Update challan (adjust stock if products change)
const updateDeliveryChallan = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);

    if (!challan) {
      return res.status(404).json({ message: "Delivery Challan not found" });
    }

    // Restore stock before updating
    for (let item of challan.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.units += item.quantity; // restore
        await product.save();
      }
    }

    const { products, ...updatedData } = req.body;

    // Deduct new stock
    for (let item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }
      if (product.units < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.product_name}`,
        });
      }
      product.units -= item.quantity;
      await product.save();
    }

    challan.set({
      ...updatedData,
      products,
    });

    await challan.save();
    res.status(200).json(challan);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// 📌 Delete challan (restore stock)
const deleteDeliveryChallan = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findById(req.params.id);

    if (!challan) {
      return res.status(404).json({ message: "Delivery Challan not found" });
    }

    // Restore stock
    for (let item of challan.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.units += item.quantity;
        await product.save();
      }
    }

    await challan.deleteOne();
    res.status(200).json({ message: "Delivery Challan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan,
};
