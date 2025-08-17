const mongoose = require("mongoose");

const { Schema } = mongoose;

const siteSchema = new Schema(
  {
    site_code: {
      type: String,
      required: true,
      unique: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    site_name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Live", "Dead"],
      default: "New",
    },
    address_line_1: { type: String, required: true },
    address_line_2: { type: String },
    address_line_3: { type: String },
    address_line_4: { type: String },
    postcode: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    title: { type: String },
    contact_name: { type: String },
    contact_no: { type: String },
    contact_email: { type: String },
    position: { type: String },
    premises_type: {
      type: String,
      enum: [
        "COMMERCIAL_PROPERTY",
        "MANUFACTURING_INDUSTRY",
        "MULTIPLEX_INDUSTRY",
        "HOSPITAL",
        "other",
      ],
      required: true,
    },
    route: { type: String },
    distance: { type: Number },
    area: { type: String },
    sales_person: { type: String },
    admin_remarks: { type: String },
    site_remarks: { type: String },

    site_systems: [
      {
        system_id: {
          type: Schema.Types.ObjectId,
          ref: "System",
          required: true,
        },
        status: {
          type: String,
          enum: ["New", "Live", "Dead", "Cancelled"],
          default: "New",
        },
        date_of_sale: { type: Date },
        installed_by: {
          type: Schema.Types.ObjectId,
          ref: "User", 
        },
        date_of_install: { type: Date },
        takeover_date: { type: Date },
        preferred_technician: { type: String },
        rented: { type: Boolean, default: false },
        econtract_expiry_date: { type: Date },
        warranty_date: { type: Date },
        amc_start_date: { type: Date },
        amc_end_date: { type: Date },
        frequency: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Site", siteSchema);
