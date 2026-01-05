import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { User, MapPin, Mail, CreditCard, Check, X, ChevronDown, ChevronUp, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Country, State, City } from 'country-state-city';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const AddCustomer = () => {
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
            if (!hasPermission("Manage Customer")) {
                return navigate("/UserUnAuthorized/Manage Customer");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        address: false,
        financial: false,
        contact: false,
        lead: false
    });

    const [formData, setFormData] = useState({
        customer_name: '',
        GST_No: '',
        GST_Exempt: false,
        status: 'lead',
        Title: 'Mr.',
        Contact_person: '',
        contact_person_secondary: '',
        contact_person_designation: '',
        contact_person_email: '',
        contact_person_mobile: '',
        company_id: '',
        address: {
            line1: '',
            line2: '',
            line3: '',
            line4: '',
            city: '',
            state: '',
            country: '',
            postcode: ''
        },
        email: '',
        telephone_no: '',
        mobile_no: '',
        bank_name: '',
        account_number: '',
        IFSC: '',
        bank_address: '',
        Payment_method: '',
        currency: 'INR',
        credit_limit: '',
        credit_days: '',
        creditCharge: 0,
        credit_withdrawn: false,
        payment_due_EOM_Terms: '',
        lead_source: '',
        industry_type: '',
        next_follow_up_date: '',
        is_converted: false,
        pan_no: ''
    });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const countries = Country.getAllCountries();
        setCountries(countries);

        fetch(`${import.meta.env.VITE_API_URL}/company`)
            .then(response => response.json())
            .then(data => setCompanies(data))
            .catch(error => console.error('Error fetching companies:', error));
    }, []);


    useEffect(() => {
        const fetchLead = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reference-codes/category/sourceLead`)
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
        if (formData.address.country) {
            const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
            const states = countryObj ? State.getStatesOfCountry(countryObj.isoCode) : [];
            setStates(states);
        }
    }, [formData.address.country]);

    useEffect(() => {
        if (formData.address.country && formData.address.state) {
            const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
            const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(s => s.name === formData.address.state);
            const cities = stateObj ? City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode) : [];
            setCities(cities.map(city => city.name));
        }
    }, [formData.address.state]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customer_name || !formData.status) {
            toast.error('Customer name and status are required');
            return;
        }

        if (!formData.Contact_person) {
            toast.error('Contact person is required');
            return;
        }

        if (formData.status === 'customer' && !formData.Payment_method) {
            toast.error('Payment method is required for customers');
            return;
        }

        if (formData.status === 'lead' && !formData.lead_source) {
            toast.error('Lead source is required for leads');
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionData = {
                ...formData,
                credit_limit: Number(formData.credit_limit) || 0,
                credit_days: Number(formData.credit_days) || 0,
                creditCharge: Number(formData.creditCharge) || 0,
                is_converted: formData.status === 'customer' ? true : formData.is_converted,
                company_id: formData.company_id || undefined
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Customer created successfully!');
                handleClear();
            } else {
                throw new Error(data.message || 'Failed to create customer');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        setFormData({
            customer_name: '',
            GST_No: '',
            GST_Exempt: false,
            status: 'lead',
            Title: 'Mr.',
            Contact_person: '',
            contact_person_secondary: '',
            contact_person_designation: '',
            contact_person_email: '',
            contact_person_mobile: '',
            company_id: '',
            address: {
                line1: '',
                line2: '',
                line3: '',
                line4: '',
                city: '',
                state: '',
                country: '',
                postcode: ''
            },
            email: '',
            telephone_no: '',
            mobile_no: '',
            bank_name: '',
            account_number: '',
            IFSC: '',
            bank_address: '',
            Payment_method: '',
            currency: 'INR',
            credit_limit: '',
            credit_days: '',
            creditCharge: 0,
            credit_withdrawn: false,
            payment_due_EOM_Terms: '',
            lead_source: '',
            industry_type: '',
            next_follow_up_date: '',
            is_converted: false,
            pan_no: ''
        });
    };

    const sectionStatus = {
        general: formData.customer_name && formData.status,
        address: formData.address.line1 && formData.address.city && formData.address.country,
        financial: formData.status && formData.Payment_method,
        contact: formData.Contact_person && (formData.email || formData.contact_person_email),
        lead: formData.status !== 'lead' || formData.lead_source
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
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Customer</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Fill in the details to register a new customer</p>
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
                                    disabled={isSubmitting}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="inline-flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : (
                                        <>
                                            <Check size={14} className="mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Save Customer</span>
                                            <span className="sm:hidden">Save</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Form Sections */}
                        <form className="space-y-4">
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
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer Name*</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                value={formData.customer_name}
                                                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status*</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                required
                                            >
                                                <option value="lead">Lead</option>
                                                <option value="customer">Customer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.company_id}
                                                onChange={(e) => handleInputChange('company_id', e.target.value)}
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
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.GST_No}
                                                onChange={(e) => handleInputChange('GST_No', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.pan_no}
                                                onChange={(e) => handleInputChange('pan_no', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                checked={formData.GST_Exempt}
                                                onChange={(e) => handleInputChange('GST_Exempt', e.target.checked)}
                                            />
                                            <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                GST Exempt
                                            </label>
                                        </div>
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
                                        {sectionStatus.contact && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
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
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.Title}
                                                onChange={(e) => handleInputChange('Title', e.target.value)}
                                            >
                                                <option>Mr.</option>
                                                <option>Mrs.</option>
                                                <option>Ms.</option>
                                                <option>Dr.</option>
                                                <option>Miss</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Person*</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.Contact_person}
                                                onChange={(e) => handleInputChange('Contact_person', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Secondary Contact</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.contact_person_secondary}
                                                onChange={(e) => handleInputChange('contact_person_secondary', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Designation</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.contact_person_designation}
                                                onChange={(e) => handleInputChange('contact_person_designation', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Email*</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.contact_person_email}
                                                onChange={(e) => handleInputChange('contact_person_email', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Mobile</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.contact_person_mobile}
                                                onChange={(e) => handleInputChange('contact_person_mobile', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telephone</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.telephone_no}
                                                onChange={(e) => handleInputChange('telephone_no', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.mobile_no}
                                                onChange={(e) => handleInputChange('mobile_no', e.target.value)}
                                            />
                                        </div>
                                    </div>
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
                                        {sectionStatus.address && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.address ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.address ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.line1}
                                                onChange={(e) => handleAddressChange('line1', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.line2}
                                                onChange={(e) => handleAddressChange('line2', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.line3}
                                                onChange={(e) => handleAddressChange('line3', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.line4}
                                                onChange={(e) => handleAddressChange('line4', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.postcode}
                                                onChange={(e) => handleAddressChange('postcode', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country*</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.country}
                                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map((country, idx) => (
                                                    <option key={idx} value={country.name}>{country.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.address.state}
                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                                disabled={!formData.address.country}
                                            >
                                                <option value="">Select State</option>
                                                {states.map(state => (
                                                    <option key={state.isoCode} value={state.name}>{state.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City*</label>
                                            {formData.address.country === 'India' ? (
                                                <select
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={formData.address.city}
                                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                                    disabled={!formData.address.state}
                                                    required
                                                >
                                                    <option value="">Select City</option>
                                                    {cities.map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={formData.address.city}
                                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                                    required
                                                />
                                            )}
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
                                        {sectionStatus.financial && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.financial ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.financial ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Method*</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.Payment_method}
                                                onChange={(e) => handleInputChange('Payment_method', e.target.value)}
                                                required={formData.status === 'customer'}
                                            >
                                                <option value="">Select Method</option>
                                                <option>Invoice</option>
                                                <option>Direct Debit</option>
                                                <option>Standing Order</option>
                                                <option>Unknown</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Currency</label>
                                            <select
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.currency}
                                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                            >
                                                <option>INR</option>
                                                <option>USD</option>
                                                <option>EUR</option>
                                                <option>GBP</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.credit_limit}
                                                onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Credit Days</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.credit_days}
                                                onChange={(e) => handleInputChange('credit_days', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Credit Charge (%)</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.creditCharge}
                                                onChange={(e) => handleInputChange('creditCharge', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                checked={formData.credit_withdrawn}
                                                onChange={(e) => handleInputChange('credit_withdrawn', e.target.checked)}
                                            />
                                            <label className="ml-2 block text-xs sm:text-sm text-gray-700">
                                                Credit Withdrawn
                                            </label>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.payment_due_EOM_Terms}
                                                onChange={(e) => handleInputChange('payment_due_EOM_Terms', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.bank_name}
                                                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.account_number}
                                                onChange={(e) => handleInputChange('account_number', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.IFSC}
                                                onChange={(e) => handleInputChange('IFSC', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Address</label>
                                            <textarea
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                value={formData.bank_address}
                                                onChange={(e) => handleInputChange('bank_address', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lead Information Section (only shown when status is lead) */}
                            {formData.status === 'lead' && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleSection('lead')}
                                        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center">
                                            <Building className="text-red-600 mr-3" size={18} />
                                            <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                                Lead Information
                                            </h2>
                                            {sectionStatus.lead && (
                                                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        {expandedSections.lead ? (
                                            <ChevronUp size={18} className="text-gray-500" />
                                        ) : (
                                            <ChevronDown size={18} className="text-gray-500" />
                                        )}
                                    </button>
                                    <div className={`transition-all duration-300 overflow-hidden ${expandedSections.lead ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Lead Source*</label>
                                                <select
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={formData.lead_source}
                                                    onChange={(e) => handleInputChange('lead_source', e.target.value)}
                                                    required
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
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Industry Type</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={formData.industry_type}
                                                    onChange={(e) => handleInputChange('industry_type', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    value={formData.next_follow_up_date}
                                                    onChange={(e) => handleInputChange('next_follow_up_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="inline-flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : (
                                        'Save Customer'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AddCustomer;