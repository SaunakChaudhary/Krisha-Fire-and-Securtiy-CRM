const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
    product_code: { type: String, required: true, unique: true },
    product_name: { type: String, required: true },
    HSN_No: { type: String },
    SAC_NO: { type: String },
    manufacturer: { type: Schema.Types.ObjectId, ref: 'ReferenceCode' },
    specifications: { type: String },
    unit: { type: String, enum: ['Numbers', 'KGS', 'LOT', 'METERS'], required: true },
    GST: { type: Number },
    installation_GST: { type: Number },
    product_group: { type: Schema.Types.ObjectId, ref: 'ReferenceCode' },
    obsolete_product: { type: Boolean, default: false },
    preferred_supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    units: { type: Number },
    unit_description: { type: String },
    purchase_cost: { type: Number },
    average_cost: { type: Number },
    standard_cost: { type: Number },
    standard_sale: { type: Number },
    installation_sale: { type: Number },
    maintenance_sale: { type: Number },
    other_sale: { type: Number },
    labour_hours: { type: Number },
    maintenance_hours: { type: Number },
    commission_hours: { type: Number },
    basic_specification_text: { type: String },
    detailed_specification_text: { type: String },
    upload_image: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);