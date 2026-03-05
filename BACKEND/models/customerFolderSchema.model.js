// models/customerFolder.model.js

const mongoose = require("mongoose");

const customerFolderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  folder_name: {
    type: String,
    required: true,
  },
  parent_folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerFolder",
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerFolder", customerFolderSchema);
