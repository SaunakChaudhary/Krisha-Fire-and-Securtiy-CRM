import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FileText, User, MapPin, Mail, Settings, Activity, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from "react-hot-toast"

const AddSalesEnquiry = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        customer: false,
        admin: false,
        status: false
    });

    const [companies, setCompanies] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [filteredSites, setFilteredSites] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [systems, setSystems] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [leads, setLeads] = useState([]);

    const [formData, setFormData] = useState({
        company: '',
        status: 'New Assigned',
        customer: '',
        site: '',
        referealEngineer: '',
        typeOfWork: '',
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
        lostReason: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const companiesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/company`);
                const companiesData = await companiesRes.json();
                
                const customersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
                const customersData = await customersRes.json();

                setCompanies(companiesData);
                setCustomers(customersData.filter(com => com.company_id._id === formData.company));

                // Fetch all sites
                const sitesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sites`);
                const sitesData = await sitesRes.json();
                setAllSites(sitesData);

                const workTypesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/TypeOfWork`);
                const workTypesData = await workTypesRes.json();
                setWorkTypes(workTypesData);

                const systemsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/systems`);
                const systemsData = await systemsRes.json();
                setSystems(systemsData.systems);

                const usersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/user`);
                const usersData = await usersRes.json();

                const engineersData = usersData.users.filter(user => user.accesstype_id.name === "Engineer");
                const salesData = usersData.users.filter(user => user.accesstype_id.name === "Sales");
                setEngineers(engineersData);
                setSalesPersons(salesData);

            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [formData.company]);

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

    useEffect(() => {
        if (formData.customer) {
            const filtered = allSites.filter(site => site.customer_id._id === formData.customer);
            setFilteredSites(filtered);
            setFormData(prev => ({ ...prev, site: '' }));
        } else {
            setFilteredSites([]);
        }
    }, [formData.customer, allSites]);

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

        if (!formData.company || !formData.status || !formData.customer || !formData.site) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-enquiry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    anticipatedStartDate: formData.anticipatedStartDate || undefined,
                    enquiryOn: formData.enquiryOn || undefined,
                    assignedOn: formData.assignedOn || undefined,
                    quotedOn: formData.quotedOn || undefined,
                    expectedOrderDate: formData.expectedOrderDate || undefined,
                    wonDateTime: formData.wonDateTime || undefined,
                    lostDateTime: formData.lostDateTime || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit enquiry');
            }

            toast.success('Sales Enquiry created successfully!');
            handleClear();

        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error(error.message || 'Failed to submit enquiry. Please try again.');
        }
    };

    const handleClear = () => {
        setFormData({
            company: '',
            status: 'New Assigned',
            customer: '',
            site: '',
            referealEngineer: '',
            typeOfWork: '',
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
            lostReason: ''
        });
    };

    const sectionStatus = {
        general: formData.company !== '' && formData.status !== '',
        customer: formData.customer !== '' && formData.site !== '',
        admin: formData.salesPerson !== '',
        status: formData.enquiryOn !== '' && formData.assignedTo !== ''
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
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Sales Enquiry</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Fill in the details to create a new sales enquiry</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleClear}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <X size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Check size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Save Enquiry</span>
                                    <span className="sm:hidden">Save</span>
                                </button>
                            </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
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
                                        {sectionStatus.general && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
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
                                                value={formData.company}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Select Company</option>
                                                {companies.map(company => (
                                                    <option key={company._id} value={company._id}>
                                                        {company.company_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status*</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="New Assigned">New Assigned</option>
                                                <option value="Quoted">Quoted</option>
                                                <option value="Won">Won</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Hold">Hold</option>
                                            </select>
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
                                        {sectionStatus.customer && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
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
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer*</label>
                                            <select
                                                name="customer"
                                                value={formData.customer}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Select Customer</option>
                                                {customers.map(customer => (
                                                    <option key={customer._id} value={customer._id}>
                                                        {customer.customer_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Site*</label>
                                            <select
                                                name="site"
                                                value={formData.site}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                                disabled={!formData.customer}
                                            >
                                                <option value="">Select Site</option>
                                                {filteredSites.map(site => (
                                                    <option key={site._id} value={site._id}>
                                                        {site.site_name}
                                                    </option>
                                                ))}
                                            </select>
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
                                        {sectionStatus.admin && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
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
                                                        {engineer.firstname + " " + engineer.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type of Work</label>
                                            <select
                                                name="typeOfWork"
                                                value={formData.typeOfWork}
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
                                                value={formData.systemType}
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
                                                        {person.firstname + " " + person.lastname}
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
                                        {sectionStatus.status && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
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
                                                value={formData.anticipatedStartDate}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enquiry On</label>
                                            <input
                                                type="datetime-local"
                                                name="enquiryOn"
                                                value={formData.enquiryOn}
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
                                                value={formData.assignedOn}
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
                                                <option value="">Select Sales Person</option>
                                                {salesPersons.map(person => (
                                                    <option key={person.id} value={person.id}>
                                                        {person.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quoted On</label>
                                            <input
                                                type="datetime-local"
                                                name="quotedOn"
                                                value={formData.quotedOn}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expected Order Date</label>
                                            <input
                                                type="date"
                                                name="expectedOrderDate"
                                                value={formData.expectedOrderDate}
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
                                                value={formData.wonDateTime}
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
                                                value={formData.lostDateTime}
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
                                    onClick={handleClear}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Clear All
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Save Enquiry
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AddSalesEnquiry;