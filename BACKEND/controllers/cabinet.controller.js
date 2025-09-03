const FileItem = require("../models/FileItem.model");
const fs = require("fs");
const path = require("path");

// Get root items
exports.getRootItems = async (req, res) => {
  try {
    const { search } = req.query;

    // Get folders
    const folderQuery = {
      $or: [{ isRoot: true }, { parent: null }],
      type: "folder",
    };

    if (search) {
      folderQuery.name = { $regex: search, $options: "i" };
    }

    const folders = await FileItem.find(folderQuery).sort({ modified: -1 });

    // Get files
    const fileQuery = {
      parent: null,
      type: "file",
    };

    if (search) {
      fileQuery.name = { $regex: search, $options: "i" };
    }

    const files = await FileItem.find(fileQuery).sort({ modified: -1 });

    res.json({ folders, files });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get folder contents
exports.getFolderContents = async (req, res) => {
  try {
    const { id } = req.params;
    const { search } = req.query;

    const folder = await FileItem.findById(id);
    if (!folder || folder.type !== "folder") {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Get subfolders
    const folderQuery = {
      parent: id,
      type: "folder",
    };

    if (search) {
      folderQuery.name = { $regex: search, $options: "i" };
    }

    const subfolders = await FileItem.find(folderQuery).sort({ modified: -1 });

    // Get files
    const fileQuery = {
      parent: id,
      type: "file",
    };

    if (search) {
      fileQuery.name = { $regex: search, $options: "i" };
    }

    const files = await FileItem.find(fileQuery).sort({ modified: -1 });

    res.json({ subfolders, files });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Create folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    const folder = new FileItem({
      name,
      type: "folder",
      parent: parentId || null,
      isRoot: !parentId, // If no parent, it's a root folder
      user: null, // In real app, get from authenticated user
    });

    const savedFolder = await folder.save();
    res.status(201).json(savedFolder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update folder
exports.updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const folder = await FileItem.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!folder || folder.type !== "folder") {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete folder
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await FileItem.findById(id);
    if (!folder || folder.type !== "folder") {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Recursively find all files to delete their physical files
    const deleteFilesRecursively = async (folderId) => {
      const contents = await FileItem.find({ parent: folderId });

      for (const item of contents) {
        if (item.type === "folder") {
          await deleteFilesRecursively(item._id);
        } else if (item.type === "file") {
          // Delete physical file
          if (fs.existsSync(item.path)) {
            fs.unlinkSync(item.path);
          }
        }
        // Delete the item from database
        await FileItem.findByIdAndDelete(item._id);
      }
    };

    await deleteFilesRecursively(id);

    // Finally delete the main folder
    await FileItem.findByIdAndDelete(id);

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Upload files
exports.uploadFiles = async (req, res) => {
  try {
    const { folderId } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const newFile = new FileItem({
        name: file.originalname,
        type: "file",
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        parent: folderId || null,
        user: null, // In real app, get from authenticated user
      });

      const savedFile = await newFile.save();
      uploadedFiles.push(savedFile);

      // Update parent folder's modified date
      if (folderId) {
        await FileItem.findByIdAndUpdate(folderId, { modified: Date.now() });
      }
    }

    res.status(201).json(uploadedFiles);
  } catch (error) {
    // Clean up uploaded files if there's an error
    req.files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    res.status(500).json({ message: error.message });
  }
};

// Delete files
exports.deleteFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;

    // Get files to find their paths and parent folders
    const files = await FileItem.find({ _id: { $in: fileIds }, type: "file" });

    // Delete physical files
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Get parent folder IDs to update their modified dates
    const parentIds = [
      ...new Set(files.map((file) => file.parent).filter((id) => id)),
    ];

    // Delete file records from database
    const result = await FileItem.deleteMany({
      _id: { $in: fileIds },
      type: "file",
    });

    // Update modified dates of parent folders
    for (const parentId of parentIds) {
      await FileItem.findByIdAndUpdate(parentId, { modified: Date.now() });
    }

    res.json({ message: `${result.deletedCount} files deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search across all items
exports.searchItems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const items = await FileItem.find({
      name: { $regex: q, $options: "i" },
    }).sort({ modified: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get file content
exports.getFileContent = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileItem.findById(id);
    
    if (!file || file.type !== 'file') {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileItem.findById(id);
    
    if (!file || file.type !== 'file') {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.download(file.path, file.name);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};