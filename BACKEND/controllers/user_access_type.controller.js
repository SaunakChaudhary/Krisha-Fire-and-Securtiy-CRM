const AccessType = require("../models/user_type.model");
const User = require("../models/user.model");

const createAccessType = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Basic validation
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required." });
    }

    const newAccessType = new AccessType({ name, description, status });
    await newAccessType.save();
    return res.status(201).json(newAccessType);
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error creating access type" });
  }
};

const editAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    // Basic validation
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required." });
    }

    if (status === "inactive") {
      const updateResult = await User.updateMany(
        { accesstype_id: id }, // Query to find documents
        {
          status: "inactive",
        }
      );
    }

    const updated = await AccessType.findByIdAndUpdate(
      id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "AccessType not found." });
    }

    return res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error updating access type" });
  }
};

const getAccessTypes = async (req, res) => {
  try {
    const accessTypes = await AccessType.find({ name: { $ne: "Super Admin" } });
    return res.status(200).json(accessTypes);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching access types" });
  }
};

module.exports = {
  createAccessType,
  editAccessType,
  getAccessTypes,
};
