const mongoose = require("mongoose");

const jobCostingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
    },

    // List of products with cost details
    product_list: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        description: { type: String },
        quantity: { type: Number, required: true },
        material_unit_price: { type: Number, default: 0 },
        material_total_price: { type: Number, default: 0 },
        installation_unit_price: { type: Number, default: 0 },
        installation_total_price: { type: Number, default: 0 },
      },
    ],

    // Totals
    total_material_cost: { type: Number, default: 0 },
    total_installation_cost: { type: Number, default: 0 },
    basic_product_cost: { type: Number, default: 0 },
    basic_installation_cost: { type: Number, default: 0 },

    // Project financials
    product_cost: { type: Number, default: 0 },
    installation_cost: { type: Number, default: 0 },
    misc_expenses: {
      expense_1: { type: Number, default: 0 },
      expense_2: { type: Number, default: 0 },
      expense_3: { type: Number, default: 0 },
      expense_4: { type: Number, default: 0 },
    },
    total_cost: { type: Number, default: 0 },
    project_cost: { type: Number, default: 0 },
    margin: { type: Number, default: 0 },
    margin_percent: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobCosting", jobCostingSchema);
