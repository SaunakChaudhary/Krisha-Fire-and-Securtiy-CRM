const express = require("express");
const upload = require("../middleware/upload.js");
const router = express.Router();

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getAllActiveCompanies
} = require("../controllers/company.controller.js");

router.post("/", upload.single("logo"), createCompany);
router.get("/", getAllActiveCompanies);
router.get("/active", getAllCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", upload.single("logo"), updateCompany);
router.delete("/:id", deleteCompany);
module.exports = router;
