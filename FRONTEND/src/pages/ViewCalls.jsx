import React, { useContext, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar, Clock, User, Mail, Phone, AlertCircle, HardHat,
    Clipboard, MapPin, Info, FileText, CheckCircle, XCircle,
    Star, CheckSquare, Square, Download, File, Image, FileType
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const ViewCalls = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [call, setCall] = useState(null);
    const [taskReports, setTaskReports] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [taskReportsLoading, setTaskReportsLoading] = useState(false);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'reports', 'documents'
    const { id } = useParams();

    // Get access type ID from user object
    const getAccessTypeId = () => {
        if (!user) return null;
        if (user.user && user.user.accesstype_id) return user.user.accesstype_id;
        if (user.accesstype_id && user.accesstype_id._id) return user.accesstype_id._id;
        if (user.accesstype_id && typeof user.accesstype_id === 'string') return user.accesstype_id;
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
            if (!hasPermission("Manage Call")) {
                return navigate("/UserUnAuthorized/Manage Calls");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const fetchCallData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/calls/${id}`);
            if (!response.ok) throw new Error('Failed to fetch call details');
            const data = await response.json();
            setCall(data.data);
        } catch (error) {
            console.error('Error fetching call details:', error);
            toast.error(error.message || 'Failed to load call details');
        } finally {
            setLoading(false);
        }
    }

    const fetchTaskId = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries`);
            const data = await res.json();
            const entry = data.data.find(entry => entry.callLog._id === id);
            if (entry) {
                setTaskId(entry._id);
                setStatus(entry.status);
            }
        } catch (error) {
            console.error('Error fetching task ID:', error);
        }
    }

    const fetchTaskReports = async () => {
        if (!taskId) return;
        try {
            setTaskReportsLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}`);
            const data = await response.json();
            setTaskReports(data.data ? [data.data] : []);
            setDocuments(data.data.documents)
            console.log(data.data.documents)
        } catch (error) {
            console.error('Error fetching task reports:', error);
            toast.error(error.message || 'Failed to load task reports');
        } finally {
            setTaskReportsLoading(false);
        }
    }

    useEffect(() => {
        fetchTaskId();
        fetchCallData();
    }, [id]);

    useEffect(() => {
        if (taskId) {
            fetchTaskReports();
        }
    }, [taskId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            );
        }
        return stars;
    };

    const renderChecklistStatus = (checklistStatus) => {
        if (!checklistStatus) return null;
        return Object.entries(checklistStatus).map(([key, value]) => (
            <div key={key} className="flex items-center mb-2">
                {value ? (
                    <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                    <Square className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm">{key}</span>
            </div>
        ));
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
        return <FileType className="h-6 w-6 text-gray-500" />;
    };

    const handleDownload = async (documentId, fileName) => {
        try {
            // You'll need to create this API endpoint on your backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}/documents/${documentId}/download`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Download started');
            } else {
                toast.error('Failed to download document');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </main>
                </div>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <p className="text-gray-500">No call details found</p>
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
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="mb-3 sm:mb-0">
                                        <h2 className="text-xl font-bold text-gray-800">Call Details</h2>
                                        <p className="text-sm text-gray-600">Call Number: {call.call_number}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${call.priority === 1
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {call.priority === 1 ? 'High Priority' : 'Normal Priority'}
                                        </div>
                                        <div className="ml-3">
                                            <span
                                                className={`
                                                    inline-block px-2 py-0.5 rounded text-xs font-semibold
                                                    ${call.status === 'open'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : call.status === 'in_progress'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : call.status === 'on_hold'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : call.status === 'resolved'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : call.status === 'closed'
                                                                        ? 'bg-gray-200 text-gray-600'
                                                                        : 'bg-gray-100 text-gray-500'
                                                    }
                                                `}
                                            >
                                                {{
                                                    open: 'Open',
                                                    in_progress: 'In Progress',
                                                    on_hold: 'On Hold',
                                                    resolved: 'Resolved',
                                                    closed: 'Closed'
                                                }[call.status] || call.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'details'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Call Details
                                    </button>
                                    {taskId && (
                                        <button
                                            onClick={() => setActiveTab('reports')}
                                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'reports'
                                                ? 'border-red-500 text-red-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            Task Reports
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'documents'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Documents ({documents.length})
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            {/* Call Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <Clipboard className="h-5 w-5 text-gray-500 mr-2" />
                                                    Call Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Call Type</p>
                                                            <p className="text-sm font-medium">{call.call_type.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Call Reason</p>
                                                            <p className="text-sm font-medium">{call.call_reason.name}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Remarks</p>
                                                        <p className="text-sm font-medium">{call.remarks || 'No remarks'}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Chargable</p>
                                                            <p className="text-sm font-medium">
                                                                {call.chargable ? (
                                                                    <span className="inline-flex items-center text-green-600">
                                                                        <CheckCircle className="h-4 w-4 mr-1" /> Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-red-600">
                                                                        <XCircle className="h-4 w-4 mr-1" /> No
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Invoiced</p>
                                                            <p className="text-sm font-medium">
                                                                {call.invoiced ? (
                                                                    <span className="inline-flex items-center text-green-600">
                                                                        <CheckCircle className="h-4 w-4 mr-1" /> Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-red-600">
                                                                        <XCircle className="h-4 w-4 mr-1" /> No
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dates */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                                                    Important Dates
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Created At</p>
                                                            <p className="text-sm font-medium">{formatDate(call.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Logged Date</p>
                                                            <p className="text-sm font-medium">{formatDate(call.logged_date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Assign Date</p>
                                                            <p className="text-sm font-medium">{formatDate(call.assign_date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Deadline</p>
                                                            <p className="text-sm font-medium">{formatDate(call.deadline)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Info className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Next Action</p>
                                                            <p className="text-sm font-medium">{formatDate(call.next_action)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Caller Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <User className="h-5 w-5 text-gray-500 mr-2" />
                                                    Caller Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Name</p>
                                                        <p className="text-sm font-medium">{call.caller_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Email</p>
                                                        <p className="text-sm font-medium">{call.caller_email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Number</p>
                                                        <p className="text-sm font-medium">{call.caller_number}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            {/* Site Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                                                    Site Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Name</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Code</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_code}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Address</p>
                                                        <p className="text-sm font-medium">
                                                            {call.site_id.address_line_1}, {call.site_id.address_line_2},
                                                            {call.site_id.address_line_3 && `, ${call.site_id.address_line_3}`}
                                                            {call.site_id.address_line_4 && `, ${call.site_id.address_line_4}`}
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {call.site_id.city}, {call.site_id.state}, {call.site_id.postcode}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Contact Person</p>
                                                            <p className="text-sm font-medium">{call.site_id.contact_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Contact Number</p>
                                                            <p className="text-sm font-medium">{call.site_id.contact_no}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Remarks</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_remarks || 'No remarks'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personnel */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <User className="h-5 w-5 text-gray-500 mr-2" />
                                                    Personnel
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Logged By</p>
                                                        <p className="text-sm font-medium">
                                                            {call.logged_by.firstname} {call.logged_by.lastname} ({call.logged_by.username})
                                                        </p>
                                                    </div>
                                                    {call.engineer_id && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Assigned Engineer</p>
                                                            <p className="text-sm font-medium">
                                                                {call.engineer_id.firstname} {call.engineer_id.lastname} ({call.engineer_id.username})
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && taskId && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <h3 className="flex items-center text-lg font-medium text-gray-800 mb-6">
                                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                                        Task Reports
                                    </h3>

                                    {taskReportsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : taskReports.length > 0 ? (
                                        <div className="space-y-6">
                                            {taskReports.map((report, index) => (
                                                <div key={index} className="border rounded-lg p-5 bg-gray-50">
                                                    <h4 className="font-medium text-gray-700 mb-4 text-lg">Task Report #{index + 1}</h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Task Status</p>
                                                            <p className="text-sm font-medium capitalize">{status}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Task Date</p>
                                                            <p className="text-sm font-medium">{formatDate(report.taskDetails?.date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Start Time</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.startTime || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">End Time</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.endTime || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Duration</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.duration || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Notes</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">{report.taskDetails?.notes || 'No notes provided'}</p>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Additional Notes</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">{report.additionalNotes || 'No additional notes'}</p>
                                                    </div>

                                                    {report.checklistStatus && (
                                                        <div className="mb-4">
                                                            <p className="text-xs text-gray-500 mb-2">Checklist Status</p>
                                                            <div className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {renderChecklistStatus(report.checklistStatus)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Customer Rating</p>
                                                        <div className="flex items-center mt-1 bg-white p-3 rounded border">
                                                            {renderStars(report.customerRating || 0)}
                                                            <span className="ml-2 text-sm text-gray-600">
                                                                ({report.customerRating || 0}/5)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Customer Review</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">{report.customerReview || 'No review provided'}</p>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Submitted At</p>
                                                        <p className="text-sm font-medium">{formatDate(report.submittedAt)}</p>
                                                    </div>

                                                    {(report.engineerSignature || report.customerSignature) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                            {report.engineerSignature && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 mb-2">Engineer Signature</p>
                                                                    <img
                                                                        src={report.engineerSignature}
                                                                        alt="Engineer Signature"
                                                                        className="border rounded max-h-40 object-contain bg-white p-2"
                                                                    />
                                                                </div>
                                                            )}
                                                            {report.customerSignature && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 mb-2">Customer Signature</p>
                                                                    <img
                                                                        src={report.customerSignature}
                                                                        alt="Customer Signature"
                                                                        className="border rounded max-h-40 object-contain bg-white p-2"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No task reports available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <h3 className="flex items-center text-lg font-medium text-gray-800 mb-6">
                                        <File className="h-5 w-5 text-gray-500 mr-2" />
                                        Documents ({documents.length})
                                    </h3>

                                    {documentsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {documents.map((doc) => (
                                                <div key={doc._id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start mb-3">
                                                        {getFileIcon(doc.filename)}
                                                        <div className="ml-3 flex-1">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                                                            <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{doc.uploadedBy?.firstname} {doc.uploadedBy?.lastname}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownload(doc._id, doc.filename)}
                                                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-md py-2 px-3 text-sm hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No documents available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewCalls;