const ReferenceCode = require("../models/reference.model");

exports.createReferenceCode = async (req, res) => {
  try {
    const { category, code, name, description, createdBy } = req.body;

    const newRefCode = new ReferenceCode({
      category,
      code,
      name,
      description,
      createdBy,
    });

    const savedCode = await newRefCode.save();
    return res.status(200).json(savedCode);
  } catch (err) {
      console.log(err)
    return res.status(500).json({ message: err });
  }
};

exports.updateReferenceCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive, updatedBy } = req.body;
    
    const check1 = await ReferenceCode.findById(id);
    const check2 = await ReferenceCode.find({code});

    if (check1.code !== code && check2.length > 0) {
      return res.status(400).json({ error: "Reference Code already exists" });
    }

    const updated = await ReferenceCode.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(code && { code }),
        ...(description && { description }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(updatedBy && { updatedBy }),
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Reference Code not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const codes = await ReferenceCode.find({ category });

    res.status(200).json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReferenceCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ReferenceCode.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Reference Code not found" });
    }
    res.status(200).json({ message: "Reference Code deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
