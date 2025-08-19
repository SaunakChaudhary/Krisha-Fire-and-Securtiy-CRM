const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    quotation_id: { type: String, required: true, unique: true },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    sales_enquiry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesEnquiry",
      required: false,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    terms_and_conditions: {
      type: String,
      default: "",
    },
    include_in_pdf: {
      sr_no: { type: Boolean, default: true },
      item_description: { type: Boolean, default: true },
      part_code: { type: Boolean, default: true },
      make: { type: Boolean, default: true },
      quantity: { type: Boolean, default: true },
      unit: { type: Boolean, default: true },
      gst_percent: { type: Boolean, default: true },
      specification: { type: Boolean, default: true },
    },
    system_details: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "System",
      required: false,
    },
    product_details: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        description: { type: String },
        manufacturer: { type: String },
        gst_percent: { type: Number, default: 0 },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total_amount: { type: Number, required: true },
        installation_price: { type: Number, default: 0 },
        installation_gst_percent: { type: Number, default: 0 },
        installation_amount: { type: Number, default: 0 },
        narration: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quotation", quotationSchema);
