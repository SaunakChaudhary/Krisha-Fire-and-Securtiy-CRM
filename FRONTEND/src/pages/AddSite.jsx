import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapPin, Home, User, Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const AddSite = () => {

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
      if (!hasPermission("Manage Site")) {
        return navigate("/UserUnAuthorized/Manage Site");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    address: false,
    contact: false,
    details: false
  });
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [sameAsCustomer, setSameAsCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address dropdown data
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    site_name: '',
    status: 'New',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    address_line_4: '',
    postcode: '',
    country: '',
    state: '',
    city: '',
    title: '',
    contact_name: '',
    contact_no: '',
    contact_email: '',
    position: '',
    premises_type: '',
    route: '',
    distance: '',
    area: '',
    sales_person: '',
    admin_remarks: '',
    site_remarks: ''
  });

  const [errors, setErrors] = useState({
    customer_id: '',
    site_name: '',
    premises_type: '',
    address_line_1: '',
    postcode: '',
    country: '',
    state: '',
    city: ''
  });

  // Load countries on mount
  useEffect(() => {
    setCountryList(Country.getAllCountries());
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (formData.country) {
      const states = State.getStatesOfCountry(formData.country);
      setStateList(states);
    } else {
      setStateList([]);
    }
    setFormData(prev => ({ ...prev, state: '', city: '' }));
    setCityList([]);
  }, [formData.country]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.country && formData.state) {
      const cities = City.getCitiesOfState(formData.country, formData.state);
      setCityList(cities);
    } else {
      setCityList([]);
    }
    setFormData(prev => ({ ...prev, city: '' }));
  }, [formData.state, formData.country]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        toast.error('Failed to load customers');
        console.error('Error fetching customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Auto-fill form when sameAsCustomer is checked
  useEffect(() => {
    const fetchAndSetCustomerDetails = async (id) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/${id}`);
        if (!response.ok) throw new Error('Failed to fetch customer details');
        const customer = await response.json();

        // Find matching country
        let countryCode = '';
        if (customer.address?.country) {
          const foundCountry = Country.getAllCountries().find(
            c => c.name.toLowerCase() === customer.address.country.toLowerCase()
          );
          countryCode = foundCountry ? foundCountry.isoCode : '';
        }

        // Find matching state
        let stateCode = '';
        if (countryCode && customer.address?.state) {
          const states = State.getStatesOfCountry(countryCode);
          const foundState = states.find(
            s => s.name.toLowerCase() === customer.address.state.toLowerCase()
          );
          stateCode = foundState ? foundState.isoCode : '';
        }

        // Find matching city
        let cityName = '';
        if (countryCode && stateCode && customer.address?.city) {
          const cities = City.getCitiesOfState(countryCode, stateCode);
          const foundCity = cities.find(
            c => c.name.toLowerCase() === customer.address.city.toLowerCase()
          );
          cityName = foundCity ? foundCity.name : customer.address.city;
        }

        setFormData(prev => ({
          ...prev,
          title: customer.Title || '',
          contact_name: customer.Contact_person || '',
          contact_no: customer.contact_person_mobile || '',
          contact_email: customer.contact_person_email || '',
          position: customer.contact_person_designation || '',
          address_line_1: customer.address?.line1 || '',
          address_line_2: customer.address?.line2 || '',
          address_line_3: customer.address?.line3 || '',
          address_line_4: customer.address?.line4 || '',
          postcode: customer.address?.postcode || '',
          country: countryCode,
          state: stateCode,
          city: cityName
        }));

      } catch (error) {
        toast.error('Failed to load customer details');
        console.error('Error fetching customer details:', error);
      }
    };

    if (sameAsCustomer && formData.customer_id) {
      fetchAndSetCustomerDetails(formData.customer_id);
    }
  }, [sameAsCustomer, formData.customer_id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSameAsCustomerChange = (e) => {
    setSameAsCustomer(e.target.checked);
    if (!e.target.checked) {
      // Clear address and contact fields when unchecked
      setFormData(prev => ({
        ...prev,
        title: '',
        contact_name: '',
        contact_no: '',
        contact_email: '',
        position: '',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        address_line_4: '',
        postcode: '',
        country: '',
        state: '',
        city: ''
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      country: value,
      state: '',
      city: ''
    }));
    setStateList(State.getStatesOfCountry(value) || []);
    setCityList([]);
    if (errors.country) setErrors(prev => ({ ...prev, country: '' }));
  };

  const handleStateChange = (value) => {
    setFormData(prev => ({
      ...prev,
      state: value,
      city: ''
    }));
    setCityList(City.getCitiesOfState(formData.country, value) || []);
    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
  };

  const handleCityChange = (value) => {
    setFormData(prev => ({
      ...prev,
      city: value
    }));
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
      isValid = false;
    }
    if (!formData.site_name) {
      newErrors.site_name = 'Site name is required';
      isValid = false;
    }
    if (!formData.premises_type) {
      newErrors.premises_type = 'Premises type is required';
      isValid = false;
    }
    if (!formData.address_line_1) {
      newErrors.address_line_1 = 'Address line 1 is required';
      isValid = false;
    }
    if (!formData.postcode) {
      newErrors.postcode = 'Postcode is required';
      isValid = false;
    }
    if (!formData.country) {
      newErrors.country = 'Country is required';
      isValid = false;
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
      isValid = false;
    }
    if (!formData.city) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data for API
      const payload = {
        ...formData,
        distance: formData.distance ? Number(formData.distance) : undefined
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create site');
      }

      toast.success('Site created successfully!');
      navigate(`/view-site/${data._id}`);

    } catch (error) {
      console.error('Error creating site:', error);
      toast.error(error.message || 'Failed to create site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      customer_id: '',
      site_name: '',
      status: 'New',
      address_line_1: '',
      address_line_2: '',
      address_line_3: '',
      address_line_4: '',
      postcode: '',
      country: '',
      state: '',
      city: '',
      title: '',
      contact_name: '',
      contact_no: '',
      contact_email: '',
      position: '',
      premises_type: '',
      route: '',
      distance: '',
      area: '',
      sales_person: '',
      admin_remarks: '',
      site_remarks: ''
    });
    setSameAsCustomer(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Site</h1>
                <p className="text-xs sm:text-sm text-gray-500">Fill in the details to add a new site</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  <X size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  type="button"
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
                      <span className="hidden sm:inline">Save Site</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <form className="space-y-4">
              {/* Customer Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50">
                  <div className="flex items-center">
                    <User className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Select Customer
                    </h2>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Customer*
                        {errors.customer_id && (
                          <span className="ml-2 text-xs text-red-600">{errors.customer_id}</span>
                        )}
                      </label>
                      <select
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.customer_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.customer_id}
                        onChange={(e) => handleInputChange('customer_id', e.target.value)}
                        disabled={loadingCustomers}
                      >
                        <option value="">Select Customer</option>
                        {loadingCustomers ? (
                          <option>Loading customers...</option>
                        ) : (
                          customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.customer_name} ({customer.customer_code})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sameAsCustomer"
                        checked={sameAsCustomer}
                        onChange={handleSameAsCustomerChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        disabled={!formData.customer_id}
                      />
                      <label htmlFor="sameAsCustomer" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Use customer address and contact details
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('basic')}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <Home className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Basic Information
                    </h2>
                  </div>
                  {expandedSections.basic ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.basic ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Site Name*
                        {errors.site_name && (
                          <span className="ml-2 text-xs text-red-600">{errors.site_name}</span>
                        )}
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.site_name ? 'border-red-500' : 'border-gray-300 focus:border-transparent'
                          }`}
                        value={formData.site_name}
                        onChange={(e) => handleInputChange('site_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Live">Live</option>
                        <option value="Dead">Dead</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Premises Type*
                        {errors.premises_type && (
                          <span className="ml-2 text-xs text-red-600">{errors.premises_type}</span>
                        )}
                      </label>
                      <select
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.premises_type ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.premises_type}
                        onChange={(e) => handleInputChange('premises_type', e.target.value)}
                      >
                        <option value="">Select Premises Type</option>
                        <option value="COMMERCIAL_PROPERTY">Commercial Property</option>
                        <option value="MANUFACTURING_INDUSTRY">Manufacturing Industry</option>
                        <option value="MULTIPLEX_INDUSTRY">Multiplex Industry</option>
                        <option value="HOSPITAL">Hospital</option>
                        <option value="other">Other</option>
                      </select>
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
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Address Line 1*
                        {errors.address_line_1 && (
                          <span className="ml-2 text-xs text-red-600">{errors.address_line_1}</span>
                        )}
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.address_line_1 ? 'border-red-500' : 'border-gray-300 focus:border-transparent'
                          }`}
                        value={formData.address_line_1}
                        onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.address_line_2}
                        onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.address_line_3}
                        onChange={(e) => handleInputChange('address_line_3', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.address_line_4}
                        onChange={(e) => handleInputChange('address_line_4', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Postcode*
                        {errors.postcode && (
                          <span className="ml-2 text-xs text-red-600">{errors.postcode}</span>
                        )}
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.postcode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.postcode}
                        onChange={(e) => handleInputChange('postcode', e.target.value)}
                      />
                    </div>

                    {/* Country Dropdown */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Country*
                        {errors.country && (
                          <span className="ml-2 text-xs text-red-600">{errors.country}</span>
                        )}
                      </label>
                      <select
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.country ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                      >
                        <option value="">Select Country</option>
                        {countryList.map(country => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State Dropdown */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        State*
                        {errors.state && (
                          <span className="ml-2 text-xs text-red-600">{errors.state}</span>
                        )}
                      </label>
                      <select
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        disabled={!formData.country}
                      >
                        <option value="">Select State</option>
                        {stateList.map(state => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City Dropdown */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        City*
                        {errors.city && (
                          <span className="ml-2 text-xs text-red-600">{errors.city}</span>
                        )}
                      </label>
                      <select
                        className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        value={formData.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!formData.state}
                      >
                        <option value="">Select City</option>
                        {cityList.map(city => (
                          <option key={`${city.name}-${city.stateCode}`} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
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
                    <User className="text-red-600 mr-3" size={18} />
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.contact_name}
                        onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.contact_no}
                        onChange={(e) => handleInputChange('contact_no', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Details Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('details')}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <Info className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Additional Details
                    </h2>
                  </div>
                  {expandedSections.details ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.details ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Route</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.route}
                        onChange={(e) => handleInputChange('route', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.distance}
                        onChange={(e) => handleInputChange('distance', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Area</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sales Person</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.sales_person}
                        onChange={(e) => handleInputChange('sales_person', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Admin Remarks</label>
                      <textarea
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        rows="3"
                        value={formData.admin_remarks}
                        onChange={(e) => handleInputChange('admin_remarks', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Site Remarks</label>
                      <textarea
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        rows="3"
                        value={formData.site_remarks}
                        onChange={(e) => handleInputChange('site_remarks', e.target.value)}
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
                    'Save Site'
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

export default AddSite;