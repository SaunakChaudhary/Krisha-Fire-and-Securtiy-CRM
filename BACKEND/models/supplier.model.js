const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    address_line_1: { type: String, required: true },
    address_line_2: String,
    address_line_3: String,
    address_line_4: String,
    postCode: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    title: { type: String, enum: ["Mr", "Mrs", "Ms", "Dr", ""], default: "" },
    contact_person: { type: String, required: true },
    position: String,
    email: { type: String, required: true, match: /.+\@.+\..+/ },
    telephoneNo: String,
    mobileNo: { type: String, required: true },
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    bankAddress: String,
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
  },
  { _id: false }
);

const termsSchema = new mongoose.Schema(
  {
    creditLimit: Number,
    tradeDiscount: Number,
    settlementDiscount: Number,
    settlementDays: Number,
    minOrderValue: Number,
    defaultPurchaseOrderSubmissionMethod: {
      type: String,
      enum: ["Email", "Portal", "Fax", "Post"],
      default: "Email",
    },
  },
  { _id: false }
);

const subcontractorSchema = new mongoose.Schema(
  {
    isSubcontractor: { type: Boolean, default: false },
    hasInsuranceDocuments: { type: Boolean, default: false },
    hasHealthSafetyPolicy: { type: Boolean, default: false },
    insuranceExpirationDate: {
      type: Date,
      required: function () {
        return this.hasInsuranceDocuments;
      },
    },
    healthSafetyPolicyExpirationDate: {
      type: Date,
      required: function () {
        return this.hasHealthSafetyPolicy;
      },
    },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    gstExempt: { type: Boolean, default: false },
    currencyCode: {
      type: String,
      enum: [
        "INR",
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CNY",
        "AED",
        "SGD",
      ],
      default: "INR",
      required: true,
    },
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema({
  supplierCode: { type: String, required: true, unique: true },
  supplierName: { type: String, required: true },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
    required: true,
  },
  gstNo: String,
  registeredAddress: { type: addressSchema, required: true },
  communicationAddress: { type: addressSchema, required: true },
  sameAsRegistered: { type: Boolean, default: false },
  contacts: {
    type: [contactSchema],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least 1 contact"],
  },
  bankDetails: { type: bankDetailsSchema, required: true },
  terms: { type: termsSchema, required: true },
  subcontractor: { type: subcontractorSchema, default: () => ({}) },
  analysis: { type: analysisSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Validate at least 1 contact
function arrayLimit(val) {
  return val.length >= 1;
}

// Update communicationAddress if sameAsRegistered is true
supplierSchema.pre("save", function (next) {
  if (this.sameAsRegistered) {
    this.communicationAddress = { ...this.registeredAddress };
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Supplier", supplierSchema);
