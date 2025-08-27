const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subschema for products inside purchase order
const ProductSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  description: { type: String },
  manufacturer: { type: String },
  gst_percent: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, required: true, min: 0 }
});

// Main PurchaseOrder schema
const PurchaseOrderSchema = new Schema({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  PurchaseOrderNumber : { type: String, required: true, unique: true },
  supplier_id: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  address: { type: String },
  mobile_no: { type: String },
  on_order: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  call_id: { type: Schema.Types.ObjectId, ref: 'Call' },
  date: { type: Date, required: true, default: Date.now },
  due_date: { type: Date },
  placed_by: { type: mongoose.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  deliver_to: { type: Schema.Types.ObjectId, ref: 'Customer' },
  deliver_to_store: { type: Boolean, default: false },
  delivery_address: { type: String },
  delivery_instructions: { type: String },
  delivery_date: { type: Date },
  other_terms: { type: String },
  products: [ProductSchema],
  total_amount: { type: Number, default: 0 },
  gst_inclusive: { type: Number, default: 0 },
  gst_adjust: { type: Number, default: 0 },
  gross_amount: { type: Number, default: 0 },
  discount_percent: { type: Number, default: 0 },
  settlement_days: { type: Number, default: 0 },
  mark_as_confirmation_order: { type: Boolean, default: false },
  auto_created: { type: Boolean, default: false }
}, { timestamps: true });


module.exports = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);
