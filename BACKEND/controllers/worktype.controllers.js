const { default: mongoose } = require("mongoose");
const WorkType = require("../models/worktype.model");

// Get all work types
exports.getWorkTypes = async (req, res) => {
  try {
    const workTypes = await WorkType.find().sort({ createdAt: -1 });
    res.json(workTypes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get one work type by ID
exports.getWorkType = async (req, res) => {
  try {
    const workType = await WorkType.findById(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: "Work type not found" });
    }
    res.json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Create work type
exports.createWorkType = async (req, res) => {
  const { code, name, associatedDocketTypes } = req.body;

  // Manual validation
  if (!code || !name) {
    return res.status(400).json({ message: "Code and name are required" });
  }

  try {
    let existing = await WorkType.findOne({ code });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Work type with this code already exists" });
    }

    const workType = new WorkType({
      code,
      name,
      associatedDocketTypes: associatedDocketTypes || [],
    });

    await workType.save();
    res.status(201).json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update work type
exports.updateWorkType = async (req, res) => {
  const { code, name, associatedDocketTypes } = req.body;

  if (!code && !name && !associatedDocketTypes) {
    return res
      .status(400)
      .json({ message: "At least one field is required to update" });
  }

  try {
    const workType = await WorkType.findById(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: "Work type not found" });
    }

    if (code && code !== workType.code) {
      const existing = await WorkType.findOne({ code });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Work type with this code already exists" });
      }
      workType.code = code;
    }

    if (name) workType.name = name;
    if (associatedDocketTypes)
      workType.associatedDocketTypes = associatedDocketTypes;

    await workType.save();
    res.json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add association
exports.addAssociation = async (req, res) => {
  const { name, display } = req.body;

  if (!name || typeof display !== "boolean") {
    return res
      .status(400)
      .json({ message: "name and display (true/false) are required" });
  }

  try {
    const workType = await WorkType.findById(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: "Work type not found" });
    }

    const exists = workType.associatedDocketTypes.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: "Association already exists" });
    }

    workType.associatedDocketTypes.push({ name, display });
    await workType.save();

    res.status(201).json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update association
exports.updateAssociation = async (req, res) => {
  const { name, display } = req.body;

  if (!name && typeof display === "undefined") {
    return res
      .status(400)
      .json({ message: "Provide name or display to update" });
  }

  try {
    const workType = await WorkType.findById(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: "Work type not found" });
    }

    const index = workType.associatedDocketTypes.findIndex(
      (a) => a._id.toString() === req.params.assocId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Association not found" });
    }

    // Conflict check if updating name
    if (name) {
      const nameConflict = workType.associatedDocketTypes.some(
        (a, i) => i !== index && a.name.toLowerCase() === name.toLowerCase()
      );
      if (nameConflict) {
        return res
          .status(400)
          .json({ message: "Association name already exists" });
      }

      workType.associatedDocketTypes[index].name = name;
    }

    if (typeof display !== "undefined") {
      workType.associatedDocketTypes[index].display = display;
    }

    await workType.save();
    res.json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" + error });
  }
};

// Delete association
exports.deleteAssociation = async (req, res) => {
  try {
    const workType = await WorkType.findById(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: "Work type not found" });
    }

    const index = workType.associatedDocketTypes.findIndex(
      (a) => a._id.toString() === req.params.assocId
    );
    if (index === -1) {
      return res.status(404).json({ message: "Association not found" });
    }

    workType.associatedDocketTypes.splice(index, 1);
    await workType.save();
    res.json(workType);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.toggleAssociationDisplay = async (req, res) => {
  try {
    // Validate work type ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid work type ID" });
    }

    // Validate association ID
    if (!mongoose.Types.ObjectId.isValid(req.params.assocId)) {
      return res.status(400).json({ msg: "Invalid association ID" });
    }

    const workType = await WorkType.findById(req.params.id);

    if (!workType) {
      return res.status(404).json({ msg: "Work type not found" });
    }

    // Convert string ID to ObjectId for comparison
    const assocId = new mongoose.Types.ObjectId(req.params.assocId);

    // Find the association by ID
    const association = workType.associatedDocketTypes.find(assoc => 
      assoc._id.equals(assocId)
    );

    if (!association) {
      return res.status(404).json({ msg: "Association not found" });
    }

    // Toggle the display status
    association.display = !association.display;

    await workType.save();
    res.json({
      success: true,
      data: workType,
      message: "Association display status toggled successfully"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: "Server Error",
      error: err.message 
    });
  }
};