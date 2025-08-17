const System = require("../models/system.model");
const Site = require("../models/site.model");
const { default: mongoose } = require("mongoose");

const validateSystemData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.systemCode !== undefined) {
    if (!data.systemCode || typeof data.systemCode !== "string") {
      errors.push("systemCode is required and must be a string.");
    } else {
      if (!/^[A-Za-z0-9_-]+$/.test(data.systemCode)) {
        errors.push(
          "systemCode can only contain letters, numbers, hyphens, and underscores."
        );
      }
      if (data.systemCode.length > 50) {
        errors.push("systemCode must not exceed 50 characters.");
      }
    }
  }

  if (!isUpdate || data.systemName !== undefined) {
    if (!data.systemName || typeof data.systemName !== "string") {
      errors.push("systemName is required and must be a string.");
    } else if (data.systemName.length > 100) {
      errors.push("systemName must not exceed 100 characters.");
    }
  }

  if (data.description && data.description.length > 500) {
    errors.push("description must not exceed 500 characters.");
  }

  if (!isUpdate || data.productFilterGroup !== undefined) {
    const validGroups = [
      "Corrective Maintenance",
      "Equipment",
      "Monitoring Charge",
      "Preventative Maintenance",
    ];
    if (!validGroups.includes(data.productFilterGroup)) {
      errors.push("Invalid productFilterGroup.");
    }
  }

  if (data.alarmReportingCategory !== undefined) {
    const validCategories = ["Intruder", "Fire", "CCTV", "none"];
    if (!validCategories.includes(data.alarmReportingCategory)) {
      errors.push("Invalid alarmReportingCategory.");
    }
  }

  return errors;
};

const getAllSystems = async (req, res) => {
  try {
    const { search, active, referenceOnly, productFilterGroup } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { systemCode: { $regex: search, $options: "i" } },
        { systemName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (active !== undefined) query.active = active === "true";
    if (referenceOnly !== undefined)
      query.referenceOnlySystem = referenceOnly === "true";
    if (productFilterGroup) query.productFilterGroup = productFilterGroup;

    const systems = await System.find(query).sort({ systemName: 1 });
    return res.status(200).json({ count: systems.length, systems });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch systems", error: error.message });
  }
};

const getSystem = async (req, res) => {
  try {
    const { id } = req.params;
    const system = await System.findById(id);
    if (!system)
      return res.status(404).json({ message: `No system found with id ${id}` });

    return res.status(200).json({ system });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch system", error: error.message });
  }
};

const createSystem = async (req, res) => {
  try {
    const systemData = req.body;

    const validationErrors = validateSystemData(systemData);
    if (validationErrors.length) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: validationErrors });
    }

    const existingSystem = await System.findOne({
      systemCode: systemData.systemCode,
    });
    if (existingSystem) {
      return res
        .status(400)
        .json({ message: "System with this code already exists" });
    }

    const system = await System.create({ ...systemData });
    return res.status(201).json({ system });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create system " + error,
      error: error.message,
    });
  }
};

const updateSystem = async (req, res) => {
  try {
    const { id } = req.params;
    const systemData = req.body;

    const system = await System.findById(id);
    if (!system)
      return res.status(404).json({ message: `No system found with id ${id}` });

    const validationErrors = validateSystemData(systemData, true);
    if (validationErrors.length) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: validationErrors });
    }

    if (systemData.systemCode && systemData.systemCode !== system.systemCode) {
      const existingSystem = await System.findOne({
        systemCode: systemData.systemCode,
      });
      if (existingSystem) {
        return res
          .status(400)
          .json({ message: "System with this code already exists" });
      }
    }

    const updatedSystem = await System.findByIdAndUpdate(
      id,
      { ...systemData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ system: updatedSystem });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update system", error: error.message });
  }
};

const removeSystemFromSite = async (req, res) => {
  try {
    const { siteId, systemId } = req.params;

    const site = await Site.findById(siteId);
    if (!site) {
      return res
        .status(404)
        .json({ message: `No site found with id ${siteId}` });
    }

    // Find the index of the system to remove
    const systemIndex = site.site_systems.findIndex(
      (sys) => sys._id.toString() === systemId
    );

    if (systemIndex === -1) {
      return res.status(404).json({ message: "System not found in this site" });
    }

    // Remove the system
    site.site_systems.splice(systemIndex, 1);
    await site.save();

    return res.status(200).json({
      message: "System removed from site successfully",
      site,
    });
  } catch (error) {
    console.error("Error removing system from site:", error);
    return res.status(500).json({
      message: "Failed to remove system from site",
      error: error.message,
    });
  }
};

const addSystemToSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const {
      system_id,
      status,
      date_of_sale,
      installed_by,
      date_of_install,
      takeover_date,
      preferred_technician,
      rented,
      econtract_expiry_date,
      warranty_date,
      amc_start_date,
      amc_end_date,
      frequency,
    } = req.body;

    // Validate required field
    if (!system_id) {
      return res.status(400).json({ message: "system_id is required" });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res
        .status(404)
        .json({ message: `No site found with id ${siteId}` });
    }

    // Check if system exists
    const system = await System.findById(system_id);
    if (!system) {
      return res
        .status(404)
        .json({ message: `No system found with id ${system_id}` });
    }

    // Check if system already added to site
    const alreadyExists = site.site_systems.some(
      (sys) => sys.system_id.toString() === system_id
    );
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "System already added to this site" });
    }

    // Build the new site_systems entry with proper validation
    const newSystemEntry = {
      system_id,
      status: status || "New",
      date_of_sale,
      date_of_install,
      takeover_date,
      preferred_technician,
      rented: rented || false,
      econtract_expiry_date: econtract_expiry_date,
      warranty_date,
      amc_start_date,
      amc_end_date,
      frequency,
    };

    // Only add installed_by if it's a valid ObjectId
    if (installed_by && mongoose.Types.ObjectId.isValid(installed_by)) {
      newSystemEntry.installed_by = installed_by;
    }

    // Validate AMC dates if provided
    if (amc_start_date && amc_end_date) {
      if (new Date(amc_start_date) > new Date(amc_end_date)) {
        return res.status(400).json({
          message: "AMC start date cannot be after end date",
        });
      }
    }

    site.site_systems.push(newSystemEntry);
    await site.save();

    // Populate the system details in the response
    await site.populate([
      { path: "site_systems.system_id", model: "System" },
      {
        path: "site_systems.installed_by",
        model: "User",
        select: "firstname lastname",
      },
    ]);

    return res.status(201).json({
      message: "System added to site successfully",
      site,
    });
  } catch (error) {
    console.error("Error adding system to site:", error);
    return res.status(500).json({
      message: "Failed to add system to site",
      error: error.message,
    });
  }
};

const updateSiteSystem = async (req, res) => {
  try {
    const { siteId, systemId } = req.params;
    const updateData = req.body;

    // Find the site and the specific system
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Find the system in site_systems
    const systemIndex = site.site_systems.findIndex(
      (sys) => sys._id.toString() === systemId
    );
    if (systemIndex === -1) {
      return res.status(404).json({ message: "System not found in this site" });
    }

    // Update the system data
    const systemToUpdate = site.site_systems[systemIndex];

    // Update basic fields
    if (updateData.status) systemToUpdate.status = updateData.status;
    if (updateData.date_of_sale)
      systemToUpdate.date_of_sale = updateData.date_of_sale;
    if (updateData.date_of_install)
      systemToUpdate.date_of_install = updateData.date_of_install;
    if (updateData.takeover_date)
      systemToUpdate.takeover_date = updateData.takeover_date;
    if (updateData.rented !== undefined)
      systemToUpdate.rented = updateData.rented;
    if (updateData.econtract_expiry_date)
      systemToUpdate.econtract_expiry_date = updateData.econtract_expiry_date;
    if (updateData.warranty_date)
      systemToUpdate.warranty_date = updateData.warranty_date;
    if (updateData.preferred_technician)
      systemToUpdate.preferred_technician = updateData.preferred_technician;

    // Update AMC related fields
    if (updateData.amc_start_date)
      systemToUpdate.amc_start_date = updateData.amc_start_date;
    if (updateData.amc_end_date)
      systemToUpdate.amc_end_date = updateData.amc_end_date;
    if (updateData.frequency) systemToUpdate.frequency = updateData.frequency;

    // Validate AMC dates if both are being updated
    if (updateData.amc_start_date && updateData.amc_end_date) {
      if (
        new Date(updateData.amc_start_date) > new Date(updateData.amc_end_date)
      ) {
        return res.status(400).json({
          message: "AMC start date cannot be after end date",
        });
      }
    }

    // Update installed_by if provided and valid
    if (updateData.installed_by) {
      if (mongoose.Types.ObjectId.isValid(updateData.installed_by)) {
        systemToUpdate.installed_by = updateData.installed_by;
      } else {
        return res.status(400).json({ message: "Invalid technician ID" });
      }
    }

    // Mark the array as modified
    site.markModified("site_systems");
    await site.save();

    // Populate the updated data for response
    await site.populate([
      { path: "site_systems.system_id", model: "System" },
      {
        path: "site_systems.installed_by",
        model: "User",
        select: "firstname lastname",
      },
    ]);

    res.status(200).json({
      message: "System updated successfully",
      system: site.site_systems[systemIndex],
    });
  } catch (error) {
    console.error("Error updating site system:", error);
    res.status(500).json({
      message: "Server error while updating system",
      error: error.message,
    });
  }
};

module.exports = {
  addSystemToSite,
  updateSiteSystem,
  removeSystemFromSite,
  getAllSystems,
  getSystem,
  createSystem,
  updateSystem,
};
