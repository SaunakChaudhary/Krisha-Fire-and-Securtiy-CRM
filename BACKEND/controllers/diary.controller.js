const Diary = require("../models/diary.model");
const Call = require("../models/call.model");
const mongoose = require("mongoose");

exports.getAllDiaryEntries = async (req, res) => {
  try {
    // Get all diary entries with full population
    const entries = await Diary.find({})
      .populate({
        path: "site",
        populate: {
          path: "site_systems",
          populate: {
            path: "system_id",
          },
        },
      })
      .populate("callLog")
      .populate("engineer")
      .sort({ date: -1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while retrieving diary entries",
      error: err.message,
    });
  }
};

// Create a new diary entry
exports.createDiaryEntry = async (req, res) => {
  try {
    const { site, callLog, engineer, date, startTime, endTime, notes } =
      req.body;

    // Accept either call ObjectId or call number
    let callDoc;
    if (mongoose.Types.ObjectId.isValid(callLog)) {
      callDoc = await Call.findById(callLog);
    } else {
      callDoc = await Call.findOne({ call_number: callLog });
    }
    if (!callDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Call log not found" });
    }

    // Check if this is the first assignment for this call log
    const existingAssignments = await Diary.find({ callLog: callDoc._id });
    const initialEngineerId = req.query.initialEngineerId;

    const newEntry = new Diary({
      site,
      callLog: callDoc._id,
      engineer,
      date: new Date(date),
      startTime,
      endTime,
      // duration will be calculated automatically in pre-validate hook
      notes,
    });

    await newEntry.save();

    res.status(201).json({
      success: true,
      data: newEntry,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating diary entry",
      error: err.message,
    });
  }
};

// Update a diary entry
exports.updateDiaryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (
      updates.callLog &&
      typeof updates.callLog === "string" &&
      !mongoose.Types.ObjectId.isValid(updates.callLog)
    ) {
      const callDoc = await Call.findOne({ call_number: updates.callLog });
      if (!callDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Call log not found" });
      }
      updates.callLog = callDoc._id;
    }
    // Cast date string to Date
    if (updates.date && typeof updates.date === "string") {
      updates.date = new Date(updates.date);
    }

    // Check if entry exists
    const entry = await Diary.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Diary entry not found",
      });
    }

    // Apply updates
    Object.assign(entry, updates);
    // no updatedBy field
    await entry.save();

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating diary entry",
      error: err.message,
    });
  }
};

// Delete a diary entry
exports.deleteDiaryEntry = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const entry = await Diary.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Diary entry not found",
      });
    }

    // Removed restriction preventing deletion of initial assignment

    await Diary.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting diary entry",
      error: err.message,
    });
  }
};

// Get assignments for a specific call log
exports.getAssignmentsByCallLog = async (req, res) => {
  try {
    const { callLogId } = req.params;

    const callLog = await Call.findOne({ call_number: callLogId });
    if (!callLog) {
      return res
        .status(404)
        .json({ success: false, message: "Call log not found" });
    }

    const assignments = await Diary.find({ callLog: callLog._id })
      .populate("engineer", "firstname lastname")
      .populate("site", "site_name")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Check for time conflicts
exports.checkTimeConflict = async (req, res) => {
  try {
    const { engineer, date, startTime, endTime, excludeId } = req.query;

    const conflict = await Diary.findOne({
      _id: { $ne: excludeId },
      engineer,
      date: new Date(date),
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    res.status(200).json({
      success: true,
      hasConflict: !!conflict,
      conflictingAssignment: conflict,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
