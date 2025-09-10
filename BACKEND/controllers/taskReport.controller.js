const TaskReport = require('../models/taskReport.model');
const Engineer = require('../models/engineer.model');
const fs = require("fs"); 
const fs1 = require("fs").promises; 
const path = require('path');

// ========== SUBMIT TASK REPORT ==========
const submitTaskReport = async (req, res) => {
  try {
    const {
      taskId,
      taskDetails,
      customerRating,
      customerReview,
      engineerSignature,
      customerSignature,
      checklistStatus,
      additionalNotes,
      engineer
    } = req.body;

    if (!taskId || !engineer) {
      return res.status(400).json({
        success: false,
        message: "Task ID and engineer ID are required",
      });
    }

    // Check if report already exists
    const existingReport = await TaskReport.findOne({ taskId });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "Report already exists for this task",
      });
    }

    const newReport = new TaskReport({
      engineer,
      taskId,
      taskDetails: taskDetails || {},
      customerRating: customerRating || 0,
      customerReview: customerReview || "",
      engineerSignature: engineerSignature || "",
      customerSignature: customerSignature || "",
      checklistStatus: checklistStatus || {},
      additionalNotes: additionalNotes || "",
      submittedAt: new Date(),
    });

    await newReport.save();

    // Update engineer status
    await Engineer.findByIdAndUpdate(
      engineer,
      { current_status: "available" },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: newReport,
    });
  } catch (error) {
    console.error("Error submitting task report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== GET TASK REPORT ==========
const getTaskReport = async (req, res) => {
  try {
    const { taskId } = req.params;

    const report = await TaskReport.findOne({ taskId })
      .populate('engineer', 'firstname lastname email phone')
      .exec();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching task report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== GET ALL TASK REPORTS ==========
const getAllTaskReports = async (req, res) => {
  try {
    const reports = await TaskReport.find()
      .populate('engineer', 'firstname lastname email phone')
      .exec();

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching task reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== SAVE SIGNATURE ==========
const saveSignature = async (req, res) => {
  try {
    const { taskId, signatureType, signatureData } = req.body;

    if (!taskId || !signatureType || !signatureData) {
      return res.status(400).json({
        success: false,
        message: "Task ID, signature type, and signature data are required",
      });
    }

    const updateField = signatureType === 'engineer' 
      ? { engineerSignature: signatureData } 
      : { customerSignature: signatureData };

    const report = await TaskReport.findOneAndUpdate(
      { taskId },
      updateField,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Signature saved successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error saving signature:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== UPLOAD DOCUMENTS ==========
const uploadDocuments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const report = await TaskReport.findOne({ taskId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Submit Report First Before Uploading Documents",
      });
    }

    const documents = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    report.documents.push(...documents);
    await report.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      data: documents,
    });
  } catch (error) {
    console.error("Error uploading documents:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== GET DOCUMENTS ==========
const getDocuments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const report = await TaskReport.findOne({ taskId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      data: report.documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== DOWNLOAD DOCUMENT ==========
const downloadDocument = async (req, res) => {
  try {
    const { taskId, documentId } = req.params;

    const report = await TaskReport.findOne({ taskId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const document = report.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!fs.existsSync(document.path)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimetype);

    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== DELETE DOCUMENT ==========
const deleteDocument = async (req, res) => {
  try {
    const { taskId, documentId } = req.params;

    const report = await TaskReport.findOne({ taskId });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const document = report.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete file from filesystem (non-blocking)
    try {
      await fs1.unlink(document.path);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete file from server",
        });
      }
    }

    // Remove document from array
    report.documents.pull(documentId);
    await report.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== EDIT TASK REPORT ==========
const editTaskReport = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const report = await TaskReport.findOneAndUpdate(
      { taskId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error editing task report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  submitTaskReport,
  getTaskReport,
  saveSignature,
  uploadDocuments,
  getDocuments,
  downloadDocument,
  deleteDocument,
  editTaskReport,
  getAllTaskReports
};