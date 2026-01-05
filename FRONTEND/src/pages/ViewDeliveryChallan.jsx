import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";

const ViewDeliveryChallan = () => {
    const { id } = useParams();

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
            if (!hasPermission("Manage Stock")) {
                return navigate("/UserUnAuthorized/Manage Delivery Challan");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [printMode, setPrintMode] = useState(false);
    const printRef = useRef();


    useEffect(() => {
        const fetchChallan = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/delivery-challans/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch delivery challan');
                }

                const challanData = await response.json();
                setChallan(challanData);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching delivery challan:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChallan();
    }, [id]);

    const handlePrint = () => {
        setPrintMode(true);

        setTimeout(() => {
            window.print();

            const revert = () => {
                setPrintMode(false);
                window.removeEventListener("afterprint", revert);
            };

            window.addEventListener("afterprint", revert);
            setPrintMode(false);
        }, 300);
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-lg text-gray-600">Loading delivery challan details...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <strong>Error:</strong> {error}
                            </div>
                            <Link
                                to="/delivery-chalan"
                                className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                            >
                                Back to Delivery Challans
                            </Link>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!challan) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <strong>Not Found:</strong> Delivery challan not found
                            </div>
                            <Link
                                to="/delivery-chalan"
                                className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                            >
                                Back to Delivery Challans
                            </Link>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${printMode ? 'print-mode' : ''}`}>
            {!printMode && (
                <>
                    <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                    <div className="flex">
                        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    </div>
                </>
            )}

            <main className={`${printMode ? 'p-0' : 'flex-1 mt-20 sm:mt-24 p-4 lg:ml-64'}`}>
                {/* Header Section */}
                {!printMode && (
                    <div className="mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="mb-6 lg:mb-0">
                                <Link
                                    to="/delivery-chalan"
                                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                                >
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                    </svg>
                                    Back to Delivery Challans
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Challan Details</h1>
                                <p className="text-gray-600">View and manage delivery documentation</p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handlePrint}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m4 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-6a2 2 0 00-2 2v4a2 2 0 002 2z"></path>
                                    </svg>
                                    Print
                                </button>
                                <Link
                                    to={`/edit-delivery-chalan/${challan._id}`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Edit
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Challan Details Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                    {/* Header with Challan Number and Status */}
                    <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{challan.challan_id}</h2>
                                <p className="text-sm text-gray-600">Created on {new Date(challan.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${challan.is_invoiced
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {challan.is_invoiced ? 'Invoiced' : 'Pending Invoice'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Company and Customer Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Company Details</h3>
                                {challan.company ? (
                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-900">{challan.company.company_name}</p>
                                        {challan.company.address && <p className="text-gray-600">{challan.company.address}</p>}
                                        {challan.company.contact_number && <p className="text-gray-600">{challan.company.contact_number}</p>}
                                        {challan.company.email && <p className="text-gray-600">{challan.company.email}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No company information available</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Customer Details</h3>
                                {challan.customer ? (
                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-900">{challan.customer.customer_name}</p>
                                        {/* {challan.customer.address && <p className="text-gray-600">{challan.customer.address}</p>}
                                        {challan.customer.contact_number && <p className="text-gray-600">{challan.customer.contact_number}</p>}
                                        {challan.customer.email && <p className="text-gray-600">{challan.customer.email}</p>} */}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No customer information available</p>
                                )}
                            </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Delivery Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Delivery Date:</span>
                                        <span className="font-medium">{new Date(challan.delivery_date).toLocaleDateString()}</span>
                                    </div>
                                    {challan.site && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery Site:</span>
                                            <span className="font-medium">{challan.site.site_name}</span>
                                        </div>
                                    )}
                                    {challan.call_number && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Call Reference:</span>
                                            <span className="font-medium">#{challan.call_number.call_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">PO Information</h3>
                                <div className="space-y-3">
                                    {challan.reference_po_no && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">PO Number:</span>
                                            <span className="font-medium">{challan.reference_po_no}</span>
                                        </div>
                                    )}
                                    {challan.po_date && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">PO Date:</span>
                                            <span className="font-medium">{new Date(challan.po_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {challan.reference_invoice_number && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Invoice Number:</span>
                                            <span className="font-medium">{challan.reference_invoice_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Products</h3>
                            {challan.products && challan.products.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {challan.products.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.product?.product_name || product.product_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {product.product?.product_code || product.product_code}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {product.serial_number || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {product.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.obsolete
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {product.obsolete ? 'Obsolete' : 'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">Total Quantity:</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {challan.products.reduce((sum, product) => sum + product.quantity, 0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 py-4 text-center">No products in this delivery challan</p>
                            )}
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Additional Information</h3>
                                <div className="space-y-3">
                                    {challan.remarks && (
                                        <div>
                                            <span className="text-gray-600 block mb-1">Remarks:</span>
                                            <p className="text-gray-900">{challan.remarks}</p>
                                        </div>
                                    )}
                                    {challan.issued_by && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Issued By:</span>
                                            <span className="font-medium">
                                                {challan.issued_by.firstname} {challan.issued_by.lastname}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Last Updated:</span>
                                        <span className="font-medium">{new Date(challan.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print-only footer */}
                {printMode && (
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p>This is a computer-generated document. No signature is required.</p>
                        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    </div>
                )}
            </main>

            <style>{`
                @media print {
                    body, html {
                        background: white !important;
                        font-size: 12pt;
                    }
                    .print-mode {
                        padding: 0;
                        margin: 0;
                    }
                    .print-mode main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        margin-top: 0 !important;
                    }
                    .bg-white {
                        background: white !important;
                        box-shadow: none !important;
                        border: 1px solid #ccc !important;
                    }
                    .bg-gradient-to-r {
                        background: #f0f4f8 !important;
                    }
                    .border, .border-b, .border-t {
                        border-color: #ddd !important;
                    }
                    nav, .hidden.print\\:hidden {
                        display: none !important;
                    }
                    .flex.justify-between {
                        page-break-inside: avoid;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    html, body {
                      width: 100%;
                      height: auto !important;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                  
                    .print-mode * {
                      visibility: visible !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewDeliveryChallan;