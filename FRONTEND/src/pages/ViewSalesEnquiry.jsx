import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Printer, Mail, Edit,
    FileText, User, Calendar, Clock,
    DollarSign, Tag, Check, X, AlertCircle,
    Settings
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const ViewSalesEnquiry = () => {
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

    const { id } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [enquiry, setEnquiry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnquiryDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/sales-enquiry/${id}`);
                const data = await response.json();
                setEnquiry(data);
            } catch (error) {
                console.error("Error fetching enquiry:", error);
                toast.error(error.message || 'Failed to load enquiry details');
            } finally {
                setLoading(false);
            }
        };

        fetchEnquiryDetails();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }) => {
        const statusConfig = {
            'New Assigned': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FileText size={16} /> },
            'Quoted': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Tag size={16} /> },
            'Won': { bg: 'bg-green-100', text: 'text-green-800', icon: <Check size={16} /> },
            'Lost': { bg: 'bg-red-100', text: 'text-red-800', icon: <X size={16} /> },
            'Hold': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertCircle size={16} /> }
        };

        const config = statusConfig[status] || statusConfig['New Assigned'];

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.icon}
                <span className="ml-1">{status}</span>
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!enquiry) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 text-center">
                            <p className="text-gray-600">Enquiry not found</p>
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
                        {/* Header with actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="flex items-center mb-4 sm:mb-0"  >
                                <button
                                    onClick={() => navigate(-1)}
                                    className="mr-2 p-1 rounded-md hover:bg-gray-100"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div id="print-section">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                        Enquiry #{enquiry.enquiry_code}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Created on {formatDate(enquiry.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
                                    <Printer size={16} className="mr-1" />
                                    Print
                                </button>
                                <button
                                    onClick={() => navigate(`/edit-sales-enquiry/${id}`)}
                                    className="flex items-center px-3 py-1 text-sm bg-red-600 rounded-md text-white hover:bg-red-700"
                                >
                                    <Edit size={16} className="mr-1" />
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Main content */}
                        <div className="bg-white rounded-lg shadow overflow-hidden" id="print-section" >
                            {/* Status bar */}
                            <div className="px-6 py-4 border-b flex gap-4 items-center justify-between">
                                <div>
                                    <StatusBadge status={enquiry.status} />
                                </div>
                                <div className="text-sm text-gray-500">
                                    Last updated: {formatDateTime(enquiry.updatedAt)}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {/* Left column */}
                                <div className="space-y-6">
                                    {/* Company & Customer Info */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <User className="text-red-600 mr-2" size={18} />
                                            Company & Customer Details
                                        </h2>
                                        <div className="space-y-2">
                                            <DetailItem label="Company" value={enquiry.company?.company_name} />
                                            <DetailItem label="Customer" value={enquiry.customer?.customer_name} />
                                            <DetailItem label="Site" value={enquiry.site?.site_name} />
                                            <DetailItem label="Contact" value={enquiry.site?.contact_name} />
                                            <DetailItem label="Contact Number" value={enquiry.site?.contact_number} />
                                        </div>
                                    </div>

                                    {/* Admin Details */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <Settings className="text-red-600 mr-2" size={18} />
                                            Admin Details
                                        </h2>
                                        <div className="space-y-2">
                                            <DetailItem label="Sales Person" value={
                                                enquiry.salesPerson ? `${enquiry.salesPerson.firstname} ${enquiry.salesPerson.lastname}` : 'Not assigned'
                                            } />
                                            <DetailItem label="Referral Engineer" value={
                                                enquiry.referealEngineer ? `${enquiry.referealEngineer.firstname} ${enquiry.referealEngineer.lastname}` : 'None'
                                            } />
                                            <DetailItem label="Type of Work" value={enquiry.typeOfWork?.name} />
                                            <DetailItem label="System Type" value={enquiry.systemType?.systemName} />
                                            <DetailItem label="Client Type" value={enquiry.clientType} />
                                            <DetailItem label="Premises Type" value={enquiry.premisesType} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right column */}
                                <div className="space-y-6">
                                    {/* Timeline */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <Clock className="text-red-600 mr-2" size={18} />
                                            Timeline
                                        </h2>
                                        <div className="space-y-3">
                                            <TimelineItem
                                                icon={<Calendar size={16} />}
                                                label="Enquiry Date"
                                                value={formatDateTime(enquiry.enquiryOn)}
                                            />
                                            <TimelineItem
                                                icon={<Calendar size={16} />}
                                                label="Assigned On"
                                                value={formatDateTime(enquiry.assignedOn)}
                                            />
                                            <TimelineItem
                                                icon={<Calendar size={16} />}
                                                label="Quoted On"
                                                value={formatDateTime(enquiry.quotedOn)}
                                            />
                                            <TimelineItem
                                                icon={<Calendar size={16} />}
                                                label="Expected Order Date"
                                                value={formatDate(enquiry.expectedOrderDate)}
                                            />
                                            {enquiry.status === 'Won' && (
                                                <TimelineItem
                                                    icon={<Check size={16} className="text-green-600" />}
                                                    label="Won On"
                                                    value={formatDateTime(enquiry.wonDateTime)}
                                                />
                                            )}
                                            {enquiry.status === 'Lost' && (
                                                <TimelineItem
                                                    icon={<X size={16} className="text-red-600" />}
                                                    label="Lost On"
                                                    value={formatDateTime(enquiry.lostDateTime)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <div className="text-red-600 mr-2">₹</div>
                                            Financial Details
                                        </h2>
                                        <div className="space-y-2">
                                            <DetailItem
                                                label="Expected Value"
                                                value={enquiry.expectedOrderValue ? `₹${enquiry.expectedOrderValue.toLocaleString()}` : 'Not specified'}
                                            />
                                            {enquiry.orderValue && (
                                                <DetailItem
                                                    label="Final Order Value"
                                                    value={`₹${enquiry.orderValue.toLocaleString()}`}
                                                />
                                            )}
                                            <DetailItem label="Priority" value={
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${enquiry.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                    enquiry.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {enquiry.priority}
                                                </span>
                                            } />
                                            {enquiry.customerOrder && (
                                                <DetailItem label="Customer Order No." value={enquiry.customerOrder} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <FileText className="text-red-600 mr-2" size={18} />
                                            Remarks
                                        </h2>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            {enquiry.adminRemarks ? (
                                                <p className="text-gray-700">{enquiry.adminRemarks}</p>
                                            ) : (
                                                <p className="text-gray-400">No remarks added</p>
                                            )}
                                        </div>
                                        {enquiry.wonReason && enquiry.status === 'Won' && (
                                            <div className="bg-green-50 p-4 rounded-md">
                                                <p className="text-green-800 font-medium">Won Reason:</p>
                                                <p className="text-green-700">{enquiry.wonReason}</p>
                                            </div>
                                        )}
                                        {enquiry.lostReason && enquiry.status === 'Lost' && (
                                            <div className="bg-red-50 p-4 rounded-md">
                                                <p className="text-red-800 font-medium">Lost Reason:</p>
                                                <p className="text-red-700">{enquiry.lostReason}</p>
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

const DetailItem = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="col-span-2 text-sm text-gray-900">
            {value || 'Not specified'}
        </dd>
    </div>
);

const TimelineItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5 mr-3 text-gray-500">
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-sm text-gray-900">{value}</p>
        </div>
    </div>
);

export default ViewSalesEnquiry;