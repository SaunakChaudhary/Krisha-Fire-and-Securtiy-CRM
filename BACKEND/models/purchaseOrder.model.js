const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    supplier_name: String,
    address: String,
    contact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    mobile_no: String,
    on_order: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },

    account_reference: String,
    order_reference: String,

    call_id: { type: mongoose.Schema.Types.ObjectId, ref: "Call" },
    quotation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    date: { type: Date, default: Date.now },
    due_date: Date,
    placed_by: String,
    authorised_by: String,
    notes: String,

    // Delivery
    deliver_to: String,
    delivery_address: String,
    delivery_instructions: String,
    delivery_date: Date,
    change_delivery_site_id: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },

    // Terms
    other_terms: String,

    // Product details
    products: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: String,
        manufacturer: String,
        gst_percent: Number,
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        total_amount: { type: Number, default: 0 },
        required_qty: Number, // For "Check Stock & Create PO"
        available_stock: Number // For "Check Stock & Create PO"
      }
    ],

    // Totals
    total_amount: { type: Number, default: 0 },
    gst_inclusive: { type: Number, default: 0 },
    gst_adjust: { type: Number, default: 0 },
    gross_amount: { type: Number, default: 0 },

    // Settlement
    discount_percent: Number,
    settlement_days: Number,
    mark_as_confirmation_order: { type: Boolean, default: false },

    // Auto link
    auto_created: { type: Boolean, default: false } // For smart button automation
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
