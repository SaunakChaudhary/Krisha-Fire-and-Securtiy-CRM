import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { User, MapPin, Mail, CreditCard, Building, Edit, ArrowLeft, ChevronUp, ChevronDown, Home, Plus, Phone, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const ViewCustomer = () => {

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

    const { id } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        address: false,
        financial: false,
        contact: false,
        lead: false,
        sites: true
    });
    const [customer, setCustomer] = useState(null);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sitesLoading, setSitesLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const customerResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${id}`);
                const customerData = await customerResponse.json();

                setCustomer(customerData);

                setSitesLoading(true);
                const sitesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/sites`);
                const sitesData = await sitesResponse.json();
                setSites(sitesData.filter(site => site.customer_id._id === id));
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'An error occurred while fetching data');
            } finally {
                setLoading(false);
                setSitesLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleEdit = () => {
        navigate(`/customers/edit/${id}`);
    };

    const handleAddSite = () => {
        navigate(`/add-site?customerId=${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center h-screen">
                    <p className="text-gray-600">Customer not found</p>
                </div>
            </div>
        );
    }

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
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
                                >
                                    <ArrowLeft size={18} className="mr-1" />
                                    <span className="text-sm">Back</span>
                                </button>
                                <div className="flex items-center">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mr-3">
                                        {customer.customer_name}
                                    </h1>
                                    <span className={`px-2 py-1 text-xs rounded-full ${customer.status === 'customer'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {customer.status === 'customer' ? 'Customer' : 'Lead'}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {customer.company_id?.company_name || 'No company assigned'}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Edit size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Edit Customer</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                            </div>
                        </div>

                        {/* Customer Details Sections */}
                        <div className="space-y-4">
                            {/* General Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('general')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <User className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            General Information
                                        </h2>
                                    </div>
                                    {expandedSections.general ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.general ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div className="sm:col-span-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Company</label>
                                            <div className="flex items-center">
                                                <Building className="text-gray-400 mr-2" size={16} />
                                                <p className="text-sm sm:text-base text-gray-800">
                                                    {customer.company_id?.company_name || 'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.customer_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">GST Number</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.GST_No || 'Not specified'}
                                                {customer.GST_Exempt && <span className="ml-2 text-xs text-red-600">(GST Exempt)</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">PAN Number</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.pan_no || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Status</label>
                                            <p className="text-sm sm:text-base text-gray-800 capitalize">{customer.status}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Created At</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sites Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('sites')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Home className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Sites ({sites.length})
                                        </h2>
                                    </div>
                                    <div className="flex items-center">
                                        {expandedSections.sites ? (
                                            <ChevronUp size={18} className="text-gray-500" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-500" />
                                        )}
                                    </div>
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.sites ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {sitesLoading ? (
                                        <div className="p-6 flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                                        </div>
                                    ) : sites.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-gray-500 mb-4">No sites found for this customer</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {sites.map(site => (
                                                            <tr key={site._id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.site_code}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.site_name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <User className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.contact_name}
                                                                    </div>
                                                                    <div className="flex items-center mt-1">
                                                                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.contact_no}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.city}, {site.state}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${site.status === 'Live' ? 'bg-green-100 text-green-800' :
                                                                        site.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {site.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                    <div className="flex justify-end space-x-2">
                                                                        <NavLink
                                                                            to={`/view-site/${site._id}`}
                                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                                            title="View"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </NavLink>
                                                                        <NavLink
                                                                            to={`/update-site/${site._id}`}
                                                                            className="text-green-600 hover:text-green-900 p-1"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </NavLink>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden space-y-4">
                                                {sites.map(site => (
                                                    <div key={site._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                                        <div className="px-4 py-3 flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <Home className="text-red-600 mr-3" size={18} />
                                                                <div>
                                                                    <h3 className="text-sm font-medium text-gray-900">{site.site_name}</h3>
                                                                    <p className="text-xs text-gray-500">{site.site_code}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${site.status === 'Live' ? 'bg-green-100 text-green-800' :
                                                                site.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {site.status}
                                                            </span>
                                                        </div>
                                                        <div className="p-4 border-t border-gray-200">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-gray-500">Contact</p>
                                                                    <p className="font-medium flex items-center">
                                                                        <User className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.contact_name}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">Mobile</p>
                                                                    <p className="font-medium flex items-center">
                                                                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.contact_no}
                                                                    </p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <p className="text-gray-500">Location</p>
                                                                    <p className="font-medium flex items-center">
                                                                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                                        {site.city}, {site.state}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 flex justify-end space-x-2">
                                                                <NavLink
                                                                    to={`/view-site/${site._id}`}
                                                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    <Eye className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                                    View
                                                                </NavLink>
                                                                <NavLink
                                                                    to={`/update-site/${site._id}`}
                                                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                                                                >
                                                                    <Edit className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                                    Edit
                                                                </NavLink>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('address')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <MapPin className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Address Information
                                        </h2>
                                    </div>
                                    {expandedSections.address ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.address ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div className="sm:col-span-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address</label>
                                            <div className="space-y-1">
                                                <p className="text-sm sm:text-base text-gray-800">{customer.address.line1}</p>
                                                {customer.address.line2 && <p className="text-sm sm:text-base text-gray-800">{customer.address.line2}</p>}
                                                {customer.address.line3 && <p className="text-sm sm:text-base text-gray-800">{customer.address.line3}</p>}
                                                {customer.address.line4 && <p className="text-sm sm:text-base text-gray-800">{customer.address.line4}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">City</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.address.city}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">State</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.address.state}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.address.country}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Postcode</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.address.postcode || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('financial')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <CreditCard className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Financial Information
                                        </h2>
                                    </div>
                                    {expandedSections.financial ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.financial ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        {customer.Payment_method && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Payment Method</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.Payment_method}</p>
                                            </div>
                                        )}
                                        {customer.bank_name && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.bank_name}</p>
                                            </div>
                                        )}
                                        {customer.account_number && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Account Number</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.account_number}</p>
                                            </div>
                                        )}
                                        {customer.IFSC && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">IFSC Code</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.IFSC}</p>
                                            </div>
                                        )}
                                        {customer.bank_address && (
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Bank Address</label>
                                                <p className="text-sm sm:text-base text-gray-800 whitespace-pre-line">{customer.bank_address}</p>
                                            </div>
                                        )}
                                        {customer.currency && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Currency</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.currency}</p>
                                            </div>
                                        )}
                                        {(customer.credit_limit || customer.credit_limit === 0) && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Credit Limit</label>
                                                <p className="text-sm sm:text-base text-gray-800">
                                                    {customer.currency} {customer.credit_limit.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {(customer.credit_days || customer.credit_days === 0) && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Credit Days</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.credit_days}</p>
                                            </div>
                                        )}
                                        {(customer.creditCharge || customer.creditCharge === 0) && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Credit Charge</label>
                                                <p className="text-sm sm:text-base text-gray-800">
                                                    {customer.currency} {customer.creditCharge.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Credit Withdrawn</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.credit_withdrawn ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        {customer.payment_due_EOM_Terms && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Payment Due EOM Terms</label>
                                                <p className="text-sm sm:text-base text-gray-800">{customer.payment_due_EOM_Terms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('contact')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Mail className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Contact Information
                                        </h2>
                                    </div>
                                    {expandedSections.contact ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.contact ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Title</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.Title}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                                            <p className="text-sm sm:text-base text-gray-800">{customer.Contact_person}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Secondary Contact</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.contact_person_secondary || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Position</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.contact_person_designation || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                <NavLink to={`mailto:${customer.email}`} className="text-red-600 hover:underline">
                                                    {customer.email}
                                                </NavLink>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Telephone No</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.telephone_no || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Mobile No</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {customer.mobile_no ? (
                                                    <NavLink to={`tel:${customer.mobile_no}`} className="text-red-600 hover:underline">
                                                        {customer.mobile_no}
                                                    </NavLink>
                                                ) : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {customer.status === 'lead' && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('lead')}
                                        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center">
                                            <User className="text-red-600 mr-3" size={18} />
                                            <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                                Lead Information
                                            </h2>
                                        </div>
                                        {expandedSections.lead ? (
                                            <ChevronUp size={18} className="text-gray-500" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-500" />
                                        )}
                                    </button>
                                    <div className={`transition-all duration-300 overflow-hidden ${expandedSections.lead ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                            {customer.lead_source && (
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Lead Source</label>
                                                    <p className="text-sm sm:text-base text-gray-800 capitalize">{customer.lead_source}</p>
                                                </div>
                                            )}
                                            {customer.industry_type && (
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Industry Type</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{customer.industry_type}</p>
                                                </div>
                                            )}
                                            {customer.next_follow_up_date && (
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Next Follow-up Date</label>
                                                    <p className="text-sm sm:text-base text-gray-800">
                                                        {new Date(customer.next_follow_up_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Converted to Customer</label>
                                                <p className="text-sm sm:text-base text-gray-800">
                                                    {customer.is_converted ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewCustomer;