const CustomerDocument = require("../models/customerDocument.model");
const mongoose = require("mongoose");

const uploadCustomerDocument = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const document = await CustomerDocument.create({
      customer_id: customerId,
      document_name: req.body.document_name || req.file.originalname,
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

const getCustomerDocuments = async (req, res) => {
  try {
    const { customerId } = req.params;

    const documents = await CustomerDocument.find({
      customer_id: customerId,
    }).sort({ uploaded_at: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const fs = require("fs");

const deleteCustomerDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await CustomerDocument.findById(id);
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
  uploadCustomerDocument,
  getCustomerDocuments,
  deleteCustomerDocument,
};
