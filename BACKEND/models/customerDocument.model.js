const mongoose = require("mongoose");

const customerDocumentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  document_name: { type: String, required: true }, // Invoice, Agreement etc
  file_name: { type: String, required: true },     // stored file name
  file_path: { type: String, required: true },     // uploads/customers/...
  file_type: { type: String },                     // pdf, jpg, png
  file_size: { type: Number },

  uploaded_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerDocument", customerDocumentSchema);
