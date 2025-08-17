// controllers/jobCostingController.js
const JobCosting = require("../models/jobcosting.model");
const Quotation = require("../models/quotation.model");

exports.addJobCosting = async (req, res) => {
  try {
    const {
      customer_id,
      site_id,
      quotation_id,
      product_list,
      total_material_cost,
      total_installation_cost,
      basic_product_cost,
      basic_installation_cost,
      product_cost,
      installation_cost,
      misc_expenses,
      total_cost,
      project_cost,
      margin,
      margin_percent
    } = req.body;

    // Check if linked quotation exists
    const quotation = await Quotation.findById(quotation_id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const newJobCosting = new JobCosting({
      customer_id,
      site_id,
      quotation_id,
      product_list,
      total_material_cost,
      total_installation_cost,
      basic_product_cost,
      basic_installation_cost,
      product_cost,
      installation_cost,
      misc_expenses,
      total_cost,
      project_cost,
      margin,
      margin_percent
    });

    await newJobCosting.save();

    res.status(201).json({
      message: "Job Costing created successfully",
      jobCosting: newJobCosting
    });
  } catch (error) {
    console.error("Error creating Job Costing:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobCostings = async (req, res) => {
  try {
    const jobCostings = await JobCosting.find()
      .populate("customer_id")
      .populate("site_id")
      .populate("quotation_id");

    res.status(200).json(jobCostings);
  } catch (error) {
    console.error("Error fetching Job Costings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobCostingById = async (req, res) => {
  try {
    const jobCosting = await JobCosting.findById(req.params.id)
      .populate("customer_id")
      .populate("site_id")
      .populate("quotation_id");

    if (!jobCosting) {
      return res.status(404).json({ message: "Job Costing not found" });
    }

    res.status(200).json(jobCosting);
  } catch (error) {
    console.error("Error fetching Job Costing:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateJobCosting = async (req, res) => {
  try {
    const updatedJobCosting = await JobCosting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedJobCosting) {
      return res.status(404).json({ message: "Job Costing not found" });
    }

    res.status(200).json({
      message: "Job Costing updated successfully",
      jobCosting: updatedJobCosting
    });
  } catch (error) {
    console.error("Error updating Job Costing:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.deleteJobCosting = async (req, res) => {
  try {
    const deletedJobCosting = await JobCosting.findByIdAndDelete(req.params.id);

    if (!deletedJobCosting) {
      return res.status(404).json({ message: "Job Costing not found" });
    }

    res.status(200).json({ message: "Job Costing deleted successfully" });
  } catch (error) {
    console.error("Error deleting Job Costing:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
