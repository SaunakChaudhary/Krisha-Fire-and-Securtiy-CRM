const Supplier = require("../models/supplier.model");

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateMobile = (mobile) => {
  return /^[0-9]{10,15}$/.test(mobile);
};

const validateIFSC = (ifsc) => {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};

const validateSupplierData = (data) => {
  const errors = [];

  // Basic Information Validation
  if (!data.supplierName || data.supplierName.trim().length < 2) {
    errors.push("Supplier name is required and must be at least 2 characters");
  }

  if (!["Active", "Inactive", "Pending Approval"].includes(data.status)) {
    errors.push("Invalid status value");
  }

  if (!data.gstNo) {
    errors.push("Invalid GST number format");
  }

  // Address Validation
  const validateAddress = (address, prefix) => {
    if (!address.address_line_1 || address.address_line_1.trim().length < 5) {
      errors.push(`${prefix} Address Line 1 is required (min 5 chars)`);
    }
    if (!address.postCode || address.postCode.trim().length < 3) {
      errors.push(`${prefix} Post Code is required`);
    }
    if (!address.country || address.country.trim().length < 2) {
      errors.push(`${prefix} Country is required`);
    }
    if (!address.state || address.state.trim().length < 2) {
      errors.push(`${prefix} State is required`);
    }
    if (!address.city || address.city.trim().length < 2) {
      errors.push(`${prefix} City is required`);
    }
  };

  validateAddress(data.registeredAddress, "Registered");
  if (!data.sameAsRegistered) {
    validateAddress(data.communicationAddress, "Communication");
  }

  // Contacts Validation
  if (!data.contacts || data.contacts.length === 0) {
    errors.push("At least one contact is required");
  } else {
    data.contacts.forEach((contact, index) => {
      if (!contact.contact_person || contact.contact_person.trim().length < 2) {
        errors.push(`Contact ${index + 1}: Person name is required`);
      }
      if (!contact.email || !validateEmail(contact.email)) {
        errors.push(`Contact ${index + 1}: Valid email is required`);
      }
      if (!contact.mobileNo || !validateMobile(contact.mobileNo)) {
        errors.push(
          `Contact ${index + 1}: Valid mobile number is required (10-15 digits)`
        );
      }
    });
  }

  // Bank Details Validation
  if (
    !data.bankDetails.bankName ||
    data.bankDetails.bankName.trim().length < 2
  ) {
    errors.push("Bank name is required");
  }
  if (
    !data.bankDetails.accountNumber ||
    data.bankDetails.accountNumber.trim().length < 5
  ) {
    errors.push("Bank account number is required");
  }
  if (!data.bankDetails.ifsc || !validateIFSC(data.bankDetails.ifsc)) {
    errors.push("Valid IFSC code is required");
  }

  // Subcontractor Validation
  if (data.subcontractor.isSubcontractor) {
    if (
      data.subcontractor.hasInsuranceDocuments &&
      !data.subcontractor.insuranceExpirationDate
    ) {
      errors.push(
        "Insurance expiration date is required when insurance documents are provided"
      );
    }
    if (
      data.subcontractor.hasHealthSafetyPolicy &&
      !data.subcontractor.healthSafetyPolicyExpirationDate
    ) {
      errors.push(
        "Health & safety policy expiration date is required when policy is provided"
      );
    }
  }

  return errors;
};

const createSupplier = async (req, res) => {
  const validationErrors = validateSupplierData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: validationErrors,
    });
  }

  try {
    if (req.body.sameAsRegistered) {
      req.body.communicationAddress = { ...req.body.registeredAddress };
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePart = `${yyyy}${mm}${dd}`;

    // Find the latest supplier created today to increment the sequence
    const lastSupplier = await Supplier.findOne({
      supplierCode: { $regex: `^SUP-${datePart}-` },
    })
      .sort({ createdAt: -1 })
      .lean();

    let sequence = 1;
    if (lastSupplier && lastSupplier.supplierCode) {
      const match = lastSupplier.supplierCode.match(/SUP-\d{8}-(\d{4})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }
    const supplierCode = `SUP-${datePart}-${String(sequence).padStart(4, "0")}`;
    req.body.supplierCode = supplierCode;
    const supplier = await Supplier.create(req.body);
    res.status(201).json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Supplier with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server Error: " + err.message,
    });
  }
};

const updateSupplier = async (req, res) => {
  const validationErrors = validateSupplierData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: validationErrors,
    });
  }

  try {
    if (req.body.sameAsRegistered) {
      req.body.communicationAddress = { ...req.body.registeredAddress };
    }

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
      message: "Supplier updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server Error: " + err.message,
    });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const suppliers = await Supplier.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Supplier.countDocuments(filter);

    res.json({
      success: true,
      count: suppliers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: suppliers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server Error: " + err.message,
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server Error: " + err.message,
    });
  }
};

const bulkUploadSuppliers = async (req, res) => {
  try {
    const suppliersData = req.body;

    if (!Array.isArray(suppliersData) || suppliersData.length === 0) {
      return res.status(400).json({ message: "Invalid or empty data" });
    }

    const createdSuppliers = [];
    const errors = [];

    // Format today's date as YYYYMMDD
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Get last supplier created today
    const lastSupplier = await Supplier.findOne({
      supplierCode: { $regex: `^SUP-${datePart}-` },
    })
      .sort({ createdAt: -1 })
      .lean();

    let sequence = 1;
    if (lastSupplier && lastSupplier.supplierCode) {
      const match = lastSupplier.supplierCode.match(/SUP-\d{8}-(\d{4})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    for (let i = 0; i < suppliersData.length; i++) {
      const data = suppliersData[i];
      try {
        // Auto-generate supplier code
        const supplierCode = `SUP-${datePart}-${String(sequence).padStart(
          4,
          "0"
        )}`;
        sequence++;
                
        const supplier = new Supplier({
          supplierCode,
          supplierName: data.supplierName,
          status: data.status || "Active",
          gstNo: data.gstNo || "",

          registeredAddress: {
            address_line_1: data.registeredAddress.address_line_1,
            address_line_2: data.registeredAddress.address_line_2,
            address_line_3: data.registeredAddress.address_line_3,
            address_line_4: data.registeredAddress.address_line_4,
            postCode: data.registeredAddress.postCode,
            country: data.registeredAddress.country,
            state: data.registeredAddress.state,
            city: data.registeredAddress.city,
          },

          communicationAddress: {
            address_line_1: data.communicationAddress.address_line_1,
            address_line_2: data.communicationAddress.address_line_2,
            address_line_3: data.communicationAddress.address_line_3,
            address_line_4: data.communicationAddress.address_line_4,
            postCode: data.communicationAddress.postCode,
            country: data.communicationAddress.country,
            state: data.communicationAddress.state,
            city: data.communicationAddress.city,
          },

          sameAsRegistered: data.sameAsRegistered || false,

          contacts:
            data.contacts?.map((c) => ({
              title: c.title,
              contact_person: c.contact_person,
              position: c.position,
              email: c.email,
              telephoneNo: c.telephoneNo,
              mobileNo: c.mobileNo,
            })) || [],

          bankDetails: {
            bankName: data.bankDetails.bankName,
            bankAddress: data.bankDetails.bankAddress,
            accountNumber: data.bankDetails.accountNumber,
            ifsc: data.bankDetails.ifsc,
          },

          terms: {
            creditLimit: data.creditLimit,
            tradeDiscount: data.tradeDiscount,
            settlementDiscount: data.settlementDiscount,
            settlementDays: data.settlementDays,
            minOrderValue: data.minOrderValue,
            defaultPurchaseOrderSubmissionMethod:
              data.defaultPurchaseOrderSubmissionMethod || "Email",
          },

          subcontractor: {
            isSubcontractor: data.isSubcontractor,
            hasInsuranceDocuments: data.hasInsuranceDocuments,
            hasHealthSafetyPolicy: data.hasHealthSafetyPolicy,
            insuranceExpirationDate: data.insuranceExpirationDate,
            healthSafetyPolicyExpirationDate:
              data.healthSafetyPolicyExpirationDate,
          },

          analysis: {
            gstExempt: data.gstExempt || false,
            currencyCode: data.currencyCode || "INR",
          },
        });

        const savedSupplier = await supplier.save();
        createdSuppliers.push(savedSupplier);
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err.message,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: "Partial success",
        inserted: createdSuppliers.length,
        failed: errors.length,
        errors,
      });
    }

    res.status(201).json({
      message: "All suppliers uploaded successfully",
      count: createdSuppliers.length,
    });
  } catch (error) {
    console.error("Bulk upload suppliers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createSupplier,
  updateSupplier,
  getSuppliers,
  getSupplierById,
  bulkUploadSuppliers,
};
