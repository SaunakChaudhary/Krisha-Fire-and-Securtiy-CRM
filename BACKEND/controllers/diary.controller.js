const Diary = require("../models/diary.model");
const Call = require("../models/call.model");
const mongoose = require("mongoose");

exports.getDiaryEntries = async (req, res) => {
  try {
    const { date, engineerId } = req.query;

    if (!date || !engineerId) {
      return res.status(400).json({
        success: false,
        message: "Date and engineerId are required",
      });
    }

    const entries = await Diary.find({
      engineer: engineerId,
      date: new Date(date),
    })
      .populate("site", "name address")
      .populate("callLog", "callNumber description")
      .populate("engineer", "firstname lastname")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Create a new diary entry
exports.createDiaryEntry = async (req, res) => {
  try {
    const { site, callLog, engineer, date, startTime, endTime, notes } =
      req.body;
    const { userId } = req.params;

    const callLogId = await Call.findOne({ call_number: callLog });

    console.log(callLogId)
    
    // Check if this is the first assignment for this call log
    const existingAssignments = await Diary.find({ callLog: callLogId });
    const initialEngineerId = req.query.initialEngineerId;


    const newEntry = new Diary({
      site,
      callLog: callLogId._id,
      engineer,
      date: new Date(date),
      startTime,
      endTime,
      duration: "", // Will be calculated by pre-save hook
      notes,
      createdBy: userId,
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
    const userId = updates.userId;

    // Check if entry exists
    const entry = await Diary.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Diary entry not found",
      });
    }

    // Prevent changing engineer if it's the initial assignment
    if (
      updates.engineer &&
      entry.engineer.toString() === req.query.initialEngineerId
    ) {
      const callLogAssignments = await Diary.find({ callLog: entry.callLog });
      if (callLogAssignments.length === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot change engineer for the initial assignment",
        });
      }
    }

    // Apply updates
    Object.assign(entry, updates);
    entry.updatedBy = userId;
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

    // Check if this is the initial assignment
    if (entry.engineer.toString() === req.query.initialEngineerId) {
      const callLogAssignments = await Diary.find({ callLog: entry.callLog });
      if (callLogAssignments.length === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the initial assignment",
        });
      }
    }

    await entry.remove();

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

    const callLog = await Call.find({ call_number: callLogId });

    const assignments = await Diary.find({ callLog: callLog._id })
      .populate("engineer", "firstname lastname")
      .populate("site", "name")
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
