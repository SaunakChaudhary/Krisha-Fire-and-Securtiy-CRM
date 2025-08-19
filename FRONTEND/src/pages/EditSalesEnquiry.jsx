import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, User, MapPin, Mail, Settings, Activity, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const EditSalesEnquiry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLead = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/sourceLead`)
            const data = await response.json();
            if (response.ok) {
                setLeads(data)
            } else {
                setLeads([])
            }
        }
        fetchLead();
    }, [])

    const [expandedSections, setExpandedSections] = useState({
        general: true,
        customer: false,
        admin: false,
        status: false
    });

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns "YYYY-MM-DD"
    };

    const formatDateTimeForInput = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        // Handle invalid dates
        if (isNaN(date.getTime())) return '';

        // Get local date components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Get local time components
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Format: YYYY-MM-DDTHH:MM
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        enquiry_code: '',
        company: '',
        status: '',
        customer: '',
        site: '',
        referealEngineer: '',
        TypeOfWork: '',
        clientType: 'Contractor',
        premisesType: 'Commercial property',
        systemType: '',
        salesPerson: '',
        adminRemarks: '',
        anticipatedStartDate: '',
        enquiryOn: '',
        enquiryBy: '',
        assignedOn: '',
        assignedTo: '',
        quotedOn: '',
        expectedOrderDate: '',
        expectedOrderValue: '',
        priority: 'Medium',
        wonDateTime: '',
        wonReason: '',
        orderValue: '',
        customerOrder: '',
        lostDateTime: '',
        lostReason: '',
        sourceLead: ''
    });

    const [companies, setCompanies] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sites, setSites] = useState([]);
    const [ workTypes, setWorkTypes] = useState([]);
    const [systems, setSystems] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [engineers, setEngineers] = useState([]);

    useEffect(() => {
        const fetchEnquiryData = async () => {
            try {
                setLoading(true);

                const enquiryResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-enquiry/${id}`);
                const enquiryData = await enquiryResponse.json();

                const [
                    companiesRes,
                    customersRes,
                    sitesRes,
                    workTypesRes,
                    systemsRes,
                    usersRes
                ] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/company`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/customers`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/sites`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/TypeOfWork`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/systems`),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user`)
                ]);

                const companiesData = await companiesRes.json();
                const customersData = await customersRes.json();
                const sitesData = await sitesRes.json();
                const workTypesData = await workTypesRes.json();
                const systemsData = await systemsRes.json();
                const usersData = await usersRes.json();
                
                const engineersData = usersData.users.filter(user => user.accesstype_id?.name === "Engineer");
                const salesData = usersData.users.filter(user => user.accesstype_id?.name === "Sales");

                setCompanies(companiesData);
                setCustomers(customersData);
                setSites(sitesData);
                setWorkTypes(workTypesData);
                setSystems(systemsData.systems);
                setSalesPersons(salesData);
                setEngineers(engineersData);

                const formatDateForInput = (date) => {
                    if (!date) return '';
                    const d = new Date(date);
                    return d.toISOString().slice(0, 16);
                };

                setFormData({
                    ...enquiryData,
                    anticipatedStartDate: formatDateForInput(enquiryData.anticipatedStartDate),
                    enquiryOn: formatDateForInput(enquiryData.enquiryOn),
                    assignedOn: formatDateForInput(enquiryData.assignedOn),
                    quotedOn: formatDateForInput(enquiryData.quotedOn),
                    expectedOrderDate: formatDateForInput(enquiryData.expectedOrderDate),
                    wonDateTime: formatDateForInput(enquiryData.wonDateTime),
                    lostDateTime: formatDateForInput(enquiryData.lostDateTime)
                });

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load enquiry data");
                navigate('/search-sales-enquiry');
            } finally {
                setLoading(false);
            }
        };

        fetchEnquiryData();
    }, [id, navigate]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formattedData = {
                ...formData,
                anticipatedStartDate: formData.anticipatedStartDate ? new Date(formData.anticipatedStartDate) : null,
                enquiryOn: formData.enquiryOn ? new Date(formData.enquiryOn) : null,
                assignedOn: formData.assignedOn ? new Date(formData.assignedOn) : null,
                quotedOn: formData.quotedOn ? new Date(formData.quotedOn) : null,
                expectedOrderDate: formData.expectedOrderDate ? new Date(formData.expectedOrderDate) : null,
                wonDateTime: formData.wonDateTime ? new Date(formData.wonDateTime) : null,
                lostDateTime: formData.lostDateTime ? new Date(formData.lostDateTime) : null
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-enquiry/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update enquiry');
            }

            const result = await response.json();
            toast.success('Sales enquiry updated successfully!');
            navigate('/search-sales-enquiry');
        } catch (error) {
            console.error('Error updating enquiry:', error);
            toast.error(error.message || 'Failed to update enquiry');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/search-sales-enquiry');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Sales Enquiry</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Enquiry Code: {formData.enquiry_code}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <X size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Cancel</span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <form className="space-y-4">
                            {/* General Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('general')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <FileText className="text-red-600 mr-3" size={18} />
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
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company*</label>
                                            <select
                                                name="company"
                                                value={formData.company._id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                disabled
                                            >
                                                <option value={formData.company._id}>{formData.company.company_name}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status*</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            >
                                                <option value="New Assigned">New Assigned</option>
                                                <option value="Quoted">Quoted</option>
                                                <option value="Won">Won</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Hold">Hold</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enquiry Code</label>
                                            <input
                                                type="text"
                                                name="enquiry_code"
                                                value={formData.enquiry_code}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('customer')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <User className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Customer & Site Information
                                        </h2>
                                    </div>
                                    {expandedSections.customer ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.customer ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer</label>
                                            <select
                                                name="customer"
                                                value={formData.customer._id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                disabled
                                            >
                                                <option value={formData.customer._id}>{formData.customer.customer_name}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Site</label>
                                            <select
                                                name="site"
                                                value={formData.site._id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                disabled
                                            >
                                                <option value={formData.site._id}>{formData.site.site_name}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={formData.site.contact_name || ''}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('admin')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Settings className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Admin
                                        </h2>
                                    </div>
                                    {expandedSections.admin ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.admin ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Source Lead</label>
                                            <select
                                                name="sourceLead"
                                                value={formData.sourceLead}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Source</option>
                                                {
                                                    leads.map((lead) => {
                                                        return (
                                                            <option key={lead._id} value={lead.name}>{lead.name}</option>
                                                        )
                                                    })
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Referral Engineer</label>
                                            <select
                                                name="referealEngineer"
                                                value={formData.referealEngineer}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Engineer</option>
                                                {engineers.map(engineer => (
                                                    <option key={engineer._id} value={engineer._id}>
                                                        {engineer.firstname} {engineer.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type of Work</label>
                                            <select
                                                name="TypeOfWork"
                                                value={formData.TypeOfWork}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Work Type</option>
                                                {workTypes.map(workType => (
                                                    <option key={workType._id} value={workType._id}>
                                                        {workType.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Client Type</label>
                                            <select
                                                name="clientType"
                                                value={formData.clientType}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="Contractor">Contractor</option>
                                                <option value="End User">End User</option>
                                                <option value="Honey Well">Honey Well</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Premises Type</label>
                                            <select
                                                name="premisesType"
                                                value={formData.premisesType}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="Commercial property">Commercial property</option>
                                                <option value="Manufacturing industry">Manufacturing industry</option>
                                                <option value="Multiplex">Multiplex</option>
                                                <option value="Hospital">Hospital</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">System Type</label>
                                            <select
                                                name="systemType"
                                                value={formData.systemType._id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select System Type</option>
                                                {systems.map(system => (
                                                    <option key={system._id} value={system._id}>
                                                        {system.systemName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sales Person*</label>
                                            <select
                                                name="salesPerson"
                                                value={formData.salesPerson}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            >
                                                <option value="">Select Sales Person</option>
                                                {salesPersons.map(person => (
                                                    <option key={person._id} value={person._id}>
                                                        {person.firstname} {person.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Admin Remarks</label>
                                            <textarea
                                                name="adminRemarks"
                                                value={formData.adminRemarks}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('status')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Activity className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Status
                                        </h2>
                                    </div>
                                    {expandedSections.status ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.status ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Anticipated Start Date</label>
                                            <input
                                                type="date"
                                                name="anticipatedStartDate"
                                                value={formatDateForInput(formData.anticipatedStartDate)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enquiry On</label>
                                            <input
                                                type="datetime-local"
                                                name="enquiryOn"
                                                value={formatDateTimeForInput(formData.enquiryOn)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enquiry By</label>
                                            <input
                                                type="text"
                                                name="enquiryBy"
                                                value={formData.enquiryBy}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Assigned On</label>
                                            <input
                                                type="datetime-local"
                                                name="assignedOn"
                                                value={formatDateTimeForInput(formData.assignedOn)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                            <select
                                                name="assignedTo"
                                                value={formData.assignedTo}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Person</option>
                                                {salesPersons.map(person => (
                                                    <option key={person._id} value={person._id}>
                                                        {person.firstname} {person.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quoted On</label>
                                            <input
                                                type="datetime-local"
                                                name="quotedOn"
                                                value={formatDateTimeForInput(formData.quotedOn)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expected Order Date</label>
                                            <input
                                                type="date"
                                                name="expectedOrderDate"
                                                value={formatDateForInput(formData.expectedOrderDate)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expected Order Value</label>
                                            <input
                                                type="number"
                                                name="expectedOrderValue"
                                                value={formData.expectedOrderValue}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority</label>
                                            <select
                                                name="priority"
                                                value={formData.priority}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Won Date and Time</label>
                                            <input
                                                type="datetime-local"
                                                name="wonDateTime"
                                                value={formatDateTimeForInput(formData.wonDateTime)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Won Reason</label>
                                            <input
                                                type="text"
                                                name="wonReason"
                                                value={formData.wonReason}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Order Value</label>
                                            <input
                                                type="number"
                                                name="orderValue"
                                                value={formData.orderValue}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer Order</label>
                                            <input
                                                type="text"
                                                name="customerOrder"
                                                value={formData.customerOrder}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Lost Date and Time</label>
                                            <input
                                                type="datetime-local"
                                                name="lostDateTime"
                                                value={formatDateTimeForInput(formData.lostDateTime)}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Lost Reason</label>
                                            <input
                                                type="text"
                                                name="lostReason"
                                                value={formData.lostReason}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditSalesEnquiry;