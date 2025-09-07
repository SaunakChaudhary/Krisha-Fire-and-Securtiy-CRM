const mongoose = require("mongoose");

const salesEnquirySchema = new mongoose.Schema(
  {
    enquiry_code: { type: String, unique: true, required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    status: { type: String, default: "New Assigned" },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
    referealEngineer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    typeOfWork: { type: mongoose.Schema.Types.ObjectId, ref: "ReferenceCode" },
    clientType: { type: String },
    premisesType: { type: String },
    systemType: { type: mongoose.Schema.Types.ObjectId, ref: "System" },
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminRemarks: { type: String },

    anticipatedStartDate: { type: Date },
    enquiryOn: { type: Date },
    enquiryBy: { type: String },
    assignedOn: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    quotedOn: { type: Date },
    expectedOrderDate: { type: Date },
    expectedOrderValue: { type: Number },
    priority: { type: String },
    wonDateTime: { type: Date },
    wonReason: { type: String },
    orderValue: { type: Number },
    customerOrder: { type: String },
    lostDateTime: { type: Date },
    lostReason: { type: String },
    sourceLead: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesEnquiry", salesEnquirySchema);