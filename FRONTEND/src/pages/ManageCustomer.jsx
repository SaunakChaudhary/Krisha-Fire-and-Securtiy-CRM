import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, User, MapPin, Phone, Mail, Edit, Trash2, Eye, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";
import * as XLSX from 'xlsx';

const CustomerSearch = () => {

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
            if (!hasPermission("Manage Customer")) {
                return navigate("/UserUnAuthorized/Manage Customer");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);


    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    // Fetch customers and companies from API
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch customers
            const customersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
            if (!customersResponse.ok) {
                throw new Error('Failed to fetch customers');
            }
            const customersData = await customersResponse.json();
            setCustomers(customersData);
            setFilteredCustomers(customersData);

            // Fetch companies
            const companiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/company`);

            const companiesData = await companiesResponse.json();
            setCompanies(companiesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    // Filter customers based on search term and company selection
    useEffect(() => {
        let filtered = [...customers];

        // Apply company filter if selected
        if (selectedCompany) {
            filtered = filtered.filter(customer =>
                customer.company_id?._id === selectedCompany
            );
        }

        // Apply search term filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(customer =>
                customer.id?.toLowerCase().includes(term) ||
                customer.customer_name?.toLowerCase().includes(term) ||
                customer.GST_No?.toLowerCase().includes(term) ||
                customer.mobile_no?.includes(term) ||
                customer.address?.city?.toLowerCase().includes(term) ||
                customer.address?.state?.toLowerCase().includes(term)
            );
        }

        setFilteredCustomers(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, selectedCompany, customers]);

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleCustomerExpand = (customerId) => {
        setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
    };

    const statusColors = {
        Active: "bg-green-100 text-green-800",
        Inactive: "bg-red-100 text-red-800",
        lead: "bg-blue-100 text-blue-800",
        customer: "bg-green-100 text-green-800"
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'lead': return 'Lead';
            case 'customer': return 'Customer';
            default: return status;
        }
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

                // Send to backend
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/customers/import`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(parsedData),
                    }
                );

                const data1 = await response.json();

                if (response.ok) {
                    toast.success("Customers uploaded successfully!");
                    console.log(data1.errors)
                    fetchData();
                } else {
                    const errorData = await response.json();
                    console.error("Failed to upload users:", errorData);
                }
            } catch (err) {
                console.error("Error processing file:", err);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Search</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Search and manage customer records</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="block w-full sm:w-48 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company._id} value={company._id}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>
                                <Link
                                    to="/add-customer"
                                    className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <User size={14} className="mr-1 sm:mr-2" />
                                    <span className="inline font-semibold">Add New Customer</span>
                                </Link>
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
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Customer Number, Name, GST No, Contact Number, City, State..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table (md and larger) */}
                                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer ID
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Company
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    GST No
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Location
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paginatedCustomers.map((customer) => (
                                                <tr key={customer._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {customer.customer_code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {customer.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {customer.company_id?.company_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {customer.GST_No || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                            {customer.mobile_no || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center mt-1">
                                                            <Mail className="h-4 w-4 text-gray-400 mr-1" />
                                                            {customer.email || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                            {customer.address?.city || 'N/A'}, {customer.address?.state || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status] || 'bg-gray-100 text-gray-800'}`}>
                                                            {getStatusText(customer.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link
                                                                to={`/customers/view/${customer._id}`}
                                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                                title="View"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                            <Link
                                                                to={`/customers/edit/${customer._id}`}
                                                                className="text-green-600 hover:text-green-900 p-1"
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards (sm and smaller) */}
                                <div className="md:hidden space-y-4">
                                    {paginatedCustomers.map((customer) => (
                                        <div key={customer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                            <button
                                                onClick={() => toggleCustomerExpand(customer._id)}
                                                className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center">
                                                    <User className="text-red-600 mr-3" size={18} />
                                                    <div>
                                                        <h3 className="truncate text-sm font-medium text-gray-900">{customer.customer_name}</h3>
                                                        <p className="truncate text-xs text-gray-500">{customer.customer_code}</p>
                                                    </div>
                                                </div>
                                                {expandedCustomer === customer._id ? (
                                                    <ChevronUp className="text-gray-500" size={18} />
                                                ) : (
                                                    <ChevronDown className="text-gray-500" size={18} />
                                                )}
                                            </button>
                                            <div className={`transition-all duration-300 overflow-hidden ${expandedCustomer === customer._id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="p-4 border-t border-gray-200">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Company</p>
                                                            <p className="font-medium">{customer.company_id?.company_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">GST No</p>
                                                            <p className="font-medium">{customer.GST_No || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Contact</p>
                                                            <p className="font-medium flex items-center">
                                                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                                {customer.mobile_no || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Email</p>
                                                            <p className="line-clamp-2  font-medium flex items-center">
                                                                <Mail className="h-4 w-4 text-gray-400 mr-1" />
                                                                {customer.email || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-gray-500">Location</p>
                                                            <p className="font-medium flex items-center">
                                                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                                {customer.address?.city || 'N/A'}, {customer.address?.state || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Status</p>
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status] || 'bg-gray-100 text-gray-800'}`}>
                                                                {getStatusText(customer.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end space-x-2">
                                                        <Link
                                                            to={`/customers/view/${customer._id}`}
                                                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                        >
                                                            <Eye className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                            View
                                                        </Link>
                                                        <Link
                                                            to={`/customers/edit/${customer._id}`}
                                                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                                                        >
                                                            <Edit className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Empty State */}
                                {filteredCustomers.length === 0 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                        <p className="text-gray-500">No customers found matching your search criteria.</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredCustomers.length > itemsPerPage && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                        <div className="text-sm text-gray-500">
                                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{filteredCustomers.length}</span> customers
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerSearch;