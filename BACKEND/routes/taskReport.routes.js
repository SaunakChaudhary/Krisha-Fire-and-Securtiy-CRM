const express = require("express");
const router = express.Router();
const {
  submitTaskReport,
  getTaskReport,
  saveSignature,
  uploadDocuments,
  getDocuments,
  downloadDocument,
  deleteDocument,
  editTaskReport,
  getAllTaskReports
} = require("../controllers/taskReport.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Report routes
router.post("/", submitTaskReport);
router.get("/", getAllTaskReports);
router.get("/:taskId", getTaskReport);
router.put("/:taskId", editTaskReport);

// Signature routes
router.post("/save-signature", saveSignature);

// Document routes
router.post(
  "/:taskId/documents",
  upload.array("documents", 10),
  uploadDocuments
);
router.get("/:taskId/documents", getDocuments);
router.get("/:taskId/documents/:documentId/download", downloadDocument);
router.delete("/:taskId/documents/:documentId", deleteDocument);

module.exports = router;