import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Printer,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Shield,
  Globe,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const EditSupplier = () => {
  const { id } = useParams(); 

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
      if (!hasPermission("Manage Supplier")) {
        return navigate("/UserUnAuthorized/Manage Supplier");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/supplier/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();
        setSupplier(data.data);
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast.error(error.message);
        navigate('/suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSupplier(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setSupplier(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // If "same as registered" is checked, copy registered address to communication address
    if (name === 'sameAsRegistered' && checked) {
      setSupplier(prev => ({
        ...prev,
        communicationAddress: { ...prev.registeredAddress }
      }));
    }
  };

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...supplier.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value
    };
    setSupplier(prev => ({
      ...prev,
      contacts: updatedContacts
    }));
  };

  const addContact = () => {
    setSupplier(prev => ({
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
    if (supplier.contacts.length > 1) {
      const updatedContacts = [...supplier.contacts];
      updatedContacts.splice(index, 1);
      setSupplier(prev => ({
        ...prev,
        contacts: updatedContacts
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/supplier/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(supplier)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          toast.error(data.errors.join('\n'));
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.error('Failed to update supplier');
        }
        return;
      }

      toast.success('Supplier updated successfully!');
      navigate(`/view-supplier/${id}`);

    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} />
          <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mb-4 sm:mb-6"></div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} />
          <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <p className="text-gray-600">Supplier not found</p>
                <button
                  onClick={() => navigate('/suppliers')}
                  className="mt-4 text-red-600 hover:text-red-800 text-sm sm:text-base"
                >
                  Back to Suppliers
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Mobile tab selector
  const MobileTabSelector = () => (
    <div className="sm:hidden mb-4">
      <select
        onChange={(e) => setActiveTab(e.target.value)}
        value={activeTab}
        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
      >
        <option value="basic">Basic Information</option>
        <option value="address">Address</option>
        <option value="contacts">Contacts</option>
        <option value="bank">Bank Details</option>
        <option value="terms">Terms</option>
        {supplier.subcontractor?.isSubcontractor && (
          <option value="subcontractor">Subcontractor</option>
        )}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md text-white bg-red-600 hover:bg-red-700 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                      <Save size={14} className="mr-1" />
                      <span className="hidden sm:inline">Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Supplier</h1>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : supplier.status === 'Inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {supplier.status}
                      </span>
                      {supplier.gstNo && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          GST: {supplier.gstNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile tab selector */}
              <MobileTabSelector />

              {/* Desktop tabs */}
              <div className="hidden sm:block border-b border-gray-200">
                <nav className="flex -mb-px overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'basic'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Basic Information
                  </button>
                  <button
                    onClick={() => setActiveTab('address')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'address'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Address
                  </button>
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'contacts'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Contacts
                  </button>
                  <button
                    onClick={() => setActiveTab('bank')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'bank'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Bank Details
                  </button>
                  <button
                    onClick={() => setActiveTab('terms')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'terms'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Terms
                  </button>
                  {supplier.subcontractor?.isSubcontractor && (
                    <button
                      onClick={() => setActiveTab('subcontractor')}
                      className={`whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm ${activeTab === 'subcontractor'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      Subcontractor
                    </button>
                  )}
                </nav>
              </div>

              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information Tab */}
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div>
                        <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <Building className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                          Company Information
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                              Supplier Name*
                            </label>
                            <div className="col-span-2 sm:col-span-3">
                              <input
                                type="text"
                                name="supplierName"
                                value={supplier.supplierName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                              Status*
                            </label>
                            <div className="col-span-2 sm:col-span-3">
                              <select
                                name="status"
                                value={supplier.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                required
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                              GST Number
                            </label>
                            <div className="col-span-2 sm:col-span-3">
                              <input
                                type="text"
                                name="gstNo"
                                value={supplier.gstNo || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                              Currency*
                            </label>
                            <div className="col-span-2 sm:col-span-3">
                              <select
                                name="analysis.currencyCode"
                                value={supplier.analysis?.currencyCode || 'INR'}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                required
                              >
                                <option value="INR">INR (Indian Rupee)</option>
                                <option value="USD">USD (US Dollar)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="GBP">GBP (British Pound)</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                              GST Exempt
                            </label>
                            <div className="col-span-2 sm:col-span-3 flex items-center">
                              <input
                                type="checkbox"
                                name="analysis.gstExempt"
                                checked={supplier.analysis?.gstExempt || false}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-xs sm:text-sm">
                                {supplier.analysis?.gstExempt ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Tab */}
                  {activeTab === 'address' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <MapPin className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                          Registered Address
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                          {[
                            {
                              label: 'Address Line 1*',
                              name: 'registeredAddress.address_line_1',
                              value: supplier.registeredAddress?.address_line_1 || ''
                            },
                            {
                              label: 'Address Line 2',
                              name: 'registeredAddress.address_line_2',
                              value: supplier.registeredAddress?.address_line_2 || ''
                            },
                            {
                              label: 'Address Line 3',
                              name: 'registeredAddress.address_line_3',
                              value: supplier.registeredAddress?.address_line_3 || ''
                            },
                            {
                              label: 'City*',
                              name: 'registeredAddress.city',
                              value: supplier.registeredAddress?.city || ''
                            },
                            {
                              label: 'State*',
                              name: 'registeredAddress.state',
                              value: supplier.registeredAddress?.state || ''
                            },
                            {
                              label: 'Post Code*',
                              name: 'registeredAddress.postCode',
                              value: supplier.registeredAddress?.postCode || ''
                            },
                            {
                              label: 'Country*',
                              name: 'registeredAddress.country',
                              value: supplier.registeredAddress?.country || ''
                            }
                          ].map((item, index) => (
                            <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                                {item.label}
                              </label>
                              <div className="col-span-2 sm:col-span-3">
                                <input
                                  type="text"
                                  name={item.name}
                                  value={item.value}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                  required={item.label.includes('*')}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <MapPin className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                          Communication Address
                        </h3>
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id="sameAsRegistered"
                            name="sameAsRegistered"
                            checked={supplier.sameAsRegistered || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="sameAsRegistered" className="ml-2 text-xs sm:text-sm text-gray-700">
                            Same as registered address
                          </label>
                        </div>
                        {supplier.sameAsRegistered ? (
                          <p className="text-xs sm:text-sm text-gray-500">
                            Same as registered address
                          </p>
                        ) : (
                          <div className="space-y-2 sm:space-y-3">
                            {[
                              {
                                label: 'Address Line 1*',
                                name: 'communicationAddress.address_line_1',
                                value: supplier.communicationAddress?.address_line_1 || ''
                              },
                              {
                                label: 'Address Line 2',
                                name: 'communicationAddress.address_line_2',
                                value: supplier.communicationAddress?.address_line_2 || ''
                              },
                              {
                                label: 'Address Line 3',
                                name: 'communicationAddress.address_line_3',
                                value: supplier.communicationAddress?.address_line_3 || ''
                              },
                              {
                                label: 'City*',
                                name: 'communicationAddress.city',
                                value: supplier.communicationAddress?.city || ''
                              },
                              {
                                label: 'State*',
                                name: 'communicationAddress.state',
                                value: supplier.communicationAddress?.state || ''
                              },
                              {
                                label: 'Post Code*',
                                name: 'communicationAddress.postCode',
                                value: supplier.communicationAddress?.postCode || ''
                              },
                              {
                                label: 'Country*',
                                name: 'communicationAddress.country',
                                value: supplier.communicationAddress?.country || ''
                              }
                            ].map((item, index) => (
                              <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                <label className="text-xs sm:text-sm text-gray-500 col-span-1">
                                  {item.label}
                                </label>
                                <div className="col-span-2 sm:col-span-3">
                                  <input
                                    type="text"
                                    name={item.name}
                                    value={item.value}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                    required={item.label.includes('*') && !supplier.sameAsRegistered}
                                    disabled={supplier.sameAsRegistered}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contacts Tab */}
                  {activeTab === 'contacts' && (
                    <div>
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
                        <Phone className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        Contact Persons
                      </h3>
                      <div className="space-y-3 sm:space-y-6">
                        {supplier.contacts?.map((contact, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm sm:text-base font-medium">Contact {index + 1}</h4>
                              {supplier.contacts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeContact(index)}
                                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center"
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Title</label>
                                <select
                                  name="title"
                                  value={contact.title || ''}
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
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Contact Person*</label>
                                <input
                                  type="text"
                                  name="contact_person"
                                  value={contact.contact_person || ''}
                                  onChange={(e) => handleContactChange(index, e)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Position</label>
                                <input
                                  type="text"
                                  name="position"
                                  value={contact.position || ''}
                                  onChange={(e) => handleContactChange(index, e)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Email*</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={contact.email || ''}
                                  onChange={(e) => handleContactChange(index, e)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Telephone</label>
                                <input
                                  type="tel"
                                  name="telephoneNo"
                                  value={contact.telephoneNo || ''}
                                  onChange={(e) => handleContactChange(index, e)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">Mobile*</label>
                                <input
                                  type="tel"
                                  name="mobileNo"
                                  value={contact.mobileNo || ''}
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
                          className="flex items-center text-red-600 hover:text-red-800 text-xs sm:text-sm"
                        >
                          <Plus size={14} className="mr-1" />
                          Add Another Contact
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Tab */}
                  {activeTab === 'bank' && (
                    <div>
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
                        <CreditCard className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        Bank Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Bank Name*</label>
                          <input
                            type="text"
                            name="bankDetails.bankName"
                            value={supplier.bankDetails?.bankName || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Bank Address</label>
                          <input
                            type="text"
                            name="bankDetails.bankAddress"
                            value={supplier.bankDetails?.bankAddress || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Account Number*</label>
                          <input
                            type="text"
                            name="bankDetails.accountNumber"
                            value={supplier.bankDetails?.accountNumber || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">IFSC Code*</label>
                          <input
                            type="text"
                            name="bankDetails.ifsc"
                            value={supplier.bankDetails?.ifsc || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms Tab */}
                  {activeTab === 'terms' && (
                    <div>
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
                        <FileText className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        Terms & Conditions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Credit Limit (₹)</label>
                          <input
                            type="number"
                            name="terms.creditLimit"
                            value={supplier.terms?.creditLimit || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Trade Discount (%)</label>
                          <input
                            type="number"
                            name="terms.tradeDiscount"
                            value={supplier.terms?.tradeDiscount || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Settlement Discount (%)</label>
                          <input
                            type="number"
                            name="terms.settlementDiscount"
                            value={supplier.terms?.settlementDiscount || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Settlement Days</label>
                          <input
                            type="number"
                            name="terms.settlementDays"
                            value={supplier.terms?.settlementDays || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Min Order Value (₹)</label>
                          <input
                            type="number"
                            name="terms.minOrderValue"
                            value={supplier.terms?.minOrderValue || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-500 mb-1">Default PO Submission Method</label>
                          <select
                            name="terms.defaultPurchaseOrderSubmissionMethod"
                            value={supplier.terms?.defaultPurchaseOrderSubmissionMethod || 'Email'}
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
                  )}

                  {/* Subcontractor Tab */}
                  {activeTab === 'subcontractor' && (
                    <div>
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
                        <Shield className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        Subcontractor Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isSubcontractor"
                            name="subcontractor.isSubcontractor"
                            checked={supplier.subcontractor?.isSubcontractor || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isSubcontractor" className="ml-2 text-xs sm:text-sm text-gray-700">
                            Supplier Is A Sub-contractor?
                          </label>
                        </div>
                      </div>

                      {supplier.subcontractor?.isSubcontractor && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hasInsuranceDocuments"
                                name="subcontractor.hasInsuranceDocuments"
                                checked={supplier.subcontractor?.hasInsuranceDocuments || false}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <label htmlFor="hasInsuranceDocuments" className="ml-2 text-xs sm:text-sm text-gray-700">
                                In Possession Of Insurance Documents?
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hasHealthSafetyPolicy"
                                name="subcontractor.hasHealthSafetyPolicy"
                                checked={supplier.subcontractor?.hasHealthSafetyPolicy || false}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <label htmlFor="hasHealthSafetyPolicy" className="ml-2 text-xs sm:text-sm text-gray-700">
                                In Possession Of Health And Safety Policy?
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                            {supplier.subcontractor?.hasInsuranceDocuments && (
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">
                                  Insurance Expiration Date*
                                </label>
                                <input
                                  type="date"
                                  name="subcontractor.insuranceExpirationDate"
                                  value={supplier.subcontractor?.insuranceExpirationDate || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                  required={supplier.subcontractor?.hasInsuranceDocuments}
                                />
                              </div>
                            )}
                            {supplier.subcontractor?.hasHealthSafetyPolicy && (
                              <div>
                                <label className="block text-xs sm:text-sm text-gray-500 mb-1">
                                  Health And Safety Policy Expiration Date*
                                </label>
                                <input
                                  type="date"
                                  name="subcontractor.healthSafetyPolicyExpirationDate"
                                  value={formatDate(supplier.subcontractor?.healthSafetyPolicyExpirationDate) || ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                  required={supplier.subcontractor?.hasHealthSafetyPolicy}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditSupplier;