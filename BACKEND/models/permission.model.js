const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessType",
      required: true,
    },
    permissions: {
      "Dashboard": { type: Boolean, default: false },
      "Manage User": { type: Boolean, default: false },
      "Manage Company": { type: Boolean, default: false },
      "Manage Customer": { type: Boolean, default: false },
      "Manage Site": { type: Boolean, default: false },
      "Manage Sales Enquiry": { type: Boolean, default: false },
      "Manage Quotation": { type: Boolean, default: false },
      "Manage Job Costing": { type: Boolean, default: false },
      "Manage System Code": { type: Boolean, default: false },
      "Manage Call": { type: Boolean, default: false },
      "Manage Diary": { type: Boolean, default: false },
      "Manage Supplier": { type: Boolean, default: false },
      "Manage Stock": { type: Boolean, default: false },
      "Manage Purchase Order": { type: Boolean, default: false },
      "Manage Reports": { type: Boolean, default: false },
      "Manage Cabinet": { type: Boolean, default: false },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Permission", permissionSchema);
