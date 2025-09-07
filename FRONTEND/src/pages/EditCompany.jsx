import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, Mail, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Country, State, City } from 'country-state-city';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { AuthContext } from "../Context/AuthContext";

const EditCompany = () => {

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
      if (!hasPermission("Manage Company")) {
        return navigate("/UserUnAuthorized/Manage Company");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sameAsAbove, setSameAsAbove] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [registeredStates, setRegisteredStates] = useState([]);
  const [registeredCities, setRegisteredCities] = useState([]);
  const [communicationStates, setCommunicationStates] = useState([]);
  const [communicationCities, setCommunicationCities] = useState([]);

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    registered: false,
    communication: false
  });

  const [formData, setFormData] = useState({
    general: {
      name: '',
      contactName: '',
      status: 'active',
      currency: 'INR',
      gstNo: '',
      isPrimary: 'No',
      logo: null
    },
    registeredAddress: {
      address1: '',
      address2: '',
      address3: '',
      address4: '',
      postCode: '',
      email: '',
      country: '',
      state: '',
      city: '',
      telephone: '',
      mobile: ''
    },
    communicationAddress: {
      address1: '',
      address2: '',
      address3: '',
      address4: '',
      postCode: '',
      email: '',
      country: '',
      state: '',
      city: '',
      telephone: '',
      mobile: '',
      contactPerson: ''
    }
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesData = Country.getAllCountries();
        setCountries(countriesData);
      } catch (error) {
        toast.error('Failed to fetch countries');
        console.error(error);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company');
        }
        const data = await response.json();

        // Transform the API data to match our form structure
        setFormData({
          general: {
            name: data.company_name,
            contactName: data.contact_name || '',
            status: data.status || 'active',
            currency: data.currency || 'INR',
            gstNo: data.GST_No || '',
            isPrimary: data.primary_company ? 'Yes' : 'No',
            logo: null
          },
          registeredAddress: {
            address1: data.registered_address_id?.address_line1 || '',
            address2: data.registered_address_id?.address_line2 || '',
            address3: data.registered_address_id?.address_line3 || '',
            address4: data.registered_address_id?.address_line4 || '',
            postCode: data.registered_address_id?.postcode || '',
            email: data.registered_address_id?.email || '',
            country: data.registered_address_id?.country || '',
            state: data.registered_address_id?.state || '',
            city: data.registered_address_id?.city || '',
            telephone: data.registered_address_id?.telephone_no || '',
            mobile: data.registered_address_id?.mobile_no || ''
          },
          communicationAddress: {
            address1: data.communication_address_id?.address_line1 || '',
            address2: data.communication_address_id?.address_line2 || '',
            address3: data.communication_address_id?.address_line3 || '',
            address4: data.communication_address_id?.address_line4 || '',
            postCode: data.communication_address_id?.postcode || '',
            email: data.communication_address_id?.email || '',
            country: data.communication_address_id?.country || '',
            state: data.communication_address_id?.state || '',
            city: data.communication_address_id?.city || '',
            telephone: data.communication_address_id?.telephone_no || '',
            mobile: data.communication_address_id?.mobile_no || '',
            contactPerson: data.communication_address_id?.contact_person || ''
          }
        });

        setSameAsAbove(data.same_as_registered_address || false);

        if (data.logo) {
          const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, '');
          setLogoPreview(`${baseApi}/${data.logo}`);
        }

        // Fetch states and cities for registered address if country is set
        if (data.registered_address_id?.country) {
          fetchStates(data.registered_address_id.country, 'registered');
        }
        if (data.registered_address_id?.state && data.registered_address_id?.country) {
          fetchCities(data.registered_address_id.country, data.registered_address_id.state, 'registered');
        }

        // Fetch states and cities for communication address if country is set
        if (data.communication_address_id?.country) {
          fetchStates(data.communication_address_id.country, 'communication');
        }
        if (data.communication_address_id?.state && data.communication_address_id?.country) {
          fetchCities(data.communication_address_id.country, data.communication_address_id.state, 'communication');
        }

      } catch (error) {
        toast.error(error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id, countries]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const fetchStates = async (countryName, type) => {
    try {
      const countryObj = countries.find(c => c.name === countryName);
      console.log(countries)

      if (!countryObj) return;
      const statesData = State.getStatesOfCountry(countryObj.isoCode);
      const statesList = statesData.map(state => state.name).sort();

      if (type === 'registered') {
        setRegisteredStates(statesList);
      } else {
        setCommunicationStates(statesList);
      }
    } catch (error) {
      toast.error('Failed to fetch states');
      console.error(error);
    }
  };

  const fetchCities = async (countryName, stateName, type) => {
    try {
      const countryObj = countries.find(c => c.name === countryName);
      if (!countryObj) return;

      const stateObj = State.getStatesOfCountry(countryObj.isoCode)
        .find(s => s.name === stateName);
      if (!stateObj) return;

      const citiesData = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
      const citiesList = citiesData.map(city => city.name).sort();

      if (type === 'registered') {
        setRegisteredCities(citiesList);
      } else {
        setCommunicationCities(citiesList);
      }
    } catch (error) {
      toast.error('Failed to fetch cities');
      console.error(error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Handle country change - reset state and city
    if (field === 'country') {
      if (section === 'registeredAddress') {
        setRegisteredStates([]);
        setRegisteredCities([]);
        setFormData(prev => ({
          ...prev,
          registeredAddress: {
            ...prev.registeredAddress,
            state: '',
            city: ''
          }
        }));
        if (value) {
          fetchStates(value, 'registered');
        }
      } else if (section === 'communicationAddress') {
        setCommunicationStates([]);
        setCommunicationCities([]);
        setFormData(prev => ({
          ...prev,
          communicationAddress: {
            ...prev.communicationAddress,
            state: '',
            city: ''
          }
        }));
        if (value) {
          fetchStates(value, 'communication');
        }
      }
    }

    // Handle state change - reset city
    if (field === 'state') {
      if (section === 'registeredAddress') {
        setRegisteredCities([]);
        setFormData(prev => ({
          ...prev,
          registeredAddress: {
            ...prev.registeredAddress,
            city: ''
          }
        }));
        if (value && formData.registeredAddress.country) {
          fetchCities(formData.registeredAddress.country, value, 'registered');
        }
      } else if (section === 'communicationAddress') {
        setCommunicationCities([]);
        setFormData(prev => ({
          ...prev,
          communicationAddress: {
            ...prev.communicationAddress,
            city: ''
          }
        }));
        if (value && formData.communicationAddress.country) {
          fetchCities(formData.communicationAddress.country, value, 'communication');
        }
      }
    }

    // For logo, preview instantly
    if (section === 'general' && field === 'logo' && value) {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      const url = URL.createObjectURL(value);
      setLogoPreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.general.name) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.registeredAddress.address1 || !formData.registeredAddress.city) {
      toast.error('Registered address line 1 and city are required');
      return;
    }

    if (!sameAsAbove && (!formData.communicationAddress.address1 || !formData.communicationAddress.city)) {
      toast.error('Communication address line 1 and city are required');
      return;
    }

    const formDataToSend = new FormData();

    // Append simple fields
    formDataToSend.append('company_name', formData.general.name);
    formDataToSend.append('contact_name', formData.general.contactName || '');
    formDataToSend.append('status', formData.general.status.toLowerCase());
    formDataToSend.append('currency', formData.general.currency);
    formDataToSend.append('GST_No', formData.general.gstNo || '');
    formDataToSend.append('primary_company', formData.general.isPrimary === "Yes" ? 'true' : 'false');
    formDataToSend.append('same_as_registered_address', sameAsAbove ? 'true' : 'false');

    // Append registered address fields
    formDataToSend.append('registered_address[address_line1]', formData.registeredAddress.address1);
    formDataToSend.append('registered_address[address_line2]', formData.registeredAddress.address2 || '');
    formDataToSend.append('registered_address[address_line3]', formData.registeredAddress.address3 || '');
    formDataToSend.append('registered_address[address_line4]', formData.registeredAddress.address4 || '');
    formDataToSend.append('registered_address[postcode]', formData.registeredAddress.postCode || '');
    formDataToSend.append('registered_address[email]', formData.registeredAddress.email || '');
    formDataToSend.append('registered_address[country]', formData.registeredAddress.country || '');
    formDataToSend.append('registered_address[state]', formData.registeredAddress.state || '');
    formDataToSend.append('registered_address[city]', formData.registeredAddress.city);
    formDataToSend.append('registered_address[telephone_no]', formData.registeredAddress.telephone || '');
    formDataToSend.append('registered_address[mobile_no]', formData.registeredAddress.mobile || '');
    formDataToSend.append('registered_address[alternative_mno]', '');

    // Append communication address if different
    if (!sameAsAbove) {
      formDataToSend.append('communication_address[address_line1]', formData.communicationAddress.address1);
      formDataToSend.append('communication_address[address_line2]', formData.communicationAddress.address2 || '');
      formDataToSend.append('communication_address[address_line3]', formData.communicationAddress.address3 || '');
      formDataToSend.append('communication_address[address_line4]', formData.communicationAddress.address4 || '');
      formDataToSend.append('communication_address[postcode]', formData.communicationAddress.postCode || '');
      formDataToSend.append('communication_address[email]', formData.communicationAddress.email || '');
      formDataToSend.append('communication_address[country]', formData.communicationAddress.country || '');
      formDataToSend.append('communication_address[state]', formData.communicationAddress.state || '');
      formDataToSend.append('communication_address[city]', formData.communicationAddress.city);
      formDataToSend.append('communication_address[telephone_no]', formData.communicationAddress.telephone || '');
      formDataToSend.append('communication_address[mobile_no]', formData.communicationAddress.mobile || '');
      formDataToSend.append('communication_address[alternative_mno]', '');
      formDataToSend.append('communication_address[contact_person]', formData.communicationAddress.contactPerson || '');
    }

    if (formData.general.logo) {
      formDataToSend.append('logo', formData.general.logo);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company/${id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.company && data.company.logo) {
          const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, '');
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
          }
          setLogoPreview(`${baseApi}/${data.company.logo}`);
        }
        toast.success('Company updated successfully!');
        navigate('/search-company');
      } else {
        throw new Error(data.message || 'Failed to update company');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update company!');
      console.error(error);
    }
  };

  const handleClear = () => {
    navigate(`/search-company`);
  };

  const sectionStatus = {
    general: formData.general.name !== '' && formData.general.contactName !== '',
    registered: formData.registeredAddress.address1 !== '' && formData.registeredAddress.city !== '',
    communication: sameAsAbove || (formData.communicationAddress.address1 !== '' && formData.communicationAddress.city !== '')
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
          <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
            <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
              <p className="text-lg text-gray-600">Loading company data...</p>
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Company</h1>
                <p className="text-xs sm:text-sm text-gray-500">Update the details of this company</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleClear}
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  <X size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  type="submit"
                  form="company-form"
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                >
                  <Check size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Update Company</span>
                  <span className="sm:hidden">Update</span>
                </button>
              </div>
            </div>

            {/* Form Sections */}
            <form id="company-form" className="space-y-4" onSubmit={handleSubmit}>
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
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company Name*</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        value={formData.general.name}
                        onChange={(e) => handleInputChange('general', 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.general.contactName}
                        onChange={(e) => handleInputChange('general', 'contactName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.general.status}
                        onChange={(e) => handleInputChange('general', 'status', e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.general.currency}
                        onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
                      >
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.general.gstNo}
                        onChange={(e) => handleInputChange('general', 'gstNo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Primary Company?</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.general.isPrimary}
                        onChange={(e) => handleInputChange('general', 'isPrimary', e.target.value)}
                      >
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-xs sm:text-sm text-gray-500
                          file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4
                          file:rounded-md file:border-0
                          file:text-xs sm:file:text-sm file:font-semibold
                          file:bg-red-50 file:text-red-700
                          hover:file:bg-red-100"
                          onChange={(e) => handleInputChange('general', 'logo', e.target.files[0])}
                        />
                      </div>
                      {logoPreview && (
                        <div className="mt-2">
                          <img
                            src={logoPreview}
                            alt="Company Logo Preview"
                            className="h-32 object-contain"
                          />
                        </div>
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
                    {sectionStatus.registered && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                        ✓
                      </span>
                    )}
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        value={formData.registeredAddress.address1}
                        onChange={(e) => handleInputChange('registeredAddress', 'address1', e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.address2}
                        onChange={(e) => handleInputChange('registeredAddress', 'address2', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.address3}
                        onChange={(e) => handleInputChange('registeredAddress', 'address3', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.address4}
                        onChange={(e) => handleInputChange('registeredAddress', 'address4', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Post Code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.postCode}
                        onChange={(e) => handleInputChange('registeredAddress', 'postCode', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.email}
                        onChange={(e) => handleInputChange('registeredAddress', 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.country}
                        onChange={(e) => handleInputChange('registeredAddress', 'country', e.target.value)}
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country.isoCode} value={country.name}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.state}
                        onChange={(e) => handleInputChange('registeredAddress', 'state', e.target.value)}
                        disabled={!formData.registeredAddress.country}
                      >
                        <option value="">Select State</option>
                        {registeredStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City*</label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        value={formData.registeredAddress.city}
                        onChange={(e) => handleInputChange('registeredAddress', 'city', e.target.value)}
                        disabled={!formData.registeredAddress.state}
                        required
                      >
                        <option value="">Select City</option>
                        {registeredCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telephone</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.telephone}
                        onChange={(e) => handleInputChange('registeredAddress', 'telephone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                        value={formData.registeredAddress.mobile}
                        onChange={(e) => handleInputChange('registeredAddress', 'mobile', e.target.value)}
                      />
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
                      Communication Address
                    </h2>
                    {sectionStatus.communication && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  {expandedSections.communication ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.communication ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          checked={sameAsAbove}
                          onChange={() => setSameAsAbove(!sameAsAbove)}
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">Same as registered address</span>
                      </label>
                    </div>

                    {!sameAsAbove ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            value={formData.communicationAddress.address1}
                            onChange={(e) => handleInputChange('communicationAddress', 'address1', e.target.value)}
                            required={!sameAsAbove}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.address2}
                            onChange={(e) => handleInputChange('communicationAddress', 'address2', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.address3}
                            onChange={(e) => handleInputChange('communicationAddress', 'address3', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.address4}
                            onChange={(e) => handleInputChange('communicationAddress', 'address4', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Post Code</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.postCode}
                            onChange={(e) => handleInputChange('communicationAddress', 'postCode', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.email}
                            onChange={(e) => handleInputChange('communicationAddress', 'email', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country</label>
                          <select
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.country}
                            onChange={(e) => handleInputChange('communicationAddress', 'country', e.target.value)}
                          >
                            <option value="">Select Country</option>
                            {countries.map(country => (
                              <option key={country.isoCode} value={country.name}>{country.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                          <select
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.state}
                            onChange={(e) => handleInputChange('communicationAddress', 'state', e.target.value)}
                            disabled={!formData.communicationAddress.country}
                          >
                            <option value="">Select State</option>
                            {communicationStates.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City*</label>
                          <select
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            value={formData.communicationAddress.city}
                            onChange={(e) => handleInputChange('communicationAddress', 'city', e.target.value)}
                            disabled={!formData.communicationAddress.state}
                            required={!sameAsAbove}
                          >
                            <option value="">Select City</option>
                            {communicationCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telephone</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.telephone}
                            onChange={(e) => handleInputChange('communicationAddress', 'telephone', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.mobile}
                            onChange={(e) => handleInputChange('communicationAddress', 'mobile', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            value={formData.communicationAddress.contactPerson}
                            onChange={(e) => handleInputChange('communicationAddress', 'contactPerson', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs sm:text-sm text-gray-500 bg-gray-50 rounded-md">
                        Communication address will be same as registered address
                      </div>
                    )}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Update Company
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditCompany;