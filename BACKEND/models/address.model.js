const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    address_line1: { type: String, required: true },
    address_line2: { type: String },
    address_line3: { type: String },
    address_line4: { type: String },
    postcode: { type: String },
    email: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    telephone_no: { type: String },
    mobile_no: { type: String },
    alternative_mno: { type: String },
    contact_person: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
