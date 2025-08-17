const Customer = require("../models/customer.model");
const mongoose = require("mongoose");

const createCustomer = async (req, res) => {
  try {
    const {
      customer_name,
      GST_No,
      GST_Exempt = false,
      status,
      Title,
      Contact_person,
      contact_person_secondary,
      contact_person_designation,
      contact_person_email,
      contact_person_mobile,
      address,
      email,
      telephone_no,
      mobile_no,
      bank_name,
      account_number,
      IFSC,
      bank_address,
      Payment_method,
      currency = "INR",
      credit_limit,
      credit_days,
      creditCharge = 0,
      credit_withdrawn = false,
      payment_due_EOM_Terms,
      lead_source,
      industry_type,
      next_follow_up_date,
      is_converted = false,
      pan_no,
      company_id,
    } = req.body;

    // Required field validation
    if (!customer_name || !status) {
      return res.status(400).json({ error: "Customer name and status are required" });
    }

    // Auto-generate customer code
    const latestCustomer = await Customer.findOne().sort({ createdAt: -1 });
    let nextCodeNumber = 1;

    if (latestCustomer && latestCustomer.customer_code) {
      const match = latestCustomer.customer_code.match(/\d+$/);
      if (match) {
        nextCodeNumber = parseInt(match[0], 10) + 1;
      }
    }

    const customer_code = `CUST-${nextCodeNumber.toString().padStart(4, "0")}`;

    // Create customer
    const customer = await Customer.create({
      customer_code,
      customer_name,
      GST_No,
      GST_Exempt,
      status,
      Title,
      Contact_person,
      contact_person_secondary,
      contact_person_designation,
      contact_person_email,
      contact_person_mobile,
      address,
      email,
      telephone_no,
      mobile_no,
      bank_name,
      account_number,
      IFSC,
      bank_address,
      Payment_method,
      currency,
      credit_limit,
      credit_days,
      creditCharge,
      credit_withdrawn,
      payment_due_EOM_Terms,
      lead_source: status === "lead" ? lead_source : undefined,
      industry_type,
      next_follow_up_date: status === "lead" ? next_follow_up_date : undefined,
      is_converted,
      pan_no,
      company_id: company_id ? new mongoose.Types.ObjectId(company_id) : undefined,
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { status, company_id } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (company_id) filter.company_id = new mongoose.Types.ObjectId(company_id);

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .populate("company_id", "company_name");

    return res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const customer = await Customer.findById(id).populate(
      "company_id",
      "company_name"
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const {
      customer_name,
      GST_No,
      GST_Exempt,
      status,
      Title,
      Contact_person,
      contact_person_secondary,
      contact_person_designation,
      contact_person_email,
      contact_person_mobile,
      address,
      email,
      telephone_no,
      mobile_no,
      bank_name,
      account_number,
      IFSC,
      bank_address,
      Payment_method,
      currency,
      credit_limit,
      credit_days,
      creditCharge,
      credit_withdrawn,
      payment_due_EOM_Terms,
      lead_source,
      industry_type,
      next_follow_up_date,
      is_converted,
      pan_no,
      company_id,
    } = req.body;

    // Required field validation
    if (!customer_name || !status) {
      return res.status(400).json({ error: "Customer name and status are required" });
    }

    const updateData = {
      customer_name,
      GST_No,
      GST_Exempt,
      status,
      Title,
      Contact_person,
      contact_person_secondary,
      contact_person_designation,
      contact_person_email,
      contact_person_mobile,
      address,
      email,
      telephone_no,
      mobile_no,
      bank_name,
      account_number,
      IFSC,
      bank_address,
      Payment_method,
      currency,
      credit_limit,
      credit_days,
      creditCharge,
      credit_withdrawn,
      payment_due_EOM_Terms,
      pan_no,
      company_id: company_id ? new mongoose.Types.ObjectId(company_id) : undefined,
    };

    // Only update lead-specific fields if status is lead
    if (status === "lead") {
      updateData.lead_source = lead_source;
      updateData.industry_type = industry_type;
      updateData.next_follow_up_date = next_follow_up_date;
      updateData.is_converted = is_converted;
    } else {
      updateData.lead_source = undefined;
      updateData.industry_type = undefined;
      updateData.next_follow_up_date = undefined;
      updateData.is_converted = undefined;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("company_id", "company_name");

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};