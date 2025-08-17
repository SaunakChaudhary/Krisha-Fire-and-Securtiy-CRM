const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    company_code: { type: String, required: true, unique: true },
    company_name: { type: String, required: true },
    contact_name: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    currency: { type: String },
    GST_No: { type: String },
    primary_company: { type: Boolean, default: false },
    logo: { type: String },
    registered_address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    communication_address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    same_as_registered_address: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
