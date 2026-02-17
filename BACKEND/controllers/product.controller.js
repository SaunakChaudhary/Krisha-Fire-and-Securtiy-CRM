const Product = require("../models/product.model");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ReferenceCode = require("../models/reference.model");
const Supplier = require("../models/supplier.model");

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
          existingProduct.upload_image,
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

exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: "No product data received",
      });
    }

    // Preload reference data (performance improvement)
    const manufacturers = await ReferenceCode.find({});
    const productGroups = await ReferenceCode.find({});
    const suppliers = await Supplier.find({});

    const manufacturerMap = {};
    const productGroupMap = {};
    const supplierMap = {};

    manufacturers.forEach((m) => (manufacturerMap[m.code] = m._id));
    productGroups.forEach((g) => (productGroupMap[g.code] = g._id));
    suppliers.forEach((s) => (supplierMap[s.supplierCode] = s._id));

    const validProducts = [];
    const skipped = [];

    for (const row of products) {
      // REQUIRED FIELD CHECK
      if (!row.product_code || !row.product_name || !row.unit) {
        skipped.push({
          product_code: row.product_code,
          reason: "Missing required fields",
        });
        continue;
      }

      validProducts.push({
        product_code: row.product_code,
        product_name: row.product_name,
        HSN_No: row.HSN_No || null,
        SAC_NO: row.SAC_NO || null,

        manufacturer: manufacturerMap[row.manufacturer_code] || null,
        product_group: productGroupMap[row.product_group_code] || null,
        preferred_supplier: supplierMap[row.preferred_supplier_code] || null,

        specifications: row.specifications || null,
        unit: row.unit,

        GST: row.GST || 0,
        installation_GST: row.installation_GST || 0,

        obsolete_product: !!row.obsolete_product,

        units: row.units || 0,
        unit_description: row.unit_description || null,

        purchase_cost: row.purchase_cost || 0,
        average_cost: row.average_cost || 0,
        standard_cost: row.standard_cost || 0,

        standard_sale: row.standard_sale || 0,
        installation_sale: row.installation_sale || 0,
        maintenance_sale: row.maintenance_sale || 0,
        other_sale: row.other_sale || 0,

        labour_hours: row.labour_hours || 0,
        maintenance_hours: row.maintenance_hours || 0,
        commission_hours: row.commission_hours || 0,

        basic_specification_text: row.basic_specification_text || null,
        detailed_specification_text: row.detailed_specification_text || null,

        upload_image: "", // blank as requested
      });
    }

    if (!validProducts.length) {
      return res.status(400).json({
        message: "No valid products to import",
        skipped,
      });
    }

    // BULK INSERT (unordered → duplicates won’t break import)
    const inserted = await Product.insertMany(validProducts, {
      ordered: false,
    });

    return res.json({
      message: "Import completed",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err.message);

    // Duplicate key handling
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate product_code detected",
        error: err.keyValue,
      });
    }

    res.status(500).json({
      message: "Product import failed",
      error: err.message,
    });
  }
};
