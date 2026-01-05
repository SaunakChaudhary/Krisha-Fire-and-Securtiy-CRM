import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, Edit, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";

const SearchSalesEnquiry = () => {
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
            if (!hasPermission("Manage Sales Enquiry")) {
                return navigate("/UserUnAuthorized/Manage Sales Enquiry");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useState({
        company: '',
        customer: '',
        status: '',
        fromDate: '',
        toDate: '',
        salesPerson: ''
    });
    const [enquiries, setEnquiries] = useState([]);
    const [filteredEnquiries, setFilteredEnquiries] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [expandedFilters, setExpandedFilters] = useState(true);
    const [mobileView, setMobileView] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setMobileView(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        const fetchSalesEnquiry = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/sales-enquiry`);
                const data = await response.json();

                setEnquiries(data);
                setFilteredEnquiries(data);
            } catch (error) {
                console.error("Error fetching enquiries:", error);
                toast.error("Failed to load enquiries");
            } finally {
                setLoading(false);
            }
        };

        fetchSalesEnquiry();
    }, []);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = () => {
        const filtered = enquiries.filter(enquiry => {
            const enquiryDate = enquiry.enquiryOn ? new Date(enquiry.enquiryOn) : null;
            const fromDate = searchParams.fromDate ? new Date(searchParams.fromDate) : null;
            const toDate = searchParams.toDate ? new Date(searchParams.toDate) : null;

            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            if (enquiryDate) enquiryDate.setHours(12, 0, 0, 0);

            const companyMatch = searchParams.company === '' ||
                (enquiry.company?.company_name?.toLowerCase().includes(searchParams.company.toLowerCase()));

            const customerMatch = searchParams.customer === '' ||
                (enquiry.customer?.customer_name?.toLowerCase().includes(searchParams.customer.toLowerCase()));

            const statusMatch = searchParams.status === '' ||
                enquiry.status === searchParams.status;

            const dateMatch = (searchParams.fromDate === '' || (enquiryDate && enquiryDate >= fromDate)) &&
                (searchParams.toDate === '' || (enquiryDate && enquiryDate <= toDate));

            const salesPersonMatch = searchParams.salesPerson === '' ||
                (enquiry.assignedTo && (
                    enquiry.assignedTo.firstname?.toLowerCase().includes(searchParams.salesPerson.toLowerCase()) ||
                    enquiry.assignedTo.lastname?.toLowerCase().includes(searchParams.salesPerson.toLowerCase())
                ));

            return companyMatch && customerMatch && statusMatch && dateMatch && salesPersonMatch;
        });

        setFilteredEnquiries(filtered);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchParams({
            company: '',
            customer: '',
            status: '',
            fromDate: '',
            toDate: '',
            salesPerson: ''
        });
        setFilteredEnquiries(enquiries);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedEnquiries = [...filteredEnquiries].sort((a, b) => {
            // Handle nested object sorting
            let aValue, bValue;

            if (key.includes('.')) {
                const keys = key.split('.');
                aValue = keys.reduce((obj, k) => (obj && obj[k]) ? obj[k] : '', a);
                bValue = keys.reduce((obj, k) => (obj && obj[k]) ? obj[k] : '', b);
            } else {
                aValue = a[key];
                bValue = b[key];
            }

            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        setFilteredEnquiries(sortedEnquiries);
    };



    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const toggleFilters = () => {
        setExpandedFilters(!expandedFilters);
    };

    const StatusBadge = ({ status }) => {
        let bgColor, textColor;
        switch (status) {
            case 'New Assigned':
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                break;
            case 'Quoted':
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-800';
                break;
            case 'Won':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                break;
            case 'Lost':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            default:
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-800';
        }
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                {status}
            </span>
        );
    };

    // Priority badge component
    const PriorityBadge = ({ priority }) => {
        let bgColor, textColor;
        switch (priority) {
            case 'High':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            case 'Medium':
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-800';
                break;
            default:
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
        }
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                {priority}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Sales Enquiries</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Search and manage sales enquiries</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={toggleFilters}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <Filter size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Filters</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Filters */}
                        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden transition-all duration-300 ${expandedFilters ? 'max-h-[550px]' : 'max-h-[60px]'}`}>
                            <button
                                type="button"
                                onClick={toggleFilters}
                                className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center">
                                    <Search className="text-red-600 mr-3" size={18} />
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Search Filters
                                    </h2>
                                </div>
                                {expandedFilters ? (
                                    <ChevronUp size={18} className="text-gray-500" />
                                ) : (
                                    <ChevronDown size={18} className="text-gray-500" />
                                )}
                            </button>
                            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={searchParams.company}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                        placeholder="Search by company"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer</label>
                                    <input
                                        type="text"
                                        name="customer"
                                        value={searchParams.customer}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                        placeholder="Search by customer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={searchParams.status}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="New Assigned">New Assigned</option>
                                        <option value="Quoted">Quoted</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                        <option value="Hold">Hold</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Enquiry Date</label>
                                    <input
                                        type="date"
                                        name="fromDate"
                                        value={searchParams.fromDate}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Enquiry Date</label>
                                    <input
                                        type="date"
                                        name="toDate"
                                        value={searchParams.toDate}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sales Person</label>
                                    <input
                                        type="text"
                                        name="salesPerson"
                                        value={searchParams.salesPerson}
                                        onChange={handleSearchChange}
                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                        placeholder="Search by sales person"
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                            </div>
                        )}

                        {/* Results Count */}
                        {!loading && (
                            <div className="mb-4 text-xs sm:text-sm text-gray-600">
                                Showing {filteredEnquiries.length} results
                            </div>
                        )}

                        {/* Enquiries Table - Desktop View */}
                        {!mobileView && !loading && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('enquiry_code')}
                                            >
                                                <div className="flex items-center">
                                                    Enquiry Code
                                                    {sortConfig.key === 'enquiry_code' && (
                                                        <span className="ml-1">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('company.company_name')}
                                            >
                                                <div className="flex items-center">
                                                    Company
                                                    {sortConfig.key === 'company.company_name' && (
                                                        <span className="ml-1">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('customer.customer_name')}
                                            >
                                                <div className="flex items-center">
                                                    Customer
                                                    {sortConfig.key === 'customer.customer_name' && (
                                                        <span className="ml-1">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Site
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center">
                                                    Status
                                                    {sortConfig.key === 'status' && (
                                                        <span className="ml-1">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('enquiryOn')}
                                            >
                                                <div className="flex items-center">
                                                    Enquiry Date
                                                    {sortConfig.key === 'enquiryOn' && (
                                                        <span className="ml-1">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned To
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Expected Value
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.length > 0 ? (
                                            currentItems.map((enquiry) => (
                                                <tr key={enquiry._id} className="hover:bg-gray-50">
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                        {enquiry.enquiry_code}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                        {enquiry.company?.company_name || '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                        {enquiry.customer?.customer_name || '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                        {enquiry.site?.site_name || '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                        {enquiry.site?.contact_name || '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <StatusBadge status={enquiry.status} />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                        {formatDate(enquiry.enquiryOn)}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                        {enquiry.assignedTo ? `${enquiry.assignedTo.firstname} ${enquiry.assignedTo.lastname}` : '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                        {enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                        <PriorityBadge priority={enquiry.priority || 'Medium'} />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => navigate(`/view-sales-enquiry/${enquiry._id}`)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="Edit"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/edit-sales-enquiry/${enquiry._id}`)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="11" className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                                                    {enquiries.length === 0 ? 'No enquiries found' : 'No enquiries match your search criteria'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Enquiries Cards - Mobile View */}
                        {mobileView && !loading && (
                            <div className="space-y-4">
                                {currentItems.length > 0 ? (
                                    currentItems.map((enquiry) => (
                                        <div key={enquiry._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-800">{enquiry.enquiry_code}</h3>
                                                    <p className="text-xs text-gray-600">{enquiry.company?.company_name || '-'}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        // onClick={()=> navigate(`/view-sales-enquiry/${id}`)}
                                                        onClick={() => navigate(`/view-sales-enquiry/${enquiry._id}`)}

                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/edit-sales-enquiry/${enquiry._id}`)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <p className="text-gray-500">Customer</p>
                                                    <p className="text-gray-800">{enquiry.customer?.customer_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Site</p>
                                                    <p className="text-gray-800">{enquiry.site?.site_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Contact</p>
                                                    <p className="text-gray-800">{enquiry.site?.contact_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Status</p>
                                                    <p className="text-gray-800"><StatusBadge status={enquiry.status} /></p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Date</p>
                                                    <p className="text-gray-800">{formatDate(enquiry.enquiryOn)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Assigned To</p>
                                                    <p className="text-gray-800">
                                                        {enquiry.assignedTo ? `${enquiry.assignedTo.firstname} ${enquiry.assignedTo.lastname}` : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Value</p>
                                                    <p className="text-gray-800">
                                                        {enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Priority</p>
                                                    <p className="text-gray-800"><PriorityBadge priority={enquiry.priority || 'Medium'} /></p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center text-sm text-gray-500">
                                        {enquiries.length === 0 ? 'No enquiries found' : 'No enquiries match your search criteria'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && filteredEnquiries.length > 0 && (
                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-0">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastItem, filteredEnquiries.length)}
                                    </span>{' '}
                                    of <span className="font-medium">{filteredEnquiries.length}</span> results
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => paginate(pageNum)}
                                                className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === pageNum ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">...</span>
                                    )}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <button
                                            onClick={() => paginate(totalPages)}
                                            className="px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-50"
                                        >
                                            {totalPages}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SearchSalesEnquiry;