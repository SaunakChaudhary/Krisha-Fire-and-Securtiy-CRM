const Product = require("../models/product.model");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (
      !productData.product_code ||
      !productData.product_name ||
      !productData.unit
    ) {
      return res.status(400).json({
        success: false,
        message: "Product code, name, and unit are required fields",
      });
    }

    // Check if product code already exists
    const existingProduct = await Product.findOne({
      product_code: productData.product_code,
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this code already exists",
      });
    }

    // Add logo path if image is uploaded
    if (req.file && req.file.path) {
      productData.upload_image = req.file.path;
    }
    console.log(productData.upload_image);

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query = {
        $or: [
          { product_code: { $regex: search, $options: "i" } },
          { product_name: { $regex: search, $options: "i" } },
          { HSN_No: { $regex: search, $options: "i" } },
        ],
      };
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("manufacturer", "code description name")
      .populate("product_group", "code description name")
      .populate("preferred_supplier", "name code");

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      pagination: {
        total: totalProducts,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id)
      .populate("manufacturer", "code name description")
      .populate("product_group", "code name description")
      .populate("preferred_supplier", "supplierName supplierCode");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Products by Id
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (
      updateData.product_code &&
      updateData.product_code !== existingProduct.product_code
    ) {
      const duplicate = await Product.findOne({
        product_code: updateData.product_code,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Product code already exists" });
      }
    }

    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ success: false, message: "Only image files are allowed" });
      }

      if (existingProduct.upload_image) {
        const oldPath = path.join(
          __dirname,
          "..",
          existingProduct.upload_image
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      updateData.upload_image = req.file.path;
    } else {
      updateData.upload_image = existingProduct.upload_image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("manufacturer", "code description")
      .populate("product_group", "code description")
      .populate("preferred_supplier", "name code");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete Products by Id
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Products by Status
exports.getProductsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const isObsolete = status === "obsolete";

    const products = await Product.find({ obsolete_product: isObsolete })
      .populate("manufacturer", "code description")
      .populate("product_group", "code description")
      .populate("preferred_supplier", "name code");

    res.status(200).json({
      success: true,
      message: `Fetched ${status} products successfully`,
      data: products,
    });
  } catch (error) {
    console.error(`Error fetching ${status} products:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Products by Manufacturer
exports.getProductsByManufacturer = async (req, res) => {
  try {
    const { manufacturerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manufacturer ID",
      });
    }

    const products = await Product.find({ manufacturer: manufacturerId })
      .populate("manufacturer", "code description")
      .populate("product_group", "code description")
      .populate("preferred_supplier", "name code");

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products by manufacturer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
