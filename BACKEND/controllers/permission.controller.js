const mongoose = require("mongoose");
const Permission = require("../models/permission.model");

// Create new permission entry
exports.createPermission = async (req, res) => {
  try {
    let { role, permissions, createdBy } = req.body;
    // Ensure role is an ObjectId string
    if (!mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const existing = await Permission.findOne({ role: role.toString() });
    if (existing) {
      return res
        .status(400)
        .json({
          message: "Permissions already exist for this role",
          repaet: true,
        });
    }

    const permission = new Permission({
      role: role.toString(),
      permissions,
      createdBy: createdBy?.toString(),
    });

    await permission.save();
    res
      .status(201)
      .json({ message: "Permission created successfully", permission });
  } catch (error) {
    console.error("Error creating permission:", error);
    res
      .status(500)
      .json({ message: error.message });
  }
};

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find()
      .populate("role") // only role name
      .populate("createdBy")
      .populate("updatedBy");

    res.json(permissions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching permissions", error: error.message });
  }
};

// Get permissions by role
exports.getPermissionByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const permission = await Permission.findOne({ role: roleId }).populate(
      "role"
    );

    if (!permission) {
      return res
        .status(404)
        .json({ message: "Permissions not found for this role" });
    }

    res.json(permission);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching permission", error: error.message });
  }
};

// Update permissions by role
exports.updatePermission = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions, updatedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const updated = await Permission.findOneAndUpdate(
      { role: roleId.toString() },
      { permissions, updatedBy: updatedBy?.toString() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.json({ message: "Permission updated successfully", updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating permission", error: error.message });
  }
};

// Delete permissions by role
exports.deletePermission = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const deleted = await Permission.findOneAndDelete({
      role: roleId.toString(),
    });

    if (!deleted) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.json({ message: "Permission deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting permission", error: error.message });
  }
};
