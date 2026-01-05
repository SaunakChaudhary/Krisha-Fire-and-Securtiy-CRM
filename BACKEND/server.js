const express = require("express");
const cors = require("cors");
const DB = require("./database/Db");
const { seedDefaults } = require("./utils/seed");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      'https://ems.krishaengg.com'  ,
      'http://localhost:5173'
    ],
    credentials: true,
  })  
);

// Serve static files from /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const UserAccessRouter = require("./routes/user_access_type.routes");
const UserRouter = require("./routes/user.routes");
const AuthRouter = require("./routes/auth.routes");
const CompanyRouter = require("./routes/company.routes");
const CustomerRouter = require("./routes/customer.routes");
const SiteRouter = require("./routes/site.routes");
const SystemRouter = require("./routes/system.routes");
const WorkTypeRouter = require("./routes/worktype.routes");
const ReferenceCodeRouter = require("./routes/reference.routes");
const SalesEnquiryRouter = require("./routes/sales_enquiry.routes");
const SupplierRouter = require("./routes/supplier.routes");
const ProductRoutes = require("./routes/product.routes");
const QuotationRoutes = require("./routes/quotation.routes");
const JobCostingRoutes = require("./routes/jobcosting.routes");
const CallRoutes = require("./routes/call.routes");
const DiaryRoutes = require("./routes/diary.routes");
const TaskReportRoutes = require("./routes/taskReport.routes");
const purchaseOrderRoutes = require("./routes/purchaseorder.routes");
const deliveryChallanRoutes = require("./routes/deliveryChallan.routes");
const cabinetRoutes = require("./routes/cabinet.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const permissionRoutes = require("./routes/permission.routes");
const customerDocumentRoutes = require("./routes/customerDocument.routes");

app.use("/api/auth", AuthRouter);
app.use("/api/access-types", UserAccessRouter);
app.use("/api/user", UserRouter);
app.use("/api/company", CompanyRouter);
app.use("/api/customers", CustomerRouter);
app.use("/api/sites", SiteRouter);
app.use("/api/systems", SystemRouter);
app.use("/api/work-type", WorkTypeRouter);
app.use("/api/reference-codes", ReferenceCodeRouter);
app.use("/api/sales-enquiry", SalesEnquiryRouter);
app.use("/api/supplier", SupplierRouter);
app.use("/api/products", ProductRoutes);
app.use("/api/quotation", QuotationRoutes);
app.use("/api/job-costing", JobCostingRoutes);
app.use("/api/calls", CallRoutes);
app.use("/api/diary", DiaryRoutes);
app.use("/api/taskReport", TaskReportRoutes);
app.use("/api/purchase-order", purchaseOrderRoutes);
app.use("/api/delivery-challans", deliveryChallanRoutes);
app.use("/api/cabinet", cabinetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/customer-document", customerDocumentRoutes);
DB()
  .then(async () => {
    await seedDefaults();
    app.listen(process.env.PORT, () => {
      console.log(`Listening on PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
