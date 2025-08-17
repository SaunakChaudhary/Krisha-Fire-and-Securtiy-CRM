import React, { useState } from 'react';
import {
    ChevronDown, ChevronUp,
    Check, X, Plus, Trash2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-hot-toast';
import { Country, State, City } from 'country-state-city';

const AddSupplier = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        address: false,
        contact: false,
        bank: false,
        terms: false,
        subcontractor: false,
        analysis: false
    });

    const [formData, setFormData] = useState({
        supplierName: '',
        status: 'Active',
        gstNo: '',
        registeredAddress: {
            address_line_1: '',
            address_line_2: '',
            address_line_3: '',
            address_line_4: '',
            postCode: '',
            country: '',
            countryCode: '',
            state: '',
            stateCode: '',
            city: ''
        },
        communicationAddress: {
            address_line_1: '',
            address_line_2: '',
            address_line_3: '',
            address_line_4: '',
            postCode: '',
            country: '',
            countryCode: '',
            state: '',
            stateCode: '',
            city: ''
        },
        sameAsRegistered: false,
        contacts: [{
            title: '',
            contact_person: '',
            position: '',
            email: '',
            telephoneNo: '',
            mobileNo: ''
        }],
        bankDetails: {
            bankName: '',
            bankAddress: '',
            accountNumber: '',
            ifsc: ''
        },
        terms: {
            creditLimit: '',
            tradeDiscount: '',
            settlementDiscount: '',
            settlementDays: '',
            minOrderValue: '',
            defaultPurchaseOrderSubmissionMethod: 'Email'
        },
        subcontractor: {
            isSubcontractor: false,
            hasInsuranceDocuments: false,
            hasHealthSafetyPolicy: false,
            insuranceExpirationDate: '',
            healthSafetyPolicyExpirationDate: ''
        },
        analysis: {
            gstExempt: false,
            currencyCode: 'INR'
        }
    });

    // Get all countries
    const countries = Country.getAllCountries();

    // Get states for the selected country in registered address
    const registeredStates = formData.registeredAddress.countryCode ? 
        State.getStatesOfCountry(formData.registeredAddress.countryCode) : [];

    // Get cities for the selected state in registered address
    const registeredCities = formData.registeredAddress.stateCode ? 
        City.getCitiesOfState(formData.registeredAddress.countryCode, formData.registeredAddress.stateCode) : [];

    // Get states for the selected country in communication address
    const communicationStates = formData.communicationAddress.countryCode ? 
        State.getStatesOfCountry(formData.communicationAddress.countryCode) : [];

    // Get cities for the selected state in communication address
    const communicationCities = formData.communicationAddress.stateCode ? 
        City.getCitiesOfState(formData.communicationAddress.countryCode, formData.communicationAddress.stateCode) : [];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // If "same as registered" is checked, copy registered address to communication address
        if (name === 'sameAsRegistered' && checked) {
            setFormData(prev => ({
                ...prev,
                communicationAddress: { ...prev.registeredAddress }
            }));
        }
    };

    const handleCountryChange = (addressType, e) => {
        const countryCode = e.target.value;
        const country = countries.find(c => c.isoCode === countryCode);
        
        setFormData(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                country: country ? country.name : '',
                countryCode: countryCode,
                state: '',
                stateCode: '',
                city: ''
            }
        }));
    };

    const handleStateChange = (addressType, e) => {
        const stateCode = e.target.value;
        const states = addressType === 'registeredAddress' ? registeredStates : communicationStates;
        const state = states.find(s => s.isoCode === stateCode);
        
        setFormData(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                state: state ? state.name : '',
                stateCode: stateCode,
                city: ''
            }
        }));
    };

    const handleCityChange = (addressType, e) => {
        const city = e.target.value;
        setFormData(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                city: city
            }
        }));
    };

    const handleContactChange = (index, e) => {
        const { name, value } = e.target;
        const updatedContacts = [...formData.contacts];
        updatedContacts[index] = {
            ...updatedContacts[index],
            [name]: value
        };
        setFormData(prev => ({
            ...prev,
            contacts: updatedContacts
        }));
    };

    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contacts: [
                ...prev.contacts,
                {
                    title: '',
                    contact_person: '',
                    position: '',
                    email: '',
                    telephoneNo: '',
                    mobileNo: ''
                }
            ]
        }));
    };

    const removeContact = (index) => {
        if (formData.contacts.length > 1) {
            const updatedContacts = [...formData.contacts];
            updatedContacts.splice(index, 1);
            setFormData(prev => ({
                ...prev,
                contacts: updatedContacts
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Prepare the data for API
            const payload = {
                ...formData,
                // Ensure communication address is same as registered if checkbox is checked
                communicationAddress: formData.sameAsRegistered
                    ? { ...formData.registeredAddress }
                    : formData.communicationAddress
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/supplier/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors && data.errors.length > 0) {
                    toast.error(data.errors.join('\n'));
                } else if (data.error) {
                    toast.error(data.error);
                } else {
                    toast.error('Failed to create supplier');
                }
                return;
            }

            toast.success('Supplier created successfully!');

            // Reset form after successful submission
            handleReset();

        } catch (error) {
            console.error('Error adding supplier:', error);
            toast.error('Failed to add supplier. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            supplierName: '',
            status: 'Active',
            gstNo: '',
            registeredAddress: {
                address_line_1: '',
                address_line_2: '',
                address_line_3: '',
                address_line_4: '',
                postCode: '',
                country: '',
                countryCode: '',
                state: '',
                stateCode: '',
                city: ''
            },
            communicationAddress: {
                address_line_1: '',
                address_line_2: '',
                address_line_3: '',
                address_line_4: '',
                postCode: '',
                country: '',
                countryCode: '',
                state: '',
                stateCode: '',
                city: ''
            },
            sameAsRegistered: false,
            contacts: [{
                title: '',
                contact_person: '',
                position: '',
                email: '',
                telephoneNo: '',
                mobileNo: ''
            }],
            bankDetails: {
                bankName: '',
                bankAddress: '',
                accountNumber: '',
                ifsc: ''
            },
            terms: {
                creditLimit: '',
                tradeDiscount: '',
                settlementDiscount: '',
                settlementDays: '',
                minOrderValue: '',
                defaultPurchaseOrderSubmissionMethod: 'Email'
            },
            subcontractor: {
                isSubcontractor: false,
                hasInsuranceDocuments: false,
                hasHealthSafetyPolicy: false,
                insuranceExpirationDate: '',
                healthSafetyPolicyExpirationDate: ''
            },
            analysis: {
                gstExempt: false,
                currencyCode: 'INR'
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Supplier</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Fill in the details to create a new supplier</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <X size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="hidden sm:inline">Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">Save Supplier</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <form className="space-y-4">
                            {/* Basic Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('basic')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Basic Information
                                    </h2>
                                    {expandedSections.basic ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.basic ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Supplier Name*</label>
                                            <input
                                                type="text"
                                                name="supplierName"
                                                value={formData.supplierName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            />
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
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Pending Approval">Pending Approval</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST No.</label>
                                            <input
                                                type="text"
                                                name="gstNo"
                                                value={formData.gstNo}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('address')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Address Information
                                    </h2>
                                    {expandedSections.address ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.address ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-medium text-gray-800">Registered Address</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                                                    <input
                                                        type="text"
                                                        name="registeredAddress.address_line_1"
                                                        value={formData.registeredAddress.address_line_1}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                                    <input
                                                        type="text"
                                                        name="registeredAddress.address_line_2"
                                                        value={formData.registeredAddress.address_line_2}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                                                    <input
                                                        type="text"
                                                        name="registeredAddress.address_line_3"
                                                        value={formData.registeredAddress.address_line_3}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                                                    <input
                                                        type="text"
                                                        name="registeredAddress.address_line_4"
                                                        value={formData.registeredAddress.address_line_4}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Post Code*</label>
                                                    <input
                                                        type="text"
                                                        name="registeredAddress.postCode"
                                                        value={formData.registeredAddress.postCode}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country*</label>
                                                    <select
                                                        name="registeredAddress.countryCode"
                                                        value={formData.registeredAddress.countryCode}
                                                        onChange={(e) => handleCountryChange('registeredAddress', e)}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        required
                                                    >
                                                        <option value="">Select Country</option>
                                                        {countries.map((country) => (
                                                            <option key={country.isoCode} value={country.isoCode}>
                                                                {country.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State*</label>
                                                    <select
                                                        name="registeredAddress.stateCode"
                                                        value={formData.registeredAddress.stateCode}
                                                        onChange={(e) => handleStateChange('registeredAddress', e)}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        required
                                                        disabled={!formData.registeredAddress.countryCode}
                                                    >
                                                        <option value="">Select State</option>
                                                        {registeredStates.map((state) => (
                                                            <option key={state.isoCode} value={state.isoCode}>
                                                                {state.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City*</label>
                                                    <select
                                                        name="registeredAddress.city"
                                                        value={formData.registeredAddress.city}
                                                        onChange={(e) => handleCityChange('registeredAddress', e)}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        required
                                                        disabled={!formData.registeredAddress.stateCode}
                                                    >
                                                        <option value="">Select City</option>
                                                        {registeredCities.map((city) => (
                                                            <option key={city.name} value={city.name}>
                                                                {city.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="sameAsRegistered"
                                                name="sameAsRegistered"
                                                checked={formData.sameAsRegistered}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="sameAsRegistered" className="ml-2 block text-sm text-gray-700">
                                                Communication Address is same as Registered Address
                                            </label>
                                        </div>

                                        {!formData.sameAsRegistered && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-medium text-gray-800">Communication Address</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                                                        <input
                                                            type="text"
                                                            name="communicationAddress.address_line_1"
                                                            value={formData.communicationAddress.address_line_1}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                                        <input
                                                            type="text"
                                                            name="communicationAddress.address_line_2"
                                                            value={formData.communicationAddress.address_line_2}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                                                        <input
                                                            type="text"
                                                            name="communicationAddress.address_line_3"
                                                            value={formData.communicationAddress.address_line_3}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                                                        <input
                                                            type="text"
                                                            name="communicationAddress.address_line_4"
                                                            value={formData.communicationAddress.address_line_4}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Post Code*</label>
                                                        <input
                                                            type="text"
                                                            name="communicationAddress.postCode"
                                                            value={formData.communicationAddress.postCode}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country*</label>
                                                        <select
                                                            name="communicationAddress.countryCode"
                                                            value={formData.communicationAddress.countryCode}
                                                            onChange={(e) => handleCountryChange('communicationAddress', e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        >
                                                            <option value="">Select Country</option>
                                                            {countries.map((country) => (
                                                                <option key={country.isoCode} value={country.isoCode}>
                                                                    {country.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State*</label>
                                                        <select
                                                            name="communicationAddress.stateCode"
                                                            value={formData.communicationAddress.stateCode}
                                                            onChange={(e) => handleStateChange('communicationAddress', e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                            disabled={!formData.communicationAddress.countryCode}
                                                        >
                                                            <option value="">Select State</option>
                                                            {communicationStates.map((state) => (
                                                                <option key={state.isoCode} value={state.isoCode}>
                                                                    {state.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City*</label>
                                                        <select
                                                            name="communicationAddress.city"
                                                            value={formData.communicationAddress.city}
                                                            onChange={(e) => handleCityChange('communicationAddress', e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                            disabled={!formData.communicationAddress.stateCode}
                                                        >
                                                            <option value="">Select City</option>
                                                            {communicationCities.map((city) => (
                                                                <option key={city.name} value={city.name}>
                                                                    {city.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('contact')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Contact Details
                                    </h2>
                                    {expandedSections.contact ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.contact ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 space-y-4">
                                        {formData.contacts.map((contact, index) => (
                                            <div key={index} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                                                {index > 0 && (
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeContact(index)}
                                                            className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                                        >
                                                            <Trash2 size={14} className="mr-1" />
                                                            Remove Contact
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                                                        <select
                                                            name="title"
                                                            value={contact.title}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        >
                                                            <option value="">Select Title</option>
                                                            <option value="Mr">Mr</option>
                                                            <option value="Mrs">Mrs</option>
                                                            <option value="Ms">Ms</option>
                                                            <option value="Dr">Dr</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Person*</label>
                                                        <input
                                                            type="text"
                                                            name="contact_person"
                                                            value={contact.contact_person}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Position</label>
                                                        <input
                                                            type="text"
                                                            name="position"
                                                            value={contact.position}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email*</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={contact.email}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telephone No.</label>
                                                        <input
                                                            type="tel"
                                                            name="telephoneNo"
                                                            value={contact.telephoneNo}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile No.*</label>
                                                        <input
                                                            type="tel"
                                                            name="mobileNo"
                                                            value={contact.mobileNo}
                                                            onChange={(e) => handleContactChange(index, e)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addContact}
                                            className="flex items-center text-red-600 hover:text-red-800 text-sm"
                                        >
                                            <Plus size={14} className="mr-1" />
                                            Add Another Contact
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('bank')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Bank Details
                                    </h2>
                                    {expandedSections.bank ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.bank ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name*</label>
                                            <input
                                                type="text"
                                                name="bankDetails.bankName"
                                                value={formData.bankDetails.bankName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Address</label>
                                            <input
                                                type="text"
                                                name="bankDetails.bankAddress"
                                                value={formData.bankDetails.bankAddress}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number*</label>
                                            <input
                                                type="text"
                                                name="bankDetails.accountNumber"
                                                value={formData.bankDetails.accountNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code*</label>
                                            <input
                                                type="text"
                                                name="bankDetails.ifsc"
                                                value={formData.bankDetails.ifsc}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('terms')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Terms
                                    </h2>
                                    {expandedSections.terms ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.terms ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                                            <input
                                                type="number"
                                                name="terms.creditLimit"
                                                value={formData.terms.creditLimit}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Trade Discount (%)</label>
                                            <input
                                                type="number"
                                                name="terms.tradeDiscount"
                                                value={formData.terms.tradeDiscount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Settlement Discount (%)</label>
                                            <input
                                                type="number"
                                                name="terms.settlementDiscount"
                                                value={formData.terms.settlementDiscount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Settlement Days</label>
                                            <input
                                                type="number"
                                                name="terms.settlementDays"
                                                value={formData.terms.settlementDays}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                                            <input
                                                type="number"
                                                name="terms.minOrderValue"
                                                value={formData.terms.minOrderValue}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Default PO Submission Method</label>
                                            <select
                                                name="terms.defaultPurchaseOrderSubmissionMethod"
                                                value={formData.terms.defaultPurchaseOrderSubmissionMethod}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="Email">Email</option>
                                                <option value="Portal">Portal</option>
                                                <option value="Fax">Fax</option>
                                                <option value="Post">Post</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-Contractor Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('subcontractor')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Sub-Contractor Information
                                    </h2>
                                    {expandedSections.subcontractor ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.subcontractor ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isSubcontractor"
                                                name="subcontractor.isSubcontractor"
                                                checked={formData.subcontractor.isSubcontractor}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="isSubcontractor" className="ml-2 block text-sm text-gray-700">
                                                Supplier Is A Sub-contractor?
                                            </label>
                                        </div>

                                        {formData.subcontractor.isSubcontractor && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id="hasInsuranceDocuments"
                                                            name="subcontractor.hasInsuranceDocuments"
                                                            checked={formData.subcontractor.hasInsuranceDocuments}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="hasInsuranceDocuments" className="ml-2 block text-sm text-gray-700">
                                                            In Possession Of Insurance Documents?
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id="hasHealthSafetyPolicy"
                                                            name="subcontractor.hasHealthSafetyPolicy"
                                                            checked={formData.subcontractor.hasHealthSafetyPolicy}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="hasHealthSafetyPolicy" className="ml-2 block text-sm text-gray-700">
                                                            In Possession Of Health And Safety Policy?
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                            Insurance Expiration Date
                                                            {formData.subcontractor.hasInsuranceDocuments && <span className="text-red-600">*</span>}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="subcontractor.insuranceExpirationDate"
                                                            value={formData.subcontractor.insuranceExpirationDate}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required={formData.subcontractor.hasInsuranceDocuments}
                                                            disabled={!formData.subcontractor.hasInsuranceDocuments}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                            Health And Safety Policy Expiration Date
                                                            {formData.subcontractor.hasHealthSafetyPolicy && <span className="text-red-600">*</span>}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="subcontractor.healthSafetyPolicyExpirationDate"
                                                            value={formData.subcontractor.healthSafetyPolicyExpirationDate}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                            required={formData.subcontractor.hasHealthSafetyPolicy}
                                                            disabled={!formData.subcontractor.hasHealthSafetyPolicy}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('analysis')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                        Analysis Information
                                    </h2>
                                    {expandedSections.analysis ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.analysis ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="gstExempt"
                                                name="analysis.gstExempt"
                                                checked={formData.analysis.gstExempt}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="gstExempt" className="ml-2 block text-sm text-gray-700">
                                                GST Exempt?
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Currency Code*</label>
                                            <select
                                                name="analysis.currencyCode"
                                                value={formData.analysis.currencyCode}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                required
                                            >
                                                <option value="INR">INR (Indian Rupee)</option>
                                                <option value="USD">USD (US Dollar)</option>
                                                <option value="EUR">EUR (Euro)</option>
                                                <option value="GBP">GBP (British Pound)</option>
                                                <option value="JPY">JPY (Japanese Yen)</option>
                                                <option value="AUD">AUD (Australian Dollar)</option>
                                                <option value="CAD">CAD (Canadian Dollar)</option>
                                                <option value="CNY">CNY (Chinese Yuan)</option>
                                                <option value="AED">AED (UAE Dirham)</option>
                                                <option value="SGD">SGD (Singapore Dollar)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AddSupplier;