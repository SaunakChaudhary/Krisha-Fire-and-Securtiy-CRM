const mongoose = require("mongoose");
const { Schema } = mongoose;

const CallSchema = new Schema(
  {
    call_number: {
      type: String,
      required: true,
      unique: true,
    },
    site_id: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    site_system: {
      type: Schema.Types.ObjectId,
      ref: "System",
      required: true,
    },
    call_type: {
      type: Schema.Types.ObjectId,
      ref: "WorkType",
      required: true,
    },
    call_reason: {
      type: Schema.Types.ObjectId,
      ref: "ReferenceCode",
      required: true,
    },
    waiting: {
      type: Boolean,
      default: false,
    },
    call_waiting_reason: {
      type: Schema.Types.ObjectId,
      ref: "ReferenceCode",
    },
    chargable: {
      type: Boolean,
      default: false,
    },
    invoiced: {
      type: Boolean,
      default: false,
    },
    bill_on_maintenance: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      default: Date.now,
    },
    // Log Info
    logged_date: {
      type: Date,
      default: Date.now,
    },
    logged_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caller_name: {
      type: String,
    },
    caller_number: {
      type: String,
    },
    caller_email: {
      type: String,
    },
    next_action: {
      type: Date,
      default: Date.now,
    },
    // Assign
    engineer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assign_date: {
      type: Date,
    },
    // Admin Fields
    invoice_no: {
      type: String,
    },
    invoice_date: {
      type: Date,
    },
    invoice_value: {
      type: Number,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      default:"open"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Call", CallSchema);
