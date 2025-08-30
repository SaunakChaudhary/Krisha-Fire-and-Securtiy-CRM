const mongoose = require("mongoose");

const DeliveryChallanSchema = new mongoose.Schema(
  {
    challan_id: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId, // Link to Company collection
      ref: "Company",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId, // Link to Customer collection
      ref: "Customer",
      required: true,
    },
    site: {
      type: mongoose.Schema.Types.ObjectId, // Link to Site collection
      ref: "Site",
    },
    call_number: {
      type: mongoose.Schema.Types.ObjectId, // Link to Call collection
      ref: "Call",
    },
    delivery_date: {
      type: Date,
      required: true,
    },
    po_date: {
      type: Date,
    },
    reference_po_no: {
      type: String,
    },
    issued_by: {
      type: mongoose.Schema.Types.ObjectId, // Link to User collection
      ref: "User",
    },
    is_invoiced: {
      type: Boolean,
      default: false,
    },
    reference_invoice_number: {
      type: String,
    },
    remarks: {
      type: String,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        product_code: {
          type: String,
        },
        serial_number: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
        },
        obsolete: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryChallan", DeliveryChallanSchema);
