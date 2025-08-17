const mongoose = require("mongoose");

const systemSchema = new mongoose.Schema(
  {
    systemCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
      match: [
        /^[A-Za-z0-9_-]+$/,
        "Only letters, numbers, hyphens and underscores are allowed",
      ],
    },
    systemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    referenceOnlySystem: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    productFilterGroup: {
      type: String,
      required: true,
      enum: [
        "Corrective Maintenance",
        "Equipment",
        "Monitoring Charge",
        "Preventative Maintenance",
      ],
    },
    alarmReportingCategory: {
      type: String,
      enum: ["Intruder", "Fire", "CCTV", "none"],
      default: "none",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

systemSchema.index({ systemName: 1 });
systemSchema.index({ productFilterGroup: 1 });

const System = mongoose.model("System", systemSchema);

module.exports = System;
