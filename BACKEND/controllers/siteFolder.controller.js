const SiteFolder = require("../models/siteFolder.model");
const fs = require("fs");
const path = require("path");
const SiteDocument = require("../models/siteDocument.model");

const createFolder = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { folder_name, parent_folder } = req.body;

    if (!folder_name) {
      return res.status(400).json({ error: "Folder name required" });
    }

    // Check duplicate
    const exists = await SiteFolder.findOne({
      site_id: siteId,
      folder_name,
    });

    if (exists) {
      return res.status(400).json({ error: "Folder already exists" });
    }

    // Create physical folder
    const folderPath = path.join(
      "uploads",
      "customers",
      siteId,
      folder_name,
    );

    fs.mkdirSync(folderPath, { recursive: true });

    const folder = await SiteFolder.create({
      site_id: siteId,
      folder_name,
      parent_folder: parent_folder || null,
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getFolders = async (req, res) => {
  const { siteId } = req.params;
  const { parent } = req.query;

  const query = {
    site_id: siteId,
    parent_folder: parent || null,
  };

  const folders = await SiteFolder.find(query);

  res.json(folders);
};

const mongoose = require("mongoose");

const deleteFolder = async (req, res) => {
  try {
    const { siteId, folderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    const folder = await SiteFolder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    /* ---------- CHECK SUBFOLDERS ---------- */

    const subFolderCount = await SiteFolder.countDocuments({
      parent_folder: folderId,
    });

    if (subFolderCount > 0) {
      return res.status(400).json({
        error: "Folder contains subfolders. Delete them first.",
      });
    }

    /* ---------- CHECK DOCUMENTS ---------- */

    const documentCount = await SiteDocument.countDocuments({
      folder_id: folderId,
    });

    if (documentCount > 0) {
      return res.status(400).json({
        error: "Folder contains documents. Delete them first.",
      });
    }

    /* ---------- DELETE PHYSICAL FOLDER ---------- */

    const folderPath = path.join(
      "uploads",
      "customers",
      siteId,
      folder.folder_name,
    );

    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    await folder.deleteOne();

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const renameFolder = async (req, res) => {
  try {
    const { siteId, folderId } = req.params;
    const { new_name } = req.body;

    if (!new_name || !new_name.trim()) {
      return res.status(400).json({ error: "New folder name required" });
    }

    const folder = await SiteFolder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (folder.site_id.toString() !== siteId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check duplicate name
    const exists = await SiteFolder.findOne({
      site_id: siteId,
      folder_name: new_name,
    });

    if (exists) {
      return res.status(400).json({ error: "Folder name already exists" });
    }

    const oldFolderPath = path.join(
      "uploads",
      "customers",
      siteId,
      folder.folder_name,
    );

    const newFolderPath = path.join(
      "uploads",
      "customers",
      siteId,
      new_name,
    );

    // Rename physical folder
    if (fs.existsSync(oldFolderPath)) {
      fs.renameSync(oldFolderPath, newFolderPath);
    }

    // Update documents folder_name
    await SiteDocument.updateMany(
      {
        site_id: siteId,
        folder_name: folder.folder_name,
      },
      { folder_name: new_name },
    );

    // Update folder collection
    folder.folder_name = new_name;
    await folder.save();

    res.json({ message: "Folder renamed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createFolder, getFolders, deleteFolder, renameFolder };
