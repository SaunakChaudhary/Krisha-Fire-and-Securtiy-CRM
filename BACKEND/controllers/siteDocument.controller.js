const SiteDocument = require("../models/siteDocument.model");
const mongoose = require("mongoose");

const uploadSiteDocument = async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ error: "Invalid site ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const document = await SiteDocument.create({
      site_id: siteId,
      document_name: req.body.document_name || req.file.originalname,
      folder_id: req.body.folder_id,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_size: req.file.size,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const getSiteDocuments = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { folderId } = req.query;

    if (!folderId || !mongoose.Types.ObjectId.isValid(folderId)) {
      return res.json([]);
    }

    const documents = await SiteDocument.find({
      site_id: siteId,
      folder_id: new mongoose.Types.ObjectId(folderId),
    }).sort({ uploaded_at: -1 });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const fs = require("fs");

const deleteSiteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await SiteDocument.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    await doc.deleteOne();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  uploadSiteDocument,
  getSiteDocuments,
  deleteSiteDocument,
};
