// models/customerFolder.model.js

const mongoose = require("mongoose");

const siteFolderSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Site",
    required: true,
  },
  folder_name: {
    type: String,
    required: true,
  },
  parent_folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SiteFolder",
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SiteFolder", siteFolderSchema);
