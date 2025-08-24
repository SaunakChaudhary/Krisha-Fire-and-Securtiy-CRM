import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, User, Mail, Phone, AlertCircle, HardHat, Clipboard, MapPin, Info, FileText, CheckCircle, XCircle, Star, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ViewCalls = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [call, setCall] = useState(null);
    const [taskReports, setTaskReports] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [taskReportsLoading, setTaskReportsLoading] = useState(false);
    const { id } = useParams();

    const fetchCallData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/calls/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries`);
        const data = await res.json();
        setTaskId(data.data.find(entry => entry.callLog._id === id)._id);
        setStatus(data.data.find(entry => entry.callLog._id === id).status);
    }

    const fetchTaskReports = async () => {
        if(!taskId) return;

        try {
            setTaskReportsLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            setTaskReports(data.data ? [data.data] : []);
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
        fetchTaskReports();
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Call Details</h2>
                                        <p className="text-sm text-gray-600">Call Number: {call.call_number}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${call.priority === 1
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {call.priority === 1 ? 'High Priority' : 'Normal Priority'}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Call Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className='flex justify-between'>
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <Clipboard className="h-5 w-5 text-gray-500 mr-2" />
                                                    Call Information
                                                </h3>
                                                <div>
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

                                {/* Task Reports Section */}
                                {taskId && (
                                    <div className="mt-8">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                                                Task Reports
                                            </h3>

                                            {taskReportsLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
                                                </div>
                                            ) : taskReports.length > 0 ? (
                                                <div className="space-y-4">
                                                    {taskReports.map((report, index) => (
                                                        <div key={index} className="border rounded-lg p-4">
                                                            <h4 className="font-medium text-gray-700 mb-2">Task Report #{index + 1}</h4>

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
                                                                <p className="text-sm font-medium">{report.taskDetails?.notes || 'No notes provided'}</p>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-500">Additional Notes</p>
                                                                <p className="text-sm font-medium">{report.additionalNotes || 'No additional notes'}</p>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-500">Checklist Status</p>
                                                                <div className="mt-1">
                                                                    {renderChecklistStatus(report.checklistStatus)}
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-500">Customer Rating</p>
                                                                <div className="flex items-center mt-1">
                                                                    {renderStars(report.customerRating || 0)}
                                                                    <span className="ml-2 text-sm text-gray-600">
                                                                        ({report.customerRating || 0}/5)
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-500">Customer Review</p>
                                                                <p className="text-sm font-medium">{report.customerReview || 'No review provided'}</p>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-500">Submitted At</p>
                                                                <p className="text-sm font-medium">{formatDate(report.submittedAt)}</p>
                                                            </div>

                                                            {(report.engineerSignature || report.customerSignature) && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {report.engineerSignature && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Engineer Signature</p>
                                                                            <img
                                                                                src={report.engineerSignature}
                                                                                alt="Engineer Signature"
                                                                                className="mt-1 border rounded max-h-32 object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {report.customerSignature && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Customer Signature</p>
                                                                            <img
                                                                                src={report.customerSignature}
                                                                                alt="Customer Signature"
                                                                                className="mt-1 border rounded max-h-32 object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">No task reports available</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewCalls;