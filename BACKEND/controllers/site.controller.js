const Site = require("../models/site.model");
const CustomerModel = require("../models/customer.model");
const mongoose = require("mongoose");

// Create a new Site
exports.createSite = async (req, res) => {
  try {
    const {
      customer_id,
      site_name,
      address_line_1,
      postcode,
      country,
      state,
      city,
      premises_type,
      address_line_2,
      address_line_3,
      address_line_4,
      title,
      contact_name,
      contact_no,
      contact_email,
      position,
      route,
      distance,
      area,
      sales_person,
      admin_remarks,
      site_remarks,
    } = req.body;

    // Validate required fields
    if (
      !customer_id ||
      !site_name ||
      !address_line_1 ||
      !postcode ||
      !country ||
      !state ||
      !city ||
      !premises_type
    ) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // Validate customer_id
    if (!mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    // Validate premises_type
    const validPremisesTypes = [
      "COMMERCIAL_PROPERTY",
      "MANUFACTURING_INDUSTRY",
      "MULTIPLEX_INDUSTRY",
      "HOSPITAL",
      "other",
    ];
    if (!validPremisesTypes.includes(premises_type)) {
      return res.status(400).json({ error: "Invalid premises type" });
    }

    // Generate site_code
    const lastSite = await Site.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastSite && lastSite.site_code) {
      const match = lastSite.site_code.match(/^SITE-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const site_code = `SITE-${nextNumber.toString().padStart(4, "0")}`;

    // Create new site
    const newSite = new Site({
      site_code,
      customer_id,
      site_name,
      status: "New", // Default status
      address_line_1,
      address_line_2,
      address_line_3,
      address_line_4,
      postcode,
      country,
      state,
      city,
      title,
      contact_name,
      contact_no,
      contact_email,
      position,
      premises_type,
      route,
      distance,
      area,
      sales_person,
      admin_remarks,
      site_remarks,
    });

    const savedSite = await newSite.save();
    res.status(201).json(savedSite);
  } catch (error) {
    console.error("Error creating site:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all Sites with optional filtering
exports.getAllSites = async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    const filter = {};

    if (customer_id) {
      if (!mongoose.Types.ObjectId.isValid(customer_id)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }
      filter.customer_id = customer_id;
    }

    if (status) {
      if (!["New", "Live", "Dead"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      filter.status = status;
    }

    const sites = await Site.find(filter)
      .populate("customer_id")
      .sort({ createdAt: -1 });

    res.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single Site by ID
exports.getSiteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid site ID" });
    }

    const site = await Site.findById(id)
      .populate({
        path: "customer_id",
        populate: {
          path: "company_id",
        },
      })
      .populate({
        path: "site_systems.installed_by",
      })
      .populate({
        path: "site_systems.system_id",
      });

    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    res.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update Site by ID
exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid site ID" });
    }

    // Validate premises_type if provided in updates
    if (updates.premises_type) {
      const validPremisesTypes = [
        "COMMERCIAL_PROPERTY",
        "MANUFACTURING_INDUSTRY",
        "MULTIPLEX_INDUSTRY",
        "HOSPITAL",
        "other",
      ];
      if (!validPremisesTypes.includes(updates.premises_type)) {
        return res.status(400).json({ error: "Invalid premises type" });
      }
    }

    // Validate status if provided in updates
    if (updates.status && !["New", "Live", "Dead"].includes(updates.status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Prevent updating site_code
    if (updates.site_code) {
      delete updates.site_code;
    }

    const updatedSite = await Site.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedSite) {
      return res.status(404).json({ error: "Site not found" });
    }

    res.json(updatedSite);
  } catch (error) {
    console.error("Error updating site:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete Site by ID
exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid site ID" });
    }

    const deletedSite = await Site.findByIdAndDelete(id);

    if (!deletedSite) {
      return res.status(404).json({ error: "Site not found" });
    }

    res.json({ message: "Site deleted successfully" });
  } catch (error) {
    console.error("Error deleting site:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.bulkUploadSites = async (req, res) => {
  try {
    const sitesData = req.body;

    if (!Array.isArray(sitesData) || sitesData.length === 0) {
      return res.status(400).json({ message: "Invalid or empty data" });
    }

    const createdSites = [];
    const errors = [];

    // Get latest site_code for starting point
    const lastSite = await Site.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;

    if (lastSite && lastSite.site_code) {
      const match = lastSite.site_code.match(/^SITE-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    for (let i = 0; i < sitesData.length; i++) {
      const data = sitesData[i];
      try {
        // Auto-generate site_code
        const site_code = `SITE-${nextNumber.toString().padStart(4, "0")}`;
        nextNumber++;

        const customer = await CustomerModel.findOne({
          customer_code: data.customer_id,
        });

        const site = new Site({
          site_code,
          customer_id: customer._id,
          site_name: data.site_name,
          status: data.status || "New",

          // Address
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          address_line_3: data.address_line_3,
          address_line_4: data.address_line_4,
          postcode: data.postcode,
          country: data.country,
          state: data.state,
          city: data.city,

          // Contact Info
          title: data.title,
          contact_name: data.contact_name,
          contact_no: data.contact_no,
          contact_email: data.contact_email,
          position: data.position,

          // Other Details
          premises_type: data.premises_type,
          route: data.route,
          distance: data.distance,
          area: data.area,
          sales_person: data.sales_person,
          admin_remarks: data.admin_remarks,
          site_remarks: data.site_remarks,

          // Site Systems (if provided in Excel/JSON)
          site_systems: data.site_systems || [],
        });

        const savedSite = await site.save();
        createdSites.push(savedSite);
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err.message,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: "Partial success",
        inserted: createdSites.length,
        failed: errors.length,
        errors,
      });
    }

    res.status(201).json({
      message: "All sites uploaded successfully",
      count: createdSites.length,
    });
  } catch (error) {
    console.error("Bulk upload sites error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
