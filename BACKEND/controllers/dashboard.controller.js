const SiteModel = require("../models/site.model");
const SalesEnquiryModel = require("../models/sales_enquiry.model");
const QuotationModel = require("../models/quotation.model");
const CallModel = require("../models/call.model");
const DCModel = require("../models/deliveryChallan.model");
const SupplierModel = require("../models/supplier.model");
const DiaryModel = require("../models/diary.model");
const CustomerModel = require("../models/customer.model");
const ProductModel = require("../models/product.model");

const dashboardDetails = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const expiringSites = await SiteModel.find(
      {
        $or: [
          { "site_systems.warranty_date": { $gte: today, $lte: next30Days } },
          { "site_systems.amc_end_date": { $gte: today, $lte: next30Days } },
        ],
      },
      {
        site_name: 1,
        site_code: 1,
        customer_id: 1,
        "site_systems.warranty_date": 1,
        "site_systems.system_id": 1,
        "site_systems.amc_end_date": 1,
      }
    )
      .populate("customer_id")
      .populate("site_systems.system_id");

    const allSites = await SiteModel.find();
    const salesEnquiries = await SalesEnquiryModel.find();
    const quotations = await QuotationModel.find().populate("sales_enquiry_id");
    const calls = await CallModel.find();
    const DCPendingInvoice = await DCModel.find();
    const Suppliers = await SupplierModel.find();
    const Diaries = await DiaryModel.find()
      .populate({
        path: "callLog",
        populate: [{ path: "call_type" },{ path: "site_id" },{ path: "site_system" }],
      });
    const TotalCustomers = await CustomerModel.find();
    const TotalProducts = await ProductModel.find();

    return res.status(200).json({
      AMCandWarrenty: expiringSites,
      SalesEnquiries: salesEnquiries,
      Quotations: quotations,
      Calls: calls,
      DCPendingInvoice: DCPendingInvoice,
      TotalSites: allSites,
      Suppliers: Suppliers,
      Diaries: Diaries,
      TotalCustomers: TotalCustomers,
      TotalProducts: TotalProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard details:", error);
    throw error;
  }
};

module.exports = {
  dashboardDetails,
};
