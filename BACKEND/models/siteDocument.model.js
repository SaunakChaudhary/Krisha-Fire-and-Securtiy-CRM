const mongoose = require("mongoose");

const siteDocumentSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Site",
    required: true,
  },

  document_name: { type: String, required: true }, // Invoice, Agreement etc
  file_name: { type: String, required: true }, // stored file name
  file_path: { type: String, required: true }, // uploads/sites/...
  file_type: { type: String }, // pdf, jpg, png
  file_size: { type: Number },
  folder_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteFolder",
    required: true,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SiteDocument", siteDocumentSchema);
