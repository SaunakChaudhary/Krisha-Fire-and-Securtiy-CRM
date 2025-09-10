import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { ArrowLeft, Save, Phone, AlertCircle, Clock, CreditCard, Calendar, User, Mail, ChevronDown, ChevronUp, Check, X, Info } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";
import { motion } from "framer-motion";

const AddCall = () => {
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
            if (!hasPermission("Manage Call")) {
                return navigate("/UserUnAuthorized/Manage Calls");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        site_id: '',
        site_system: '',
        call_type: '',
        call_reason: '',
        waiting: false,
        call_waiting_reason: '',
        chargable: false,
        invoiced: false,
        bill_on_maintenance: false,
        priority: 0,
        deadline: '',
        caller_name: '',
        caller_number: '',
        caller_email: '',
        next_action: '',
        engineer_id: '',
        assign_date: '',
        logged_by: user?.user?._id || user?._id,
        // New fields
        invoice_no: '',
        invoice_date: '',
        invoice_value: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});
    const [amcStatus, setAmcStatus] = useState(null);
    const [warrantyStatus, setWarrantyStatus] = useState(null);

    // Dropdown options
    const [sites, setSites] = useState([]);
    const [siteSystems, setSiteSystems] = useState([]);
    const [callTypes, setCallTypes] = useState([]);
    const [callReasons, setCallReasons] = useState([]);
    const [waitingReasons, setWaitingReasons] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [users, setUsers] = useState([]);

    const [expandedSections, setExpandedSections] = useState({
        callDetails: true,
        callerInfo: false,
        assignment: false,
        adminInfo: false
    });

    const fetchWithErrorHandling = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error messages from your API
                const errorMessage = data.message ||
                    data.error ||
                    `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    sitesData,
                    callTypesData,
                    callReasonsData,
                    waitingReasonsData,
                    usersData
                ] = await Promise.all([
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/sites`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/work-type/`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/callReason`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/callWaitingReason`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/user`)
                ]);

                setSites(sitesData.filter(site => site.status === "Live") || []);
                setCallTypes(callTypesData || []);
                setCallReasons(callReasonsData || []);
                setWaitingReasons(waitingReasonsData || []);
                setUsers(usersData.users || []);
                console.log(usersData.users)
                const engineerUsers = usersData.users?.filter(user => user?.accesstype_id?.name === "Engineer") || [];
                setEngineers(engineerUsers);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'Failed to load form data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (formData.site_id) {
            const fetchSiteSystems = async () => {
                try {
                    const siteData = await fetchWithErrorHandling(
                        `${import.meta.env.VITE_API_URL}/api/sites/${formData.site_id}`
                    );
                    setSiteSystems(siteData.site_systems || []);

                } catch (error) {
                    console.error('Error fetching site systems:', error);
                    toast.error('Failed to load systems for selected site');
                }
            };
            fetchSiteSystems();
        }
    }, [formData.site_id]);

    useEffect(() => {
        const checkContractStatus = async () => {
            if (formData.call_reason && formData.site_id && formData.site_system) {
                try {
                    const siteData = await fetchWithErrorHandling(
                        `${import.meta.env.VITE_API_URL}/api/sites/${formData.site_id}`
                    );

                    const selectedSystem = siteData.site_systems.find(
                        sys => sys.system_id._id === formData.site_system
                    );

                    if (selectedSystem) {
                        const now = new Date();
                        const selectedReason = callReasons.find(r => r._id === formData.call_reason);
                        const isAmcCall = selectedReason && selectedReason.name.toLowerCase().includes('amc');
                        const isCallOut = selectedReason && selectedReason.name.toLowerCase().includes('call out');

                        setAmcStatus(null);
                        setWarrantyStatus(null);

                        if (isAmcCall) {
                            if (selectedSystem.amc_start_date && selectedSystem.amc_end_date) {
                                const amcStart = new Date(selectedSystem.amc_start_date);
                                const amcEnd = new Date(selectedSystem.amc_end_date);

                                console.log(now)
                                if (now >= amcStart && now <= amcEnd) {
                                    setAmcStatus('active');
                                    setFormData(prev => ({ ...prev, chargable: false }));
                                } else if (now > amcEnd) {
                                    setAmcStatus('expired');
                                    setFormData(prev => ({ ...prev, chargable: true }));
                                } else {
                                    setAmcStatus('future');
                                    setFormData(prev => ({ ...prev, chargable: true }));
                                }
                            } else {
                                setAmcStatus('none');
                                setFormData(prev => ({ ...prev, chargable: true }));
                            }
                        } else if (isCallOut) {
                            if (selectedSystem.warranty_date) {
                                const warrantyDate = new Date(selectedSystem.warranty_date);
                                if (now <= warrantyDate) {
                                    setWarrantyStatus('active');
                                    setFormData(prev => ({ ...prev, chargable: false }));
                                } else {
                                    setWarrantyStatus('expired');
                                    setFormData(prev => ({ ...prev, chargable: true }));
                                }
                            } else {
                                setWarrantyStatus('none');
                                setFormData(prev => ({ ...prev, chargable: true }));
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking contract status:', error);
                    setAmcStatus(null);
                    setWarrantyStatus(null);
                }
            } else {
                setAmcStatus(null);
                setWarrantyStatus(null);
            }
        };

        checkContractStatus();
    }, [formData.call_reason, formData.site_id, formData.site_system, callReasons]);

    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.site_id) newErrors.site_id = 'Please select a site';
        if (!formData.site_system) newErrors.site_system = 'Please select a system';
        if (!formData.call_type) newErrors.call_type = 'Please select a call type';
        if (!formData.call_reason) newErrors.call_reason = 'Please select a call reason';
        if (!formData.logged_by) newErrors.logged_by = 'Please select who is logging this call';

        // Conditional validation for waiting reason
        if (formData.waiting && !formData.call_waiting_reason) {
            newErrors.call_waiting_reason = 'Please select a waiting reason when call is on hold';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const [popupMessage, setPopupMessage] = useState("");

    const CustomPopup = ({ message, onClose }) => {
        if (!message) return null;

        return (
            <div className="fixed inset-0 flex items-start justify-center bg-black/50 z-50">
                <motion.div
                    initial={{ y: -200, opacity: 0 }}   // start from top
                    animate={{ y: 0, opacity: 1 }}   // slide to center
                    exit={{ y: -200, opacity: 0 }}     // animate when closed
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white rounded-2xl shadow-lg p-6 w-96 text-center mt-20 m-5"
                >
                    <h2 className="text-lg font-semibold mb-4">Notice</h2>
                    <p className="mb-6 text-gray-700">{message}</p>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                        OK
                    </button>
                </motion.div>
            </div>
        );
    };

    useEffect(() => {
        if (formData.site_system) {
            const site = sites.find((s) => s._id === formData.site_id);
            if (site?.admin_remarks) {
                setPopupMessage(site.admin_remarks); // popup show karne ke liye
            }
        }
    }, [formData.site_system])

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Prepare the payload according to your controller requirements
            const payload = {
                site_id: formData.site_id,
                site_system: formData.site_system,
                call_type: formData.call_type,
                call_reason: formData.call_reason,
                waiting: formData.waiting,
                call_waiting_reason: formData.waiting ? formData.call_waiting_reason : undefined,
                chargable: formData.chargable,
                invoiced: formData.invoiced,
                bill_on_maintenance: formData.bill_on_maintenance,
                priority: formData.priority || 0,
                deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                caller_name: formData.caller_name,
                caller_number: formData.caller_number,
                caller_email: formData.caller_email,
                next_action: formData.next_action || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                engineer_id: formData.engineer_id,
                assign_date: formData.engineer_id ? new Date().toISOString() : undefined,
                logged_by: formData.logged_by,
                invoice_no: formData.invoice_no,
                invoice_date: formData.invoice_date,
                invoice_value: formData.invoice_value,
                remarks: formData.remarks
            };

            const response = await fetchWithErrorHandling(
                `${import.meta.env.VITE_API_URL}/api/calls/create`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }
            );

            toast.success('Call created successfully!');
            navigate(`/manage-diary/${formData.engineer_id}/${response.data.call_number}?site=${response.data.site_id}`);

        } catch (error) {
            console.error('Error creating call:', error);
            toast.error(error.message || 'Failed to create call');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFormData({
            site_id: '',
            site_system: '',
            call_type: '',
            call_reason: '',
            waiting: false,
            call_waiting_reason: '',
            chargable: false,
            invoiced: false,
            bill_on_maintenance: false,
            priority: 0,
            deadline: '',
            caller_name: '',
            caller_number: '',
            caller_email: '',
            next_action: '',
            engineer_id: '',
            assign_date: '',
            logged_by: user.user._id,
            invoice_no: '',
            invoice_date: '',
            invoice_value: '',
            remarks: ''
        });
        setErrors({});
        setAmcStatus(null);
        setWarrantyStatus(null);
    };

    const sectionStatus = {
        callDetails: formData.site_id && formData.site_system && formData.call_type && formData.call_reason,
        callerInfo: formData.caller_name || formData.caller_number || formData.caller_email,
        assignment: formData.logged_by,
        adminInfo: formData.invoice_no || formData.invoice_date || formData.invoice_value || formData.remarks
    };

    const isAmcCall = () => {
        if (!formData.call_reason || !callReasons.length) return false;
        const selectedReason = callReasons.find(r => r._id === formData.call_reason);
        return selectedReason && selectedReason.name.toLowerCase().includes('amc');
    };

    const isCallOut = () => {
        if (!formData.call_reason || !callReasons.length) return false;
        const selectedReason = callReasons.find(r => r._id === formData.call_reason);
        return selectedReason && selectedReason.name.toLowerCase().includes('call out');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
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
                <CustomPopup
                    message={popupMessage}
                    onClose={() => setPopupMessage("")}
                />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Log New Call</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Fill in the details to log a new service call</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigate('/calls')}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <ArrowLeft size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Back</span>
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <X size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                                <button
                                    type="submit"
                                    form="call-form"
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Check size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Save Call</span>
                                    <span className="sm:hidden">Save</span>
                                </button>
                            </div>
                        </div>

                        {/* Form Sections */}
                        <form id="call-form" className="space-y-4" onSubmit={handleSubmit}>
                            {/* Call Details Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('callDetails')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Phone className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Call Details
                                        </h2>
                                        {sectionStatus.callDetails && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.callDetails ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.callDetails ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Site and System */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Site *</label>
                                            <select
                                                name="site_id"
                                                className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.site_id ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                                value={formData.site_id}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">-- Select Site --</option>
                                                {sites.map(site => (
                                                    <option key={site._id} value={site._id}>
                                                        {site.site_name} ({site.site_code})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.site_id && <p className="mt-1 text-xs text-red-600">{errors.site_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">System *</label>
                                            <select
                                                name="site_system"
                                                className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.site_system ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                                value={formData.site_system}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.site_id}
                                            >
                                                <option value="">-- Select System --</option>
                                                {siteSystems.map(system => (
                                                    <option key={system._id} value={system.system_id._id}>
                                                        {system.system_id.systemName} ({system.system_id.systemCode})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.site_system && <p className="mt-1 text-xs text-red-600">{errors.site_system}</p>}
                                        </div>

                                        {/* Call Type and Reason */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Call Type *</label>
                                            <select
                                                name="call_type"
                                                className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.call_type ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                                value={formData.call_type}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">-- Select Call Type --</option>
                                                {callTypes.map(type => (
                                                    <option key={type._id} value={type._id}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.call_type && <p className="mt-1 text-xs text-red-600">{errors.call_type}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Call Reason *</label>
                                            <select
                                                name="call_reason"
                                                className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.call_reason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                                value={formData.call_reason}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">-- Select Call Reason --</option>
                                                {callReasons.map(reason => (
                                                    <option key={reason._id} value={reason._id}>
                                                        {reason.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.call_reason && <p className="mt-1 text-xs text-red-600">{errors.call_reason}</p>}

                                            {/* Status Messages */}
                                            {isAmcCall() && amcStatus === 'active' && (
                                                <div className="mt-2 flex items-center text-xs text-green-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>Active AMC found - this call will be covered</span>
                                                </div>
                                            )}
                                            {isAmcCall() && amcStatus === 'expired' && (
                                                <div className="mt-2 flex items-center text-xs text-yellow-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>Your AMC has expired - this call will be chargeable</span>
                                                </div>
                                            )}
                                            {isAmcCall() && amcStatus === 'future' && (
                                                <div className="mt-2 flex items-center text-xs text-blue-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>AMC starts in the future - this call will be chargeable</span>
                                                </div>
                                            )}
                                            {isAmcCall() && amcStatus === 'none' && (
                                                <div className="mt-2 flex items-center text-xs text-blue-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>No AMC found - consider purchasing an AMC contract</span>
                                                </div>
                                            )}
                                            {isCallOut() && warrantyStatus === 'active' && (
                                                <div className="mt-2 flex items-center text-xs text-green-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>Active warranty found - this call will be covered</span>
                                                </div>
                                            )}
                                            {isCallOut() && warrantyStatus === 'expired' && (
                                                <div className="mt-2 flex items-center text-xs text-yellow-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>Your warranty has expired - this call will be chargeable</span>
                                                </div>
                                            )}
                                            {isCallOut() && warrantyStatus === 'none' && (
                                                <div className="mt-2 flex items-center text-xs text-blue-600">
                                                    <Info size={14} className="mr-1" />
                                                    <span>No warranty information found</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Call Status */}
                                        <div className="flex items-center sm:col-span-2">
                                            <input
                                                type="checkbox"
                                                name="waiting"
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                checked={formData.waiting}
                                                onChange={handleInputChange}
                                            />
                                            <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                On Hold/Waiting
                                            </label>
                                        </div>

                                        {formData.waiting && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Waiting Reason *</label>
                                                <select
                                                    name="call_waiting_reason"
                                                    className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.call_waiting_reason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                                    value={formData.call_waiting_reason}
                                                    onChange={handleInputChange}
                                                    required={formData.waiting}
                                                >
                                                    <option value="">-- Select Waiting Reason --</option>
                                                    {waitingReasons.map(reason => (
                                                        <option key={reason._id} value={reason._id}>
                                                            {reason.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.call_waiting_reason && <p className="mt-1 text-xs text-red-600">{errors.call_waiting_reason}</p>}
                                            </div>
                                        )}

                                        {/* Billing Information */}
                                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="chargable"
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    checked={formData.chargable}
                                                    onChange={handleInputChange}
                                                    disabled={
                                                        (isAmcCall() && amcStatus === 'active') ||
                                                        (isCallOut() && warrantyStatus === 'active')
                                                    }
                                                />
                                                <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                    Chargeable
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="invoiced"
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    checked={formData.invoiced}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                    Invoiced
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="bill_on_maintenance"
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    checked={formData.bill_on_maintenance}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                    Bill on Maintenance
                                                </label>
                                            </div>
                                        </div>

                                        {/* Priority and Deadline */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority</label>
                                            <input
                                                type="number"
                                                name="priority"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.priority}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                            <input
                                                type="datetime-local"
                                                name="deadline"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.deadline}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Next Action */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Next Action</label>
                                            <input
                                                type="datetime-local"
                                                name="next_action"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.next_action}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Caller Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('callerInfo')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <User className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Caller Information
                                        </h2>
                                        {sectionStatus.callerInfo && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.callerInfo ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.callerInfo ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Caller Name</label>
                                            <input
                                                type="text"
                                                name="caller_name"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.caller_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Caller Number</label>
                                            <input
                                                type="text"
                                                name="caller_number"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.caller_number}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Caller Email</label>
                                            <input
                                                type="email"
                                                name="caller_email"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.caller_email}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignment Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('assignment')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <AlertCircle className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Assignment
                                        </h2>
                                        {sectionStatus.assignment && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.assignment ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.assignment ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Logged By *</label>
                                            <input
                                                type="text"
                                                name="logged_by"
                                                className={`w-full px-3 py-2 text-xs sm:text-sm border ${errors.logged_by ? 'border-red-500' : 'border-gray-300'} rounded-md bg-gray-100 cursor-not-allowed`}
                                                value={
                                                    (() => {
                                                        const loggedUser = users.find(u => u._id === formData.logged_by);
                                                        return loggedUser
                                                            ? `${loggedUser.firstname} ${loggedUser.lastname}`
                                                            : '';
                                                    })()
                                                }
                                                disabled
                                                readOnly
                                            />
                                            {errors.logged_by && <p className="mt-1 text-xs text-red-600">{errors.logged_by}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Assign To Engineer</label>
                                            <select
                                                name="engineer_id"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.engineer_id}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">-- Select Engineer --</option>
                                                {engineers.map(engineer => (
                                                    <option key={engineer._id} value={engineer._id}>
                                                        {engineer.firstname} {engineer.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('adminInfo')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <CreditCard className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Admin Information
                                        </h2>
                                        {sectionStatus.adminInfo && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.adminInfo ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.adminInfo ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                                            <input
                                                type="text"
                                                name="invoice_no"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.invoice_no}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                                            <input
                                                type="date"
                                                name="invoice_date"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.invoice_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Invoice Value</label>
                                            <input
                                                type="number"
                                                name="invoice_value"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.invoice_value}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                            <textarea
                                                name="remarks"
                                                rows={3}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Clear All
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : 'Log Call'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AddCall;