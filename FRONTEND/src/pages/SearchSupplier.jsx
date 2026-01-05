import React, { useState, useEffect, useContext } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const SearchSupplier = () => {
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
            if (!hasPermission("Manage Supplier")) {
                return navigate("/UserUnAuthorized/Manage Supplier");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        query: '',
        status: '',
        page: 1,
        limit: 20
    });
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const queryString = new URLSearchParams();
            if (searchParams.query) queryString.append('query', searchParams.query);
            if (searchParams.status) queryString.append('status', searchParams.status);
            queryString.append('page', searchParams.page);
            queryString.append('limit', searchParams.limit);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/supplier/?${queryString}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch suppliers');
            const data = await response.json();
            setSuppliers(data.data);
            setTotalSuppliers(data.total || 0);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [searchParams.page, searchParams.status, searchParams.query]);

    const handleSearchChange = (e) => {
        setSearchParams({ ...searchParams, query: e.target.value, page: 1 });
    };

    const handleStatusChange = (e) => {
        setSearchParams({ ...searchParams, status: e.target.value, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setSearchParams({ ...searchParams, page: newPage });
    };

    const resetFilters = () => {
        setSearchParams({
            query: '',
            status: '',
            page: 1,
            limit: 20
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet);

                // 🔥 Transform flat Excel → nested JSON for backend
                const formattedData = parsedData.map((row) => ({
                    supplierName: row.supplierName || "",
                    status: row.status || "Active",
                    gstNo: row.gstNo || "",

                    registeredAddress: {
                        address_line_1: row.reg_address_line_1 && row.reg_address_line_1 !== "-" ? row.reg_address_line_1 : "",
                        address_line_2: row.reg_address_line_2 && row.reg_address_line_2 !== "-" ? row.reg_address_line_2 : "",
                        address_line_3: row.reg_address_line_3 && row.reg_address_line_3 !== "-" ? row.reg_address_line_3 : "",
                        address_line_4: row.reg_address_line_4 && row.reg_address_line_4 !== "-" ? row.reg_address_line_4 : "",
                        postCode: row.reg_postCode || "",
                        country: row.reg_country || "",
                        state: row.reg_state || "",
                        city: row.reg_city || "",
                    },

                    communicationAddress: {
                        address_line_1: row.comm_address_line_1 && row.comm_address_line_1 !== "-" ? row.comm_address_line_1 : "",
                        address_line_2: row.comm_address_line_2 && row.comm_address_line_2 !== "-" ? row.comm_address_line_2 : "",
                        address_line_3: row.comm_address_line_3 && row.comm_address_line_3 !== "-" ? row.comm_address_line_3 : "",
                        address_line_4: row.comm_address_line_4 && row.comm_address_line_4 !== "-" ? row.comm_address_line_4 : "",
                        postCode: row.comm_postCode || "",
                        country: row.comm_country || "",
                        state: row.comm_state || "",
                        city: row.comm_city || "",
                    },

                    sameAsRegistered: row.sameAsRegistered === "TRUE" || row.sameAsRegistered === true,

                    contacts: [
                        {
                            title: row.contact_title || "",
                            contact_person: row.contact_person || "",
                            position: row.contact_position || "",
                            email: row.contact_email || "",
                            telephoneNo: row.contact_telephoneNo || "",
                            mobileNo: row.contact_mobileNo || "",
                        },
                    ],

                    bankDetails: {
                        bankName: row.bankName || "",
                        bankAddress: row.bankAddress || "",
                        accountNumber: row.accountNumber || "",
                        ifsc: row.ifsc || "",   // 🔥 Ensure always string, not undefined
                    },

                    terms: {
                        creditLimit: row.creditLimit || 0,
                        tradeDiscount: row.tradeDiscount || 0,
                        settlementDiscount: row.settlementDiscount || 0,
                        settlementDays: row.settlementDays || 0,
                        minOrderValue: row.minOrderValue || 0,
                        defaultPurchaseOrderSubmissionMethod: row.poMethod || "Email",
                    },

                    subcontractor: {
                        isSubcontractor: row.isSubcontractor === "TRUE" || row.isSubcontractor === true,
                        hasInsuranceDocuments: row.hasInsuranceDocuments === "TRUE" || row.hasInsuranceDocuments === true,
                        hasHealthSafetyPolicy: row.hasHealthSafetyPolicy === "TRUE" || row.hasHealthSafetyPolicy === true,
                        insuranceExpirationDate: row.insuranceExpirationDate || null,
                        healthSafetyPolicyExpirationDate: row.healthSafetyPolicyExpirationDate || null,
                    },

                    analysis: {
                        gstExempt: row.gstExempt === "TRUE" || row.gstExempt === true,
                        currencyCode: row.currencyCode || "INR",
                    },
                }));

                // ✅ send formattedData, not parsedData
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/supplier/import`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formattedData),
                    }
                );

                const data1 = await response.json();

                if (response.ok) {
                    toast.success(data1.message);
                    fetchSuppliers();
                } else {
                    console.error("Upload failed:", data1);
                }
            } catch (err) {
                console.error("Error processing file:", err);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    // Mobile-friendly table row component
    const MobileSupplierRow = ({ supplier }) => (
        <div className="border-b border-gray-200 p-4 space-y-2">
            <div className="flex justify-between">
                <h3 className="font-medium text-gray-900">{supplier.supplierName}</h3>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${supplier.status === 'Active' ? 'bg-green-100 text-green-800' :
                        supplier.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                    {supplier.status}
                </span>
            </div>
            <div className="text-sm text-gray-500">
                <p>GST: {supplier.gstNo || '-'}</p>
                <p>Contact: {supplier.contacts?.[0]?.contact_person || '-'}</p>
                <p>Location: {supplier.registeredAddress?.city || '-'}, {supplier.registeredAddress?.state || ''}</p>
            </div>
            <div className="flex space-x-4 pt-2">
                <NavLink
                    to={`/view-supplier/${supplier._id}`}
                    className="text-sm text-red-600 hover:text-red-900"
                >
                    Edit
                </NavLink>
                <NavLink
                    to={`/view-supplier/${supplier._id}`}
                    className="text-sm text-blue-600 hover:text-blue-900"
                >
                    View
                </NavLink>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                            <div className="mb-3 sm:mb-0">
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Search Suppliers</h1>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {totalSuppliers} suppliers found
                                </p>
                            </div>
                            <div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <Filter size={14} className="mr-1 sm:mr-2" />
                                    <span>Filters</span>
                                    {showFilters ? (
                                        <ChevronUp size={14} className="ml-1 sm:ml-2" />
                                    ) : (
                                        <ChevronDown size={14} className="ml-1 sm:ml-2" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center space-x-3 bg-white shadow-sm border rounded-lg px-4 py-2 w-fit">
                                <Upload className="w-5 h-5 text-blue-600" />
                                <label
                                    htmlFor="fileInput"
                                    className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                                >
                                    Upload Excel File
                                </label>
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Search and Filters Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
                            <div className="p-3 sm:p-6">
                                <div className="relative mb-3 sm:mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search suppliers..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                                        value={searchParams.query}
                                        onChange={handleSearchChange}
                                    />
                                </div>

                                {showFilters && (
                                    <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                    Status
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={searchParams.status}
                                                    onChange={handleStatusChange}
                                                >
                                                    <option value="">All Statuses</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="Pending Approval">Pending Approval</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={resetFilters}
                                                    className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-red-600"
                                                >
                                                    <X size={14} className="mr-1" />
                                                    Reset Filters
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Suppliers List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-6 sm:p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-600">Loading suppliers...</p>
                                </div>
                            ) : suppliers.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center">
                                    <p className="text-gray-500">No suppliers found matching your criteria</p>
                                </div>
                            ) : isMobile ? (
                                // Mobile view - card list
                                <div className="divide-y divide-gray-200">
                                    {suppliers.map((supplier) => (
                                        <MobileSupplierRow key={supplier._id} supplier={supplier} />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Supplier Code
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Supplier Name
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        GST No
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Contact
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Location
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {suppliers.map((supplier) => (
                                                    <tr key={supplier._id} className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {supplier.supplierCode}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {supplier.supplierName}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {supplier.gstNo || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {supplier.contacts?.[0]?.contact_person || '-'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {supplier.contacts?.[0]?.email || ''}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {supplier.registeredAddress?.city || '-'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {supplier.registeredAddress?.state || ''}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                    ${supplier.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                                        supplier.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                                                                            'bg-yellow-100 text-yellow-800'}`}
                                                            >
                                                                {supplier.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <NavLink
                                                                to={`/edit-supplier/${supplier._id}`}
                                                                className="text-red-600 hover:text-red-900 mr-4"
                                                            >
                                                                Edit
                                                            </NavLink>
                                                            <NavLink
                                                                to={`/view-supplier/${supplier._id}`}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                View
                                                            </NavLink>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalSuppliers > searchParams.limit && (
                                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button
                                                    onClick={() => handlePageChange(searchParams.page - 1)}
                                                    disabled={searchParams.page === 1}
                                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                                                        ${searchParams.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => handlePageChange(searchParams.page + 1)}
                                                    disabled={searchParams.page >= Math.ceil(totalSuppliers / searchParams.limit)}
                                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                                                        ${searchParams.page >= Math.ceil(totalSuppliers / searchParams.limit) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Showing <span className="font-medium">{(searchParams.page - 1) * searchParams.limit + 1}</span> to{' '}
                                                        <span className="font-medium">{Math.min(searchParams.page * searchParams.limit, totalSuppliers)}</span> of{' '}
                                                        <span className="font-medium">{totalSuppliers}</span> results
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                        <button
                                                            onClick={() => handlePageChange(searchParams.page - 1)}
                                                            disabled={searchParams.page === 1}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium 
                                                                ${searchParams.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            <span className="sr-only">Previous</span>
                                                            <ChevronLeft className="h-5 w-5" />
                                                        </button>
                                                        {Array.from({ length: Math.ceil(totalSuppliers / searchParams.limit) }, (_, i) => i + 1)
                                                            .slice(
                                                                Math.max(0, searchParams.page - 3),
                                                                Math.min(Math.ceil(totalSuppliers / searchParams.limit), searchParams.page + 2)
                                                            )
                                                            .map((page) => (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => handlePageChange(page)}
                                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                                                                        ${page === searchParams.page ? 'z-10 bg-red-50 border-red-500 text-red-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            ))}
                                                        <button
                                                            onClick={() => handlePageChange(searchParams.page + 1)}
                                                            disabled={searchParams.page >= Math.ceil(totalSuppliers / searchParams.limit)}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
                                                                ${searchParams.page >= Math.ceil(totalSuppliers / searchParams.limit) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            <span className="sr-only">Next</span>
                                                            <ChevronRight className="h-5 w-5" />
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SearchSupplier;