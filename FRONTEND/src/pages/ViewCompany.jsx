import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Building, MapPin, Mail, ChevronDown, ChevronUp, Edit, Printer, Share2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";

const ViewCompany = () => {

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
            if (!hasPermission("Manage Company")) {
                return navigate("/UserUnAuthorized/Manage Company");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const { id } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [companyData, setCompanyData] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);

    const [expandedSections, setExpandedSections] = useState({
        general: true,
        registered: false,
        communication: false
    });

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/company/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setCompanyData(data);
                    if (data.logo) {
                        const baseApi = import.meta.env.VITE_UPLOAD_URL.replace(/\/$/, '');
                        setLogoUrl(`${baseApi}/${data.logo}`);
                    }
                } else {
                    throw new Error(data.message || 'Failed to fetch company data');
                }
            } catch (error) {
                toast.error(error.message);
                navigate('/search-company'); // Redirect if error occurs
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [id, navigate]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleEdit = () => {
        navigate(`/update-company/${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="animate-pulse bg-white rounded-lg shadow-sm p-6">
                                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!companyData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                                <p className="text-red-500">Company not found</p>
                                <button
                                    onClick={() => navigate('/companies')}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Back to Companies
                                </button>
                            </div>
                        </div>
                    </main>
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
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{companyData.company_name}</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Company Details</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Edit size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Edit Company</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                            </div>
                        </div>

                        {/* Company Details Sections */}
                        <div className="space-y-4">
                            {/* General Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('general')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Building className="text-red-600 mr-3" size={18} />
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
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Company Name</label>
                                            <p className="text-sm sm:text-base font-medium text-gray-800">{companyData.company_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.contact_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Status</label>
                                            <div className="flex items-center">
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${companyData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                <p className="text-sm sm:text-base text-gray-800 capitalize">{companyData.status}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Currency</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.currency}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">GST Number</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.GST_No || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Primary Company</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.primary_company ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-2">Company Logo</label>
                                            {logoUrl ? (
                                                <div className="mt-2">
                                                    <img
                                                        src={logoUrl}
                                                        alt="Company Logo"
                                                        className="h-32 object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No logo uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registered Address Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('registered')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <MapPin className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Registered Address
                                        </h2>
                                    </div>
                                    {expandedSections.registered ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.registered ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 1</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.address_line1 || '-'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 2</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.address_line2 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 3</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.address_line3 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 4</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.address_line4 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Post Code</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.postcode || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.country || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">State</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.state || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">City</label>
                                            <p className="text-sm sm:text-base text-gray-800">{companyData.registered_address_id.city || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Telephone</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {companyData.registered_address_id.telephone_no ?
                                                    `${companyData.registered_address_id.telephone_code || ''} ${companyData.registered_address_id.telephone_no}`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Mobile</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {companyData.registered_address_id.mobile_no ?
                                                    `${companyData.registered_address_id.mobile_code || ''} ${companyData.registered_address_id.mobile_no}`
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication Address Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('communication')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Mail className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            {companyData.same_as_registered_address ?
                                                "Communication Address (Same as Registered)" :
                                                "Communication Address"}
                                        </h2>
                                    </div>
                                    {expandedSections.communication ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.communication ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6">
                                        {companyData.same_as_registered_address ? (
                                            <div className="p-4 text-center text-xs sm:text-sm text-gray-500 bg-gray-50 rounded-md">
                                                Communication address is same as registered address
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 1</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.address_line1 || '-'}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 2</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.address_line2 || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 3</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.address_line3 || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 4</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.address_line4 || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Post Code</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.postcode || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.email || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.country || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">State</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.state || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">City</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.city || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Telephone</label>
                                                    <p className="text-sm sm:text-base text-gray-800">
                                                        {companyData.communication_address_id.telephone_no ?
                                                            `${companyData.communication_address_id.telephone_code || ''} ${companyData.communication_address_id.telephone_no}`
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Mobile</label>
                                                    <p className="text-sm sm:text-base text-gray-800">
                                                        {companyData.communication_address_id.mobile_no ?
                                                            `${companyData.communication_address_id.mobile_code || ''} ${companyData.communication_address_id.mobile_no}`
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                                                    <p className="text-sm sm:text-base text-gray-800">{companyData.communication_address_id.contact_person || '-'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewCompany;