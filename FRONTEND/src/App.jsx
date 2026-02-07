import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddCompany from './pages/AddCompany'
import SearchCompany from './pages/SearchCompany'
import NotFound from './pages/NotFound'
import AddUser from './pages/AddUser'
import ManageUsers from './pages/ManageUsers'
import UserAccessType from './pages/UserAccessType'
import AddCustomer from './pages/AddCustomer'
import ManageCustomer from './pages/ManageCustomer'
import AddSite from './pages/AddSite'
import ManageSites from './pages/ManageSite'
import ViewSite from './pages/ViewSite'
import AddSalesEnquiry from './pages/AddSalesEnquiry'
import SearchSalesEnquiry from './pages/SearchSalesEnquiry'
import AddQuotation from './pages/AddQuotation'
import SearchQuotation from './pages/SearchQuotation'
import AddJobCosting from './pages/AddJobCosting'
import ManageJobCosting from './pages/ManageJobCosting'
import ResetPassword from './pages/Resetpassword'
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from './pages/Unauthorised'
import EngineerDashboard from './pages/Engineer/Dashboard'
import EditCompany from './pages/EditCompany'
import ViewCompany from './pages/ViewCompany'
import ViewCustomer from './pages/ViewCustomer'
import EditCustomer from './pages/EditCustomer'
import EditSite from './pages/EditSite'
import System from './pages/System'
import DocketType from './pages/DocketType'
import ReferenceCode from './pages/ReferenceCode'
import ProductCode from './pages/ProductCode'
import EditSalesEnquiry from './pages/EditSalesEnquiry'
import ViewSalesEnquiry from './pages/ViewSalesEnquiry'
import AddSupplier from './pages/AddSupplier'
import SearchSupplier from './pages/SearchSupplier'
import ViewSupplier from './pages/ViewSupplier'
import EditSupplier from './pages/EditSUpplier'
import ManageProducts from './pages/ManageProducts'
import EditProduct from './pages/EditProduct'
import ViewProduct from './pages/ViewProduct'
import EditQuotation from './pages/EditQuotation'
import ViewJobCosting from './pages/ViewJobCosting'
import EditJobCosting from './pages/EditJobCosting'
import AddCall from './pages/AddCall'
import SiteSystem from './pages/SiteSystem'
import SiteSystems from './pages/SiteSystems'
import CallList from './pages/Calls'
import ViewCalls from './pages/ViewCalls'
import EditCalls from './pages/EditCalls'
import Diary from './pages/Diary'
import TaskDetails from './pages/Engineer/TaskDetails'
import AddPurchaseOrder from './pages/AddPurchaseOrder'
import PurchaseOrderManage from './pages/ManagePurchaseOrder'
import ViewPurchaseOrderDetails from './pages/ViewPurchaseOrderDetails'
import EditPurchaseOrder from './pages/EditPurchaseOrder'
import PriceList from './pages/PriceList'
import DeliveryChallan from './pages/DeliveryChallan'
import EditDeliveryChallan from './pages/EditDeliveryChallan'
import ViewDeliveryChallan from './pages/ViewDeliveryChallan'
import SiteReports from './pages/SIteReports'
import EngineerReport from './pages/EngineerReport'
import SupplierReport from './pages/SupplierReport'
import SalesEnquiryReport from './pages/SalesEnquiryReport'
import PurchaseOrderReport from './pages/PurchaseOrderReport'
import DeliveryChallanReport from './pages/DeliveryChallanReport'
import ManageCabinet from './pages/ManageCabinet'
import SetUserPermission from './pages/SetUserPermission'
import ProtectedRouteUser from './components/ProtectedRouteUser'
import UserUnAuthorised from './pages/UserUnAuthorised'
import DiaryCalendar from './pages/DiaryCalendar'
import CustomerDocuments from './pages/CustomerDocuments'
import Calender from './pages/Engineer/Calender'

const res = await fetch(`${import.meta.env.VITE_API_URL}/access-types`);
const data1 = await res.json();
const arr = data1.map(name => name.name)
arr.push("Super Admin");
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/UserUnAuthorized/:page" element={<UserUnAuthorised />} />

      <Route element={<ProtectedRoute allowedRoles={arr} />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Company Information */}
        <Route path="/add-company" element={<AddCompany />} />
        <Route path="/search-company" element={<SearchCompany />} />
        <Route path="/update-company/:id" element={<EditCompany />} />
        <Route path="/view-company/:id" element={<ViewCompany />} />

        {/* User Information */}
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/search-user" element={<ManageUsers />} />
        <Route path="/user-access-type" element={<UserAccessType />} />
        <Route element={<ProtectedRouteUser allowedRoles={["Super Admin"]} />}>
          <Route path="/set-user-permission" element={<SetUserPermission />} />
        </Route>

        {/* Customer Information */}
        <Route path="/add-customer" element={<AddCustomer />} />
        <Route path="/search-customer" element={<ManageCustomer />} />
        <Route path="/customers/view/:id" element={<ViewCustomer />} />
        <Route path="/customers/edit/:id" element={<EditCustomer />} />
        <Route path="/customers/:customerId/documents" element={<CustomerDocuments />} />

        {/* Add Site */}
        <Route path="/add-site" element={<AddSite />} />
        <Route path="/search-site" element={<ManageSites />} />
        <Route path="/view-site/:siteId" element={<ViewSite />} />
        <Route path="/update-site/:siteId" element={<EditSite />} />
        <Route path="/site/:siteId/system" element={<SiteSystem />} />
        <Route path="/site-systems/:siteId/:systemId" element={<SiteSystems />} />

        {/* Add Sales Enquiry */}
        <Route path="/add-sales-enquiry" element={<AddSalesEnquiry />} />
        <Route path="/search-sales-enquiry" element={<SearchSalesEnquiry />} />
        <Route path="/view-sales-enquiry/:id" element={<ViewSalesEnquiry />} />
        <Route path="/edit-sales-enquiry/:id" element={<EditSalesEnquiry />} />

        <Route path="/add-quotation" element={<AddQuotation />} />
        <Route path="/search-quotation" element={<SearchQuotation />} />
        <Route path="/edit-quotation/:id" element={<EditQuotation />} />


        {/* Add Job Costing*/}
        <Route path="/add-job-costing" element={<AddJobCosting />} />
        <Route path="/manage-job-costing" element={<ManageJobCosting />} />
        <Route path="/view-job-costing/:id" element={<ViewJobCosting />} />
        <Route path="/edit-job-costing/:id" element={<EditJobCosting />} />

        {/* Add Call */}
        <Route path="/add-call" element={<AddCall />} />
        <Route path="/calls" element={<CallList />} />
        <Route path="/calls/:id" element={<ViewCalls />} />
        <Route path="/calls/:id/edit" element={<EditCalls />} />

        {/* Manage Diary  */}
        <Route path="/manage-diary" element={<Diary />} />
        <Route path="/manage-diary/:engineer_id/:call_no" element={<Diary />} />
        <Route path="/diary-calendar" element={<DiaryCalendar />} />

        {/* Supplier  */}
        <Route path="/add-supplier" element={<AddSupplier />} />
        <Route path="/search-supplier" element={<SearchSupplier />} />
        <Route path="/view-supplier/:id" element={<ViewSupplier />} />
        <Route path="/edit-supplier/:id" element={<EditSupplier />} />

        {/* Manage Stock */}
        <Route path="/price-list" element={<PriceList />} />
        <Route path="/delivery-chalan" element={<DeliveryChallan />} />
        <Route path="/edit-delivery-chalan/:id" element={<EditDeliveryChallan />} />
        <Route path="/view-delivery-chalan/:id" element={<ViewDeliveryChallan />} />

        {/* Purchase Order */}
        <Route path="/add-purchase-order" element={<AddPurchaseOrder />} />
        <Route path="/manage-purchase-order" element={<PurchaseOrderManage />} />
        <Route path="/purchase-orders/view/:id" element={<ViewPurchaseOrderDetails />} />
        <Route path="/purchase-orders/edit/:id" element={<EditPurchaseOrder />} />

        {/* Company Codes */}
        <Route path="/product-code" element={<ProductCode />} />
        <Route path="/manage/product-code" element={<ManageProducts />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/view-product/:id" element={<ViewProduct />} />
        <Route path="/manage-system" element={<System />} />
        <Route path="/docket-type" element={<DocketType />} />
        <Route path="/reference-code" element={<ReferenceCode />} />


        {/* Reports */}
        <Route path="/site-report" element={<SiteReports />} />
        <Route path="/engineer-report" element={<EngineerReport />} />
        <Route path="/supplier-report" element={<SupplierReport />} />
        <Route path="/sales-enquiry-report" element={<SalesEnquiryReport />} />
        <Route path="/purchase-order-report" element={<PurchaseOrderReport />} />
        <Route path="/delivery-challan-report" element={<DeliveryChallanReport />} />


        {/* Cabinets */}
        <Route path="/manage-cabinet" element={<ManageCabinet />} />

      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Engineer"]} />}>
        {/* Engineer Panel */}
        <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
        <Route path="/engineer/calender" element={<Calender />} />
        <Route path="/engineer/task/:taskId" element={<TaskDetails />} />
      </Route>


      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
