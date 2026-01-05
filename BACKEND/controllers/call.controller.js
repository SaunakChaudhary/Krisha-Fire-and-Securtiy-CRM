const { default: mongoose } = require("mongoose");
const Call = require("../models/call.model"); // Adjust the path as needed
const Diary = require("../models/diary.model"); // Adjust the path as needed

exports.addCall = async (req, res) => {
  try {
    const {
      site_id,
      site_system,
      call_type,
      call_reason,
      waiting,
      call_waiting_reason,
      chargable,
      invoiced,
      bill_on_maintenance,
      priority,
      deadline,
      logged_by,
      caller_name,
      caller_number,
      caller_email,
      next_action,
      engineer_id,
      assign_date,
      invoice_no,
      invoice_date,
      invoice_value,
      remarks,
    } = req.body;

    // Basic validation for required fields
    if (!site_id || !site_system || !call_type || !call_reason || !logged_by) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: site_id, site_system, call_type, call_reason",
      });
    }

    // Validate that waiting reason is provided if waiting is true
    if (waiting && !call_waiting_reason) {
      return res.status(400).json({
        success: false,
        message: "call_waiting_reason is required when waiting is true",
      });
    }

    // Auto-generate call_number in proper format: 001, 002, 003, etc. (sequence per year not required)
    // Find the latest call and increment the sequence
    const latestCall = await Call.findOne({}).sort({ call_number: -1 }).lean();

    let nextSequence = 1;
    if (latestCall && latestCall.call_number) {
      // Extract the sequence number (assume call_number is a string like '001', '002', etc.)
      const lastSeq = parseInt(latestCall.call_number, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
    const call_number = String(nextSequence).padStart(3, "0");

    // Create new call object with defaults
    const newCall = new Call({
      call_number,
      site_id,
      site_system,
      call_type,
      call_reason,
      waiting: waiting || false,
      call_waiting_reason: waiting ? call_waiting_reason : undefined,
      chargable: chargable || false,
      invoiced: invoiced || false,
      bill_on_maintenance: bill_on_maintenance || false,
      priority: priority || 0,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      logged_by: logged_by,
      caller_name,
      caller_number,
      caller_email,
      next_action: next_action || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
      engineer_id,
      assign_date,
      invoice_no,
      invoice_date,
      invoice_value,
      remarks,
    });

    // Save to database
    const savedCall = await newCall.save();

    // Return the saved call (without populating references for simplicity)
    res.status(201).json({
      success: true,
      message: "Call successfully created",
      data: savedCall,
    });
  } catch (error) {
    console.error("Error creating call:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message,
      });
    }

    // Generic error handler
    res.status(500).json({
      success: false,
      message: "Failed to create call",
      error: error.message,
    });
  }
};

exports.getCallDetails = async (req, res) => {
  try {
    const callId = req.params.id;

    // Validate call ID format (MongoDB ObjectId)
    if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Call ID format",
      });
    }

    // Find the call with all referenced data populated
    const call = await Call.findById(callId)
      .populate("site_id")
      .populate("site_system")
      .populate("call_type")
      .populate("call_reason")
      .populate("call_waiting_reason")
      .populate("logged_by")
      .populate({
        path: "engineer_id",
      })
      .lean();

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Transform the response data if needed
    const responseData = {
      ...call,
      // Add any computed fields here
      isOverdue: call.deadline && new Date(call.deadline) < new Date(),
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching call details:", error);

    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Call ID format",
      });
    }

    // Handle database connection errors
    if (error.name === "MongoNetworkError") {
      return res.status(503).json({
        success: false,
        message: "Database connection error",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch call details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getAllDetails = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build the query
    const query = {};

    // Status filter
    if (status === "waiting") {
      query.waiting = true;
    } else if (status === "active") {
      query.waiting = false;
      query.completedAt = { $exists: false };
    } else if (status === "completed") {
      query.completedAt = { $exists: true };
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { "site_id.name": { $regex: search, $options: "i" } },
        { "site_system.name": { $regex: search, $options: "i" } },
        { "call_type.name": { $regex: search, $options: "i" } },
        { caller_name: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Call.countDocuments(query);

    // Get paginated results
    const calls = await Call.find(query)
      .populate("site_id")
      .populate("site_system")
      .populate("call_type")
      .populate("call_reason")
      .populate("call_waiting_reason")
      .populate("logged_by")
      .populate("engineer_id")
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: total,
      data: calls,
    });
  } catch (error) {
    console.error("Error fetching calls:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.editCall = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      site_id,
      site_system,
      call_type,
      call_reason,
      waiting,
      call_waiting_reason,
      chargable,
      invoiced,
      bill_on_maintenance,
      priority,
      deadline,
      logged_by,
      caller_name,
      caller_number,
      caller_email,
      next_action,
      engineer_id,
      assign_date,
      invoice_no,
      invoice_date,
      invoice_value,
      remarks,
      status,
    } = req.body;

    // Basic validation for required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Call ID is required",
      });
    }

    // Find the existing call
    const existingCall = await Call.findById(id);
    if (!existingCall) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Validate that waiting reason is provided if waiting is true
    if (waiting && !call_waiting_reason) {
      return res.status(400).json({
        success: false,
        message: "call_waiting_reason is required when waiting is true",
      });
    }

    const updateFields = {
      site_id: site_id !== undefined ? site_id : existingCall.site_id,
      site_system:
        site_system !== undefined ? site_system : existingCall.site_system,
      call_type: call_type !== undefined ? call_type : existingCall.call_type,
      call_reason:
        call_reason !== undefined ? call_reason : existingCall.call_reason,
      waiting: waiting !== undefined ? waiting : existingCall.waiting,
      call_waiting_reason: waiting
        ? call_waiting_reason !== undefined
          ? call_waiting_reason
          : existingCall.call_waiting_reason
        : undefined,
      chargable: chargable !== undefined ? chargable : existingCall.chargable,
      invoiced: invoiced !== undefined ? invoiced : existingCall.invoiced,
      bill_on_maintenance:
        bill_on_maintenance !== undefined
          ? bill_on_maintenance
          : existingCall.bill_on_maintenance,
      priority: priority !== undefined ? priority : existingCall.priority,
      deadline: deadline !== undefined ? deadline : existingCall.deadline,
      logged_by: logged_by !== undefined ? logged_by : existingCall.logged_by,
      caller_name:
        caller_name !== undefined ? caller_name : existingCall.caller_name,
      caller_number:
        caller_number !== undefined
          ? caller_number
          : existingCall.caller_number,
      caller_email:
        caller_email !== undefined ? caller_email : existingCall.caller_email,
      next_action:
        next_action !== undefined ? next_action : existingCall.next_action,
      engineer_id:
        engineer_id !== undefined ? engineer_id : existingCall.engineer_id,
      assign_date:
        assign_date !== undefined ? assign_date : existingCall.assign_date,
      invoice_no:
        invoice_no !== undefined ? invoice_no : existingCall.invoice_no,
      invoice_date:
        invoice_date !== undefined ? invoice_date : existingCall.invoice_date,
      invoice_value:
        invoice_value !== undefined
          ? invoice_value
          : existingCall.invoice_value,
      remarks: remarks !== undefined ? remarks : existingCall.remarks,
      status: status !== undefined ? status : existingCall.status,
      updated_at: new Date(), // Always update the timestamp
    };

    await Diary.findOneAndUpdate(
      { callLog: id },
      {
        ...(site_id !== undefined && { site: site_id }),
        ...(engineer_id !== undefined && { engineer: engineer_id }),
        ...(assign_date !== undefined && { date: assign_date }),

      },
      { runValidators: true }
    );

    const updatedCall = await Call.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedCall) {
      return res.status(404).json({
        success: false,
        message: "Call not found after update attempt",
      });
    }

    // Return the updated call
    res.status(200).json({
      success: true,
      message: "Call successfully updated",
      data: updatedCall,
    });
  } catch (error) {
    console.error("Error updating call:", error);

    // Handle specific errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message,
      });
    }

    // Generic error handler
    res.status(500).json({
      success: false,
      message: "Failed to update call",
      error: error.message,
    });
  }
};
