const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  customer_code: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  GST_No: { type: String },
  GST_Exempt: { type: Boolean, default: false },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  
  // Status: lead or customer
  status: { type: String, enum: ["lead", "customer"], required: true },

  // Contact Person Details
  Title: { type: String },
  Contact_person: { type: String },
  contact_person_secondary: { type: String },
  contact_person_designation: { type: String },
  contact_person_email: { type: String },
  contact_person_mobile: { type: String },

  // Address (nested)
  address: {
    line1: { type: String },
    line2: { type: String },
    line3: { type: String },
    line4: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postcode: { type: String },
  },

  // Communication
  email: { type: String },
  telephone_no: { type: String },
  mobile_no: { type: String },

  // Bank Details
  bank_name: { type: String },
  account_number: { type: String },
  IFSC: { type: String },
  bank_address: { type: String },

  // Payment & Credit Details
  Payment_method: { type: String },
  currency: { type: String, default: "INR" },
  credit_limit: { type: Number },
  credit_days: { type: Number },
  creditCharge: { type: Number, default: 0 },
  credit_withdrawn: { type: Boolean, default: false },
  payment_due_EOM_Terms: { type: String },

  // Lead-related fields
  lead_source: { type: String },
  industry_type: { type: String },
  next_follow_up_date: { type: Date },
  is_converted: { type: Boolean, default: false },

  pan_no: { type: String },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Customer", customerSchema);