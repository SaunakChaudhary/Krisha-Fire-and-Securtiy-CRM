const Quotation = require("../models/quotation.model");
const Company = require("../models/company.model");
const Customer = require("../models/customer.model");
const Site = require("../models/site.model");
const System = require("../models/system.model");
const Product = require("../models/product.model");

// Create a new quotation
exports.createQuotation = async (req, res) => {
  try {
    const { company_id, customer_id, site_id, product_details } = req.body;

    // Validation (your existing checks)
    if (!company_id || !customer_id || !site_id) {
      return res.status(400).json({
        success: false,
        message: "Company, customer, and site references are required",
      });
    }

    if (
      !product_details ||
      !Array.isArray(product_details) ||
      product_details.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    // Reference checks (same as your code)...
    const companyExists = await Company.findById(company_id);
    if (!companyExists)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const siteExists = await Site.findById(site_id);
    if (!siteExists)
      return res
        .status(404)
        .json({ success: false, message: "Site not found" });

    if (req.body.system_details) {
      const systemExists = await System.findById(req.body.system_details);
      if (!systemExists)
        return res
          .status(404)
          .json({ success: false, message: "System not found" });
    }

    // Product validations (same as your loop)...
    for (const product of product_details) {
      // (keep your existing checks here)
    }

    // ======== Generate Unique Quotation ID ========
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

    const countForToday = await Quotation.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });

    const newNumber = (countForToday + 1).toString().padStart(4, "0"); // 0001
    const quotation_id = `QTN-${dateStr}-${newNumber}`;

    // Create the quotation
    const quotation = new Quotation({
      ...req.body,
      quotation_id, // attach the generated ID
    });

    await quotation.save();

    res.status(201).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("company_id")
      .populate("customer_id")
      .populate("site_id")
      .populate("system_details")
      .populate("product_details.product_id");

    res.status(200).json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single quotation by ID
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate("company_id")
      .populate("customer_id")
      .populate("site_id")
      .populate("system_details")
      .populate("product_details.product_id");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a quotation
exports.updateQuotation = async (req, res) => {
  try {
    // Validate required fields if they are being updated
    if (req.body.company_id) {
      const companyExists = await Company.findById(req.body.company_id);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }
    }

    if (req.body.customer_id) {
      const customerExists = await Customer.findById(req.body.customer_id);
      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    if (req.body.site_id) {
      const siteExists = await Site.findById(req.body.site_id);
      if (!siteExists) {
        return res.status(404).json({
          success: false,
          message: "Site not found",
        });
      }
    }

    if (req.body.system_details) {
      const systemExists = await System.findById(req.body.system_details);
      if (!systemExists) {
        return res.status(404).json({
          success: false,
          message: "System not found",
        });
      }
    }

    // Validate product_details if being updated
    if (req.body.product_details) {
      if (
        !Array.isArray(req.body.product_details) ||
        req.body.product_details.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one product is required",
        });
      }

      for (const product of req.body.product_details) {
        if (
          !product.product_id ||
          !product.quantity ||
          !product.price ||
          !product.total_amount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each product must have product_id, quantity, price, and total_amount",
          });
        }

        const productExists = await Product.findById(product.product_id);
        if (!productExists) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${product.product_id} not found`,
          });
        }

        // Validate numeric fields
        if (isNaN(product.quantity) || product.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: "Quantity must be a positive number",
          });
        }

        if (isNaN(product.price) || product.price < 0) {
          return res.status(400).json({
            success: false,
            message: "Price must be a non-negative number",
          });
        }

        if (isNaN(product.total_amount) || product.total_amount < 0) {
          return res.status(400).json({
            success: false,
            message: "Total amount must be a non-negative number",
          });
        }

        if (
          (product.gst_percent && isNaN(product.gst_percent)) ||
          product.gst_percent < 0 ||
          product.gst_percent > 100
        ) {
          return res.status(400).json({
            success: false,
            message: "GST percent must be between 0 and 100",
          });
        }

        if (
          product.installation_price &&
          (isNaN(product.installation_price) || product.installation_price < 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "Installation price must be a non-negative number",
          });
        }

        if (
          product.installation_gst_percent &&
          (isNaN(product.installation_gst_percent) ||
            product.installation_gst_percent < 0 ||
            product.installation_gst_percent > 100)
        ) {
          return res.status(400).json({
            success: false,
            message: "Installation GST percent must be between 0 and 100",
          });
        }

        if (
          product.installation_amount &&
          (isNaN(product.installation_amount) ||
            product.installation_amount < 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "Installation amount must be a non-negative number",
          });
        }
      }
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("company_id")
      .populate("customer_id")
      .populate("site_id")
      .populate("system_details")
      .populate("product_details.product_id");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
