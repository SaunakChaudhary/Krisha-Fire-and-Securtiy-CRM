const mongoose = require("mongoose");

const referenceCodeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "sourceLead",
        "salesEnquiryWon",
        "salesEnquiryLost",
        "callWaitingReason",
        "productGroup",
        "ManufacturerCode",
        "callType",
        "callReason",
        "TypeOfWork",
      ],
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

referenceCodeSchema.index({ category: 1, code: 1 }, { unique: true });

referenceCodeSchema.pre("save", function (next) {
  this.code = this.code.toUpperCase();
  next();
});

const ReferenceCode = mongoose.model("ReferenceCode", referenceCodeSchema);

module.exports = ReferenceCode;
