import React, { useEffect, useState, useRef, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from "../assets/logo.png";
jsPDF.autoTable = autoTable;
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const SupplierReport = () => {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/permissions/${accessTypeId}`);
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
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState('');
    const logoLoaded = useRef(false);
    const logoImage = useRef(null);

    // Preload logo
    useEffect(() => {
        const img = new Image();
        img.src = logoPng;
        img.onload = () => {
            logoLoaded.current = true;
            logoImage.current = img;
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/supplier/`);

                if (!response.ok) {
                    throw new Error('Failed to fetch supplier data');
                }

                const data = await response.json();
                setSuppliers(data.data || data);
                setFilteredSuppliers(data.data || data);
            } catch (error) {
                console.error('Error fetching supplier data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...suppliers];

        if (filters.status) {
            result = result.filter(supplier => supplier.status === filters.status);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(supplier =>
                supplier.supplierName.toLowerCase().includes(searchTerm) ||
                supplier.supplierCode.toLowerCase().includes(searchTerm) ||
                (supplier.gstNo && supplier.gstNo.toLowerCase().includes(searchTerm)) ||
                (supplier.contacts && supplier.contacts.some(contact =>
                    contact.contact_person.toLowerCase().includes(searchTerm) ||
                    contact.email.toLowerCase().includes(searchTerm)
                ))
            );
        }

        setFilteredSuppliers(result);
    }, [filters, suppliers]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            search: ''
        });
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Draw header background (red theme)
        doc.setFillColor(253, 236, 236); // crimson red
        doc.rect(0, 0, pageWidth, 40, "F");

        // Add logo if loaded
        if (logoLoaded.current && logoImage.current) {
            try {
                doc.addImage(logoImage.current, "PNG", 15, 8, 60, 24);
            } catch (error) {
                console.error("Error adding logo to PDF:", error);
            }
        }

        // Company Name
        doc.setFontSize(12);
        doc.setTextColor(229, 9, 20); // #E50914
        doc.setFont('helvetica', 'bold');
        doc.text('KRISHA FIRE AND SECURITY', 200, 15, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(122, 12, 12); // dark maroon
        doc.text('Sun Gravitas, 1110, Char Rasta,', 200, 20, { align: 'right' });
        doc.text('near Jivraj Park Bridge, Rajmani Society,', 200, 25, { align: 'right' });
        doc.text('Satellite, Shyamal, Ahmedabad, Gujarat 380015', 200, 30, { align: 'right' });
        doc.text('Phone: 90999 26117', 200, 35, { align: 'right' });

        // Report Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 20, 60);
        doc.text("SUPPLIER REPORT", 14, 55);

        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Report Generated: ${new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}`,
            14,
            63
        );
        doc.text(`Total Records: ${filteredSuppliers.length}`, 14, 70);

        // Filters
        let filterY = 77;
        if (filters.status) {
            doc.text(`Status: ${filters.status}`, 14, filterY);
            filterY += 7;
        }
        if (filters.search) {
            doc.text(`Search: ${filters.search}`, 14, filterY);
            filterY += 7;
        }

        // Stats box
        const activeCount = filteredSuppliers.filter((s) => s.status === "Active").length;
        const inactiveCount = filteredSuppliers.filter((s) => s.status === "Inactive").length;
        const pendingCount = filteredSuppliers.filter((s) => s.status === "Pending Approval").length;
        const subcontractorCount = filteredSuppliers.filter((s) => s.subcontractor && s.subcontractor.isSubcontractor).length;

        doc.setFillColor(255, 245, 245);
        doc.rect(14, filterY + 5, pageWidth - 28, 25, "F");
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, filterY + 5, pageWidth - 28, 25, "S");

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("SUMMARY STATISTICS", 18, filterY + 15);

        doc.setFont("helvetica", "normal");
        doc.text(`Active: ${activeCount}`, 18, filterY + 22);
        doc.text(`Inactive: ${inactiveCount}`, 60, filterY + 22);
        doc.text(`Pending: ${pendingCount}`, 100, filterY + 22);
        doc.text(`Subcontractors: ${subcontractorCount}`, 140, filterY + 22);

        // Table
        const tableStartY = filterY + 40;

        autoTable(doc, {
            startY: tableStartY,
            head: [["Code", "Name", "Status", "GST No", "Contact Person", "Email", "Phone"]],
            body: filteredSuppliers.map((supplier) => [
                supplier.supplierCode,
                supplier.supplierName,
                supplier.status,
                supplier.gstNo || "N/A",
                supplier.contacts?.[0]?.contact_person || "N/A",
                supplier.contacts?.[0]?.email || "N/A",
                supplier.contacts?.[0]?.mobileNo || supplier.contacts?.[0]?.telephoneNo || "N/A",
            ]),
            theme: "striped",
            headStyles: {
                fillColor: [220, 20, 60], // red header
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 10,
                halign: "center",
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: [255, 245, 245], // light red tint
            },
            margin: { top: 10, left: 14, right: 14 },
            didDrawPage: function (data) {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${data.pageNumber} | Generated by Supplier Management System | ${new Date().toLocaleDateString()}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: "center" }
                );
            },
        });

        return doc;
    };

    const exportToPDF = () => {
        const doc = generatePDF();
        doc.save(`supplier-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const previewPDF = () => {
        const doc = generatePDF();
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setPdfDataUrl(pdfUrl);
        setPdfPreviewOpen(true);
    };

    const closePreview = () => {
        setPdfPreviewOpen(false);
        setPdfDataUrl('');
    };

    const exportToExcel = () => {
        // Main worksheet with detailed data
        const mainData = filteredSuppliers.map(supplier => ({
            'Supplier Code': supplier.supplierCode,
            'Supplier Name': supplier.supplierName,
            'Status': supplier.status,
            'GST No': supplier.gstNo || 'N/A',
            'Contact Person': supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].contact_person : 'N/A',
            'Email': supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].email : 'N/A',
            'Phone': supplier.contacts && supplier.contacts.length > 0 ?
                (supplier.contacts[0].mobileNo || supplier.contacts[0].telephoneNo || 'N/A') : 'N/A',
            'Address': supplier.registeredAddress ?
                `${supplier.registeredAddress.address_line_1}, ${supplier.registeredAddress.city}, ${supplier.registeredAddress.postCode}` : 'N/A',
            'Bank Name': supplier.bankDetails ? supplier.bankDetails.bankName : 'N/A',
            'Account Number': supplier.bankDetails ? supplier.bankDetails.accountNumber : 'N/A',
            'IFSC Code': supplier.bankDetails ? supplier.bankDetails.ifsc : 'N/A',
            'Currency': supplier.analysis ? supplier.analysis.currencyCode : 'N/A',
            'Is Subcontractor': supplier.subcontractor ? (supplier.subcontractor.isSubcontractor ? 'Yes' : 'No') : 'No',
            'Credit Limit': supplier.terms ? supplier.terms.creditLimit || 'N/A' : 'N/A',
            'Created At': new Date(supplier.createdAt).toLocaleDateString()
        }));

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Main data worksheet
        const mainWorksheet = XLSX.utils.json_to_sheet(mainData);

        // Set column widths for optimal viewing
        const columnWidths = [
            { wch: 15 }, // Supplier Code
            { wch: 25 }, // Supplier Name
            { wch: 12 }, // Status
            { wch: 20 }, // GST No
            { wch: 20 }, // Contact Person
            { wch: 30 }, // Email
            { wch: 20 }, // Phone
            { wch: 40 }, // Address
            { wch: 20 }, // Bank Name
            { wch: 20 }, // Account Number
            { wch: 15 }, // IFSC Code
            { wch: 10 }, // Currency
            { wch: 15 }, // Is Subcontractor
            { wch: 15 }, // Credit Limit
            { wch: 12 }  // Created At
        ];

        mainWorksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Supplier Reports');

        // Add metadata
        workbook.Props = {
            Title: 'Supplier Report',
            Subject: 'Supplier Management Analytics',
            Author: 'Supplier Management System',
            CreatedDate: new Date()
        };

        XLSX.writeFile(workbook, `supplier-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Inactive': return 'bg-red-100 text-red-800';
            case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading supplier reports...</p>
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
                <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-3 sm:p-4 md:p-6 lg:pl-80">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Supplier Reports</h1>
                                <p className="text-gray-600 mt-1">Comprehensive supplier management analytics and reporting</p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
                                <span className="text-sm text-gray-500 sm:mr-4 self-start sm:self-center">
                                    {filteredSuppliers.length} record{filteredSuppliers.length !== 1 ? 's' : ''} found
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Filters</h2>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800 self-start sm:self-center"
                            >
                                Clear all filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending Approval">Pending Approval</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    placeholder="Search by name, code, GST no, or contact"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Export Reports</h2>
                                <p className="text-sm text-gray-600 mt-1">Download filtered data in your preferred format</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                                <button
                                    onClick={previewPDF}
                                    disabled={filteredSuppliers.length === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview PDF
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    disabled={filteredSuppliers.length === 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export PDF
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={filteredSuppliers.length === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2 V5a2 2 0 012-2h5.586a1 1 0 01. 707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Total Suppliers</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{filteredSuppliers.length}</div>
                            <div className="text-xs text-gray-400 mt-1">All suppliers</div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Active</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-green-600">
                                {filteredSuppliers.filter(s => s.status === 'Active').length}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {filteredSuppliers.length > 0
                                    ? `${((filteredSuppliers.filter(s => s.status === 'Active').length / filteredSuppliers.length) * 100).toFixed(1)}% active rate`
                                    : 'No data'}
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Subcontractors</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-600">
                                {filteredSuppliers.filter(s => s.subcontractor && s.subcontractor.isSubcontractor).length}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Specialized suppliers</div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Pending Approval</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
                                {filteredSuppliers.filter(s => s.status === 'Pending Approval').length}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Awaiting review</div>
                        </div>
                    </div>

                    {/* Suppliers Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Supplier Details</h2>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="block lg:hidden">
                            {filteredSuppliers.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>No suppliers found matching your filters</p>
                                    <button
                                        onClick={clearFilters}
                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Clear filters to see all suppliers
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredSuppliers.map((supplier) => (
                                        <div key={supplier._id} className="p-4 sm:p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {supplier.supplierName.charAt(0)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {supplier.supplierName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {supplier.supplierCode}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
                                                    {supplier.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">GST No:</span>
                                                    <div className="font-medium">{supplier.gstNo || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Contact:</span>
                                                    <div className="font-medium">
                                                        {supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].contact_person : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Email:</span>
                                                    <div className="font-medium">
                                                        {supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].email : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Phone:</span>
                                                    <div className="font-medium">
                                                        {supplier.contacts && supplier.contacts.length > 0 ?
                                                            (supplier.contacts[0].mobileNo || supplier.contacts[0].telephoneNo || 'N/A') : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {supplier.subcontractor && supplier.subcontractor.isSubcontractor && (
                                                <div className="mt-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        Subcontractor
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                                                    View Details
                                                </button>
                                                <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            GST No
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact Person
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSuppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-lg font-medium">No suppliers found</p>
                                                    <p className="text-sm">Try adjusting your filters or check back later.</p>
                                                    <button
                                                        onClick={clearFilters}
                                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSuppliers.map((supplier) => (
                                            <tr key={supplier._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {supplier.supplierCode}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {supplier.supplierName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
                                                        {supplier.status}
                                                    </span>
                                                    {supplier.subcontractor && supplier.subcontractor.isSubcontractor && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Subcontractor
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {supplier.gstNo || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].contact_person : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0].email : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {supplier.contacts && supplier.contacts.length > 0 ?
                                                            (supplier.contacts[0].mobileNo || supplier.contacts[0].telephoneNo || 'N/A') : 'N/A'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for large datasets */}
                        {filteredSuppliers.length > 50 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(50, filteredSuppliers.length)}</span> of{' '}
                                        <span className="font-medium">{filteredSuppliers.length}</span> results
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                            Previous
                                        </button>
                                        <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PDF Preview Modal */}
                    {pdfPreviewOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white w-11/12 h-5/6 rounded-lg shadow-lg overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
                                    <h2 className="font-semibold text-gray-800">PDF Preview</h2>
                                    <button
                                        onClick={closePreview}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Close
                                    </button>
                                </div>
                                <iframe
                                    src={pdfDataUrl}
                                    title="PDF Preview"
                                    className="flex-1 w-full"
                                    style={{ border: "none" }}
                                />
                                <div className="p-3 border-t bg-gray-50 flex justify-end">
                                    <button
                                        onClick={exportToPDF}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default SupplierReport;