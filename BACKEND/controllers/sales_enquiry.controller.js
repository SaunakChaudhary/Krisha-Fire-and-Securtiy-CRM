const SalesEnquiry = require("../models/sales_enquiry.model");

const createSalesEnquiry = async (req, res) => {
  try {
    const {
      company,
      status,
      customer,
      site,
      referealEngineer,
      typeOfWork,
      clientType,
      premisesType,
      systemType,
      salesPerson,
      adminRemarks,
      anticipatedStartDate,
      enquiryOn,
      enquiryBy,
      assignedOn,
      assignedTo,
      quotedOn,
      expectedOrderDate,
      expectedOrderValue,
      priority,
      wonDateTime,
      wonReason,
      orderValue,
      customerOrder,
      lostDateTime,
      lostReason,
      sourceLead,
    } = req.body;

    // Validate required fields
    const requiredFields = ["company", "status", "customer", "site"];

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Generate enquiry code
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePart = `${year}${month}${day}`;

    // Find the latest enquiry to get the next sequence number
    const latestEnquiry = await SalesEnquiry.findOne()
      .sort({ createdAt: -1 })
      .select("enquiry_code")
      .lean();

    let sequenceNumber = 1;
    if (latestEnquiry && latestEnquiry.enquiry_code) {
      const lastCodeParts = latestEnquiry.enquiry_code.split("-");
      if (lastCodeParts.length === 3) {
        const lastSequence = parseInt(lastCodeParts[2]);
        if (!isNaN(lastSequence)) {
          sequenceNumber = lastSequence + 1;
        }
      }
    }

    const enquiry_code = `ENQ-${datePart}-${String(sequenceNumber).padStart(
      3,
      "0"
    )}`;

    // Create new enquiry
    const newEnquiry = new SalesEnquiry({
      enquiry_code, // Add the auto-generated code
      company,
      status,
      customer,
      site,
      referealEngineer: referealEngineer || undefined,
      typeOfWork: typeOfWork || undefined,
      clientType: clientType || "Contractor",
      premisesType: premisesType || "Commercial property",
      systemType: systemType || undefined,
      salesPerson,
      adminRemarks: adminRemarks || undefined,

      // Dates
      anticipatedStartDate: anticipatedStartDate
        ? new Date(anticipatedStartDate)
        : undefined,
      enquiryOn: enquiryOn ? new Date(enquiryOn) : undefined,
      assignedOn: assignedOn ? new Date(assignedOn) : undefined,
      quotedOn: quotedOn ? new Date(quotedOn) : undefined,
      expectedOrderDate: expectedOrderDate
        ? new Date(expectedOrderDate)
        : undefined,
      wonDateTime: wonDateTime ? new Date(wonDateTime) : undefined,
      lostDateTime: lostDateTime ? new Date(lostDateTime) : undefined,

      // Other fields
      enquiryBy: enquiryBy || undefined,
      assignedTo: assignedTo || undefined,
      expectedOrderValue: expectedOrderValue || undefined,
      priority: priority || "Medium",
      wonReason: wonReason || undefined,
      orderValue: orderValue || undefined,
      customerOrder: customerOrder || undefined,
      lostReason: lostReason || undefined,
      sourceLead: sourceLead || undefined,
    });

    await newEnquiry.save();

    return res.status(201).json({
      message: "Sales enquiry created successfully",
      enquiry: newEnquiry,
    });
  } catch (error) {
    console.error("Error creating enquiry:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      message: "Server error while creating sales enquiry",
      error: error.message,
    });
  }
};

const getSalesEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const fetchSalesEnquiry = await SalesEnquiry.findById(id)
      .populate("company")
      .populate("site")
      .populate("customer")
      .populate("assignedTo")
      .populate("typeOfWork")
      .populate("systemType");

    return res.status(500).json(fetchSalesEnquiry);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" + error });
  }
};

const getSalesEnquiry = async (req, res) => {
  try {
    const fetchSalesEnquiry = await SalesEnquiry.find()
      .populate("company")
      .populate("site")
      .populate("customer")
      .populate("assignedTo")
      .populate("typeOfWork")
      .populate("systemType");

    return res.status(500).json(fetchSalesEnquiry);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" + error });
  }
};

const updateSalesEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Check if body exists and has data
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        message: "Request body is empty",
      });
    }

    // Validate required fields
    if (!body.status || !body.salesPerson) {
      return res.status(400).json({
        message: "Status and sales person are required fields",
      });
    }

    // Find the existing enquiry
    const existingEnquiry = await SalesEnquiry.findById(id);
    if (!existingEnquiry) {
      return res.status(404).json({ message: "Sales enquiry not found" });
    }

    // Prepare update object with fallback to existing values
    const updateData = {
      status: body.status,
      referealEngineer:
        body.referealEngineer || existingEnquiry.referealEngineer,
      typeOfWork: body.typeOfWork || existingEnquiry.typeOfWork,
      clientType: body.clientType || existingEnquiry.clientType,
      premisesType: body.premisesType || existingEnquiry.premisesType,
      systemType: body.systemType || existingEnquiry.systemType,
      salesPerson: body.salesPerson,
      adminRemarks: body.adminRemarks || existingEnquiry.adminRemarks,
      anticipatedStartDate: body.anticipatedStartDate
        ? new Date(body.anticipatedStartDate)
        : existingEnquiry.anticipatedStartDate,
      enquiryOn: body.enquiryOn
        ? new Date(body.enquiryOn)
        : existingEnquiry.enquiryOn,
      enquiryBy: body.enquiryBy || existingEnquiry.enquiryBy,
      assignedOn: body.assignedOn
        ? new Date(body.assignedOn)
        : existingEnquiry.assignedOn,
      assignedTo: body.assignedTo || existingEnquiry.assignedTo,
      quotedOn: body.quotedOn
        ? new Date(body.quotedOn)
        : existingEnquiry.quotedOn,
      expectedOrderDate: body.expectedOrderDate
        ? new Date(body.expectedOrderDate)
        : existingEnquiry.expectedOrderDate,
      expectedOrderValue:
        body.expectedOrderValue || existingEnquiry.expectedOrderValue,
      priority: body.priority || existingEnquiry.priority,
      wonDateTime: body.wonDateTime
        ? new Date(body.wonDateTime)
        : existingEnquiry.wonDateTime,
      wonReason: body.wonReason || existingEnquiry.wonReason,
      orderValue: body.orderValue || existingEnquiry.orderValue,
      customerOrder: body.customerOrder || existingEnquiry.customerOrder,
      lostDateTime: body.lostDateTime
        ? new Date(body.lostDateTime)
        : existingEnquiry.lostDateTime,
      lostReason: body.lostReason || existingEnquiry.lostReason,
      sourceLead: body.sourceLead || existingEnquiry.sourceLead,
    };

    // Update the enquiry
    const updatedEnquiry = await SalesEnquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      "company",
      "site",
      "customer",
      "assignedTo",
      "typeOfWork",
      "systemType",
    ]);

    return res.status(200).json({
      message: "Sales enquiry updated successfully",
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    console.error("Error updating enquiry:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      message: "Server error while updating sales enquiry",
      error: error.message,
    });
  }
};
module.exports = {
  createSalesEnquiry,
  getSalesEnquiry,
  updateSalesEnquiry,
  getSalesEnquiryById,
};
