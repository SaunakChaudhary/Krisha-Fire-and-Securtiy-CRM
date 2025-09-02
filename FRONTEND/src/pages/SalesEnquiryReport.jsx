import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from "../assets/logo.png";

const SalesEnquiryReport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesEnquiries, setSalesEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
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
    fetchSalesEnquiries();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [filters, salesEnquiries]);

  const fetchSalesEnquiries = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-enquiry`);
      const data = await response.json();
      setSalesEnquiries(data);
      console.log(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales enquiries:', error);
      setLoading(false);
    }
  };

  const filterEnquiries = () => {
    let filtered = [...salesEnquiries];

    if (filters.status) {
      filtered = filtered.filter(enquiry => enquiry.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(enquiry => new Date(enquiry.createdAt) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(enquiry => new Date(enquiry.createdAt) <= endDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(enquiry =>
        enquiry.enquiry_code.toLowerCase().includes(searchTerm) ||
        (enquiry.company && enquiry.company.name && enquiry.company.name.toLowerCase().includes(searchTerm)) ||
        (enquiry.customer && enquiry.customer.name && enquiry.customer.name.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredEnquiries(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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

    // Add generated date
    const now = new Date();
    doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, 14, 45);

    // Add filter info if applied
    let filterInfo = 'Filters: ';
    if (filters.status) filterInfo += `Status: ${filters.status} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 80);
    }

    // Prepare table data
    const tableData = filteredEnquiries.map(enquiry => [
      enquiry.enquiry_code,
      enquiry.company?.name || 'N/A',
      enquiry.customer?.name || 'N/A',
      enquiry.status,
      new Date(enquiry.createdAt).toLocaleDateString(),
      enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : 'N/A'
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 55,
      head: [['Enquiry Code', 'Company', 'Customer', 'Status', 'Created Date', 'Expected Value']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 20, 60], // Red header (from logo)
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      margin: { top: 85 }
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

    doc.save('sales_enquiry_report.pdf');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredEnquiries.map(enquiry => ({
        'Enquiry Code': enquiry.enquiry_code,
        'Company': enquiry.company?.name || 'N/A',
        'Customer': enquiry.customer?.name || 'N/A',
        'Status': enquiry.status,
        'Created Date': new Date(enquiry.createdAt).toLocaleDateString(),
        'Expected Value': enquiry.expectedOrderValue || 'N/A',
        'Assigned To': enquiry.assignedTo?.name || 'N/A',
        'Sales Person': enquiry.salesPerson?.name || 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Enquiries');
    XLSX.writeFile(workbook, 'sales_enquiry_report.xlsx');
  };

  const previewPDF = async () => {
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

    // Add generated date
    const now = new Date();
    doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, 14, 45);

    // Add filter info if applied
    let filterInfo = 'Filters: ';
    if (filters.status) filterInfo += `Status: ${filters.status} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 80);
    }

    // Prepare table data
    const tableData = filteredEnquiries.map(enquiry => [
      enquiry.enquiry_code,
      enquiry.company?.name || 'N/A',
      enquiry.customer?.name || 'N/A',
      enquiry.status,
      new Date(enquiry.createdAt).toLocaleDateString(),
      enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : 'N/A'
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 55,
      head: [['Enquiry Code', 'Company', 'Customer', 'Status', 'Created Date', 'Expected Value']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 20, 60], // Red header (from logo)
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      margin: { top: 85 }
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

    // Revoke the object URL to free up memory
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
              <p>Loading sales enquiries...</p>
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Sales Enquiry Report</h1>

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
                  <option value="New Assigned">New Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
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
                  placeholder="Search by code, company, customer"
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
                Showing {filteredEnquiries.length} of {salesEnquiries.length} enquiries
              </p>
            </div>

            {/* Enquiries Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Enquiry Code</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expected Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enquiry) => (
                      <tr key={enquiry._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b border-gray-200">{enquiry.enquiry_code}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{enquiry.company?.company_name || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{enquiry.customer?.customer_name || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${enquiry.status === 'New Assigned' ? 'bg-blue-100 text-blue-800' :
                            enquiry.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              enquiry.status === 'Quoted' ? 'bg-purple-100 text-purple-800' :
                                enquiry.status === 'Won' ? 'bg-green-100 text-green-800' :
                                  enquiry.status === 'Lost' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                        No sales enquiries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

export default SalesEnquiryReport;