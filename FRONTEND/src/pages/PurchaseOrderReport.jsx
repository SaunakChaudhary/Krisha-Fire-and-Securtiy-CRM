import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from "../assets/logo.png";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const PurchaseOrderReport = () => {

  const { user } = useContext(AuthContext);

  const navigate = useNavigate();
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Get access type ID from user object (handles both structures)
  const getAccessTypeId = () => {
    if (!user) return null;

    // Check if user has nested user object (user.user)
    if (user.user && user.user.accesstype_id) {
      return user.user.accesstype_id;
    }

    // Check if user has direct accesstype_id with _id property
    if (user.accesstype_id && user.accesstype_id._id) {
      return user.accesstype_id._id;
    }

    // Check if user has direct accesstype_id as string
    if (user.accesstype_id && typeof user.accesstype_id === 'string') {
      return user.accesstype_id;
    }

    return null;
  };

  const fetchPermissions = async () => {
    const accessTypeId = getAccessTypeId();
    if (!accessTypeId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/permissions/${accessTypeId}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
        setPermissionsLoaded(true);
      } else {
        console.error("Failed to fetch permissions");
        setPermissionsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissionsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const hasPermission = (moduleName) => {
    if (!permissions) return false;
    return permissions.permissions && permissions.permissions[moduleName] === true;
  };

  // Check permissions and redirect if needed
  useEffect(() => {
    if (permissionsLoaded) {
      if (!hasPermission("Manage Reports")) {
        return navigate("/UserUnAuthorized/Manage Reports");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filters, purchaseOrders]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/purchase-order`);
      const data = await response.json();
      setPurchaseOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...purchaseOrders];

    if (filters.status) {
      if (filters.status === 'On Order') {
        filtered = filtered.filter(order => order.on_order);
      } else if (filters.status === 'Delivered') {
        filtered = filtered.filter(order => order.delivered);
      } else if (filters.status === 'Pending') {
        filtered = filtered.filter(order => !order.on_order && !order.delivered);
      }
    }

    if (filters.startDate) {
      filtered = filtered.filter(order => new Date(order.date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(order => new Date(order.date) <= endDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.PurchaseOrderNumber.toLowerCase().includes(searchTerm) ||
        (order.supplier_id && order.supplier_id.supplierName && order.supplier_id.supplierName.toLowerCase().includes(searchTerm)) ||
        (order.company_id && order.company_id.company_name && order.company_id.company_name.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getOrderStatus = (order) => {
    if (order.delivered) return 'Delivered';
    if (order.on_order) return 'On Order';
    return 'Pending';
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // ===== Header =====
    doc.setFillColor(253, 236, 236);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.addImage(logoPng, "PNG", 15, 8, 55, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(229, 9, 20);
    doc.text("KRISHA FIRE AND SECURITY", pageWidth - 14, 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 20, 20);
    doc.text("Sun Gravitas, 1110, Char Rasta,", pageWidth - 14, 20, { align: "right" });
    doc.text("near Jivraj Park Bridge, Rajmani Society,", pageWidth - 14, 25, { align: "right" });
    doc.text("Satellite, Shyamal, Ahmedabad, Gujarat 380015", pageWidth - 14, 30, { align: "right" });
    doc.text("Phone: 90999 26117", pageWidth - 14, 35, { align: "right" });

    // Report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PURCHASE ORDER REPORT", pageWidth / 2, 50, { align: "center" });

    // Add generated date
    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, 14, 60);

    // Add filter info if applied
    let filterInfo = 'Filters: ';
    if (filters.status) filterInfo += `Status: ${filters.status} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 70);
    }

    // Prepare table data
    const tableData = filteredOrders.map(order => [
      order.PurchaseOrderNumber,
      order.company_id?.company_name || 'N/A',
      order.supplier_id?.supplierName || 'N/A',
      new Date(order.date).toLocaleDateString(),
      order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A',
      getOrderStatus(order),
      `₹${order.total_amount?.toLocaleString() || '0'}`
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 75,
      head: [['PO Number', 'Company', 'Supplier', 'Order Date', 'Due Date', 'Status', 'Total Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 20, 60],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Krisha Fire & Security - Confidential', 105, 290, { align: 'center' });
    }

    doc.save('purchase_order_report.pdf');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredOrders.map(order => ({
        'PO Number': order.PurchaseOrderNumber,
        'Company': order.company_id?.company_name || 'N/A',
        'Supplier': order.supplier_id?.supplierName || 'N/A',
        'Order Date': new Date(order.date).toLocaleDateString(),
        'Due Date': order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A',
        'Status': getOrderStatus(order),
        'Total Amount': order.total_amount || 0,
        'GST Inclusive': order.gst_inclusive || 0,
        'Gross Amount': order.gross_amount || 0,
        'Placed By': order.placed_by?.name || 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');
    XLSX.writeFile(workbook, 'purchase_order_report.xlsx');
  };

  const previewPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // ===== Header =====
    doc.setFillColor(253, 236, 236);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.addImage(logoPng, "PNG", 15, 8, 60, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(229, 9, 20);
    doc.text("KRISHA FIRE AND SECURITY", pageWidth - 14, 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 20, 20);
    doc.text("Sun Gravitas, 1110, Char Rasta,", pageWidth - 14, 20, { align: "right" });
    doc.text("near Jivraj Park Bridge, Rajmani Society,", pageWidth - 14, 25, { align: "right" });
    doc.text("Satellite, Shyamal, Ahmedabad, Gujarat 380015", pageWidth - 14, 30, { align: "right" });
    doc.text("Phone: 90999 26117", pageWidth - 14, 35, { align: "right" });

    // Report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PURCHASE ORDER REPORT", pageWidth / 2, 50, { align: "center" });

    // Add generated date
    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, 14, 60);

    // Add filter info if applied
    let filterInfo = 'Filters: ';
    if (filters.status) filterInfo += `Status: ${filters.status} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 70);
    }

    // Prepare table data
    const tableData = filteredOrders.map(order => [
      order.PurchaseOrderNumber,
      order.company_id?.company_name || 'N/A',
      order.supplier_id?.supplierName || 'N/A',
      new Date(order.date).toLocaleDateString(),
      order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A',
      getOrderStatus(order),
      `${order.total_amount?.toLocaleString() || '0'}`
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 75,
      head: [['PO Number', 'Company', 'Supplier', 'Order Date', 'Due Date', 'Status', 'Total Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 20, 60],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Krisha Fire & Security - Confidential', 105, 290, { align: 'center' });
    }

    // Open PDF in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfDataUrl(pdfUrl);
    setPdfPreviewOpen(true);
  };

  const closePreview = () => {
    setPdfPreviewOpen(false);
    if (pdfDataUrl) {
      URL.revokeObjectURL(pdfDataUrl);
    }
    setPdfDataUrl('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
          <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
            <div className="flex justify-center items-center h-64">
              <p>Loading purchase orders...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
        <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Purchase Order Report</h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="On Order">On Order</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by PO number, company, supplier"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>

              <button
                onClick={downloadExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </button>

              <button
                onClick={previewPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview PDF
              </button>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
              </p>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">PO Number</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Supplier</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b border-gray-200">{order.PurchaseOrderNumber}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{order.company_id?.company_name || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{order.supplier_id?.supplierName || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatus(order) === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              getOrderStatus(order) === 'On Order' ? 'bg-blue-100 text-blue-800' :
                                getOrderStatus(order) === 'Delivered' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {getOrderStatus(order)}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {order.total_amount ? `₹${order.total_amount.toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF Preview Modal */}
          {pdfPreviewOpen && (
            <div className="fixed inset-0 z-50 overflow-auto bg-black/75 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-lg w-full h-full max-w-6xl max-h-screen flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadPDF}
                      className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={closePreview}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <iframe
                    src={pdfDataUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                    type="application/pdf"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PurchaseOrderReport;