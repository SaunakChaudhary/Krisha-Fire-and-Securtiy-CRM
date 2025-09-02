import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from "../assets/logo.png";

const DeliveryChallanReport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveryChallans, setDeliveryChallans] = useState([]);
  const [filteredChallans, setFilteredChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    isInvoiced: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState('');

  useEffect(() => {
    fetchDeliveryChallans();
  }, []);

  useEffect(() => {
    filterChallans();
  }, [filters, deliveryChallans]);

  const fetchDeliveryChallans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-challans`);
      const data = await response.json();
      setDeliveryChallans(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching delivery challans:', error);
      setLoading(false);
    }
  };

  const filterChallans = () => {
    let filtered = [...deliveryChallans];

    if (filters.isInvoiced !== '') {
      filtered = filtered.filter(challan => challan.is_invoiced === (filters.isInvoiced === 'true'));
    }

    if (filters.startDate) {
      filtered = filtered.filter(challan => new Date(challan.delivery_date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(challan => new Date(challan.delivery_date) <= endDate);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(challan =>
        challan.challan_id.toLowerCase().includes(searchTerm) ||
        (challan.company && challan.company.company_name && challan.company.company_name.toLowerCase().includes(searchTerm)) ||
        (challan.customer && challan.customer.customer_name && challan.customer.customer_name.toLowerCase().includes(searchTerm)) ||
        (challan.reference_po_no && challan.reference_po_no.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredChallans(filtered);
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
    if (filters.isInvoiced !== '') filterInfo += `Invoiced: ${filters.isInvoiced === 'true' ? 'Yes' : 'No'} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 80);
    }

    // Prepare table data
    const tableData = filteredChallans.map(challan => [
      challan.challan_id,
      challan.company?.company_name || 'N/A',
      challan.customer?.customer_name || 'N/A',
      new Date(challan.delivery_date).toLocaleDateString(),
      challan.reference_po_no || 'N/A',
      challan.is_invoiced ? 'Yes' : 'No',
      challan.reference_invoice_number || 'N/A',
      challan.products.reduce((total, product) => total + product.quantity, 0)
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 55,
      head: [['Challan ID', 'Company', 'Customer', 'Delivery Date', 'PO Number', 'Invoiced', 'Invoice Number', 'Total Items']],
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

    doc.save('delivery_challan_report.pdf');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredChallans.map(challan => ({
        'Challan ID': challan.challan_id,
        'Company': challan.company?.company_name || 'N/A',
        'Customer': challan.customer?.customer_name || 'N/A',
        'Delivery Date': new Date(challan.delivery_date).toLocaleDateString(),
        'PO Date': challan.po_date ? new Date(challan.po_date).toLocaleDateString() : 'N/A',
        'PO Number': challan.reference_po_no || 'N/A',
        'Invoiced': challan.is_invoiced ? 'Yes' : 'No',
        'Invoice Number': challan.reference_invoice_number || 'N/A',
        'Total Items': challan.products.reduce((total, product) => total + product.quantity, 0),
        'Issued By': challan.issued_by?.name || 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Challans');
    XLSX.writeFile(workbook, 'delivery_challan_report.xlsx');
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
    if (filters.isInvoiced !== '') filterInfo += `Invoiced: ${filters.isInvoiced === 'true' ? 'Yes' : 'No'} `;
    if (filters.startDate) filterInfo += `From: ${filters.startDate} `;
    if (filters.endDate) filterInfo += `To: ${filters.endDate} `;
    if (filters.search) filterInfo += `Search: ${filters.search} `;

    if (filterInfo !== 'Filters: ') {
      doc.text(filterInfo, 14, 80);
    }

    // Prepare table data
    const tableData = filteredChallans.map(challan => [
      challan.challan_id,
      challan.company?.company_name || 'N/A',
      challan.customer?.customer_name || 'N/A',
      new Date(challan.delivery_date).toLocaleDateString(),
      challan.reference_po_no || 'N/A',
      challan.is_invoiced ? 'Yes' : 'No',
      challan.reference_invoice_number || 'N/A',
      challan.products.reduce((total, product) => total + product.quantity, 0)
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: 55,
      head: [['Challan ID', 'Company', 'Customer', 'Delivery Date', 'PO Number', 'Invoiced', 'Invoice Number', 'Total Items']],
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
              <p>Loading delivery challans...</p>
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Delivery Challan Report</h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoiced Status</label>
                <select
                  name="isInvoiced"
                  value={filters.isInvoiced}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All</option>
                  <option value="true">Invoiced</option>
                  <option value="false">Not Invoiced</option>
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
                  placeholder="Search by ID, company, customer, PO"
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
                Showing {filteredChallans.length} of {deliveryChallans.length} challans
              </p>
            </div>

            {/* Challans Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Challan ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Delivery Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">PO Number</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invoiced</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invoice Number</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChallans.length > 0 ? (
                    filteredChallans.map((challan) => (
                      <tr key={challan._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b border-gray-200">{challan.challan_id}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{challan.company?.company_name || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">{challan.customer?.customer_name || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {new Date(challan.delivery_date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">{challan.reference_po_no || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${challan.is_invoiced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {challan.is_invoiced ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200">{challan.reference_invoice_number || 'N/A'}</td>
                        <td className="py-2 px-4 border-b border-gray-200">
                          {challan.products.reduce((total, product) => total + product.quantity, 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                        No delivery challans found
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

export default DeliveryChallanReport;