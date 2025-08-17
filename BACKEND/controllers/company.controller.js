const Company = require("../models/company.model.js");
const Address = require("../models/address.model.js");

const createCompany = async (req, res) => {
  try {
    const registeredAddress = await Address.create(req.body.registered_address);

    let communicationAddress;
    if (
      req.body.same_as_registered_address === "true" ||
      req.body.same_as_registered_address === true
    ) {
      communicationAddress = registeredAddress;
    } else {
      communicationAddress = await Address.create(
        req.body.communication_address
      );
    }

    // 🧠 Generate company_code
    const lastCompany = await Company.findOne(
      {},
      {},
      { sort: { createdAt: -1 } }
    );
    let newCode = "COMP001"; // Default for first company

    if (lastCompany && lastCompany.company_code) {
      const lastCode = lastCompany.company_code;
      const numberPart = parseInt(lastCode.replace("COMP", ""));
      const nextNumber = numberPart + 1;
      newCode = "COMP" + nextNumber.toString().padStart(3, "0");
    }

    let logoPath = req.file ? req.file.path : undefined;

    const companyData = {
      company_code: newCode, // ✅ Set auto code here
      company_name: req.body.company_name,
      contact_name: req.body.contact_name,
      status: req.body.status,
      currency: req.body.currency,
      GST_No: req.body.GST_No,
      primary_company: req.body.primary_company || false,
      logo: logoPath,
      registered_address_id: registeredAddress._id,
      communication_address_id: communicationAddress._id,
      same_as_registered_address:
        req.body.same_as_registered_address === "true" ||
        req.body.same_as_registered_address === true,
    };

    const company = await Company.create(companyData);
    return res
      .status(201)
      .json({ message: "Company created successfully", company });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("registered_address_id")
      .populate("communication_address_id");

    return res.status(200).json(companies);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate("registered_address_id")
      .populate("communication_address_id");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json(company);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update addresses if provided
    if (req.body.registered_address) {
      await Address.findByIdAndUpdate(
        company.registered_address_id,
        req.body.registered_address
      );
    }

    if (
      req.body.communication_address &&
      !(
        req.body.same_as_registered_address === true ||
        req.body.same_as_registered_address === "true"
      )
    ) {
      await Address.findByIdAndUpdate(
        company.communication_address_id,
        req.body.communication_address
      );
    }

    // Handle logo update
    let logoPath = company.logo;
    if (req.file) {
      logoPath = req.file.path;
      // Here you would typically delete the old logo file
    }

    const updateData = {
      company_name: req.body.company_name || company.company_name,
      contact_name: req.body.contact_name || company.contact_name,
      status: req.body.status || company.status,
      currency: req.body.currency || company.currency,
      GST_No: req.body.GST_No || company.GST_No,
      primary_company:
        req.body.primary_company !== undefined
          ? req.body.primary_company
          : company.primary_company,
      logo: logoPath,
      same_as_registered_address:
        req.body.same_as_registered_address !== undefined
          ? req.body.same_as_registered_address === "true" ||
            req.body.same_as_registered_address === true
          : company.same_as_registered_address,
    };

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("registered_address_id")
      .populate("communication_address_id");

    return res.status(200).json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Delete associated addresses
    await Address.findByIdAndDelete(company.registered_address_id);
    if (!company.same_as_registered_address) {
      await Address.findByIdAndDelete(company.communication_address_id);
    }

    // Here you would typically delete the logo file if it exists

    await Company.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
