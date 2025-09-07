import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
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
  ChevronUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const ViewSupplier = () => {
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
      if (!hasPermission("Manage Supplier")) {
        return navigate("/UserUnAuthorized/Manage Supplier");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
          `${import.meta.env.VITE_API_URL}/api/supplier/${id}`,
        );
        const data = await response.json();
        setSupplier(data.data);
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

  const printSupplierDetails = () => {
    window.print();
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
                  onClick={() => navigate('/search-supplier')}
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
                onClick={() => navigate('/search-supplier')}
                className="flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back to Suppliers
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{supplier.supplierName}</h1>
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
                  <div className="mt-3 sm:mt-0">
                    <NavLink
                      to={`/edit-supplier/${supplier._id}`}
                      className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Edit Supplier
                    </NavLink>
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
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <Building className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        Company Information
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {[
                          { label: 'Supplier Name', value: supplier.supplierName },
                          { label: 'Status', value: supplier.status },
                          { label: 'GST Number', value: supplier.gstNo || '-' },
                          {
                            label: 'Currency',
                            value: supplier.analysis?.currencyCode || 'INR'
                          },
                          {
                            label: 'GST Exempt',
                            value: supplier.analysis?.gstExempt ? 'Yes' : 'No',
                            icon: supplier.analysis?.gstExempt ? (
                              <Check className="mr-1 text-green-600" size={14} />
                            ) : (
                              <X className="mr-1 text-gray-500" size={14} />
                            )
                          }
                        ].map((item, index) => (
                          <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <p className="text-xs sm:text-sm text-gray-500 col-span-1">
                              {item.label}
                            </p>
                            <p className="text-xs sm:text-sm font-medium col-span-2 sm:col-span-3 flex items-center">
                              {item.icon}{item.value}
                            </p>
                          </div>
                        ))}
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
                          { label: 'Address Line 1', value: supplier.registeredAddress?.address_line_1 || '-' },
                          { label: 'Address Line 2', value: supplier.registeredAddress?.address_line_2, hide: !supplier.registeredAddress?.address_line_2 },
                          { label: 'Address Line 3', value: supplier.registeredAddress?.address_line_3, hide: !supplier.registeredAddress?.address_line_3 },
                          { label: 'City', value: supplier.registeredAddress?.city || '-' },
                          { label: 'State', value: supplier.registeredAddress?.state || '-' },
                          { label: 'Post Code', value: supplier.registeredAddress?.postCode || '-' },
                          { label: 'Country', value: supplier.registeredAddress?.country || '-' }
                        ].filter(item => !item.hide).map((item, index) => (
                          <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            <p className="text-xs sm:text-sm text-gray-500 col-span-1">
                              {item.label}
                            </p>
                            <p className="text-xs sm:text-sm font-medium col-span-2 sm:col-span-3">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <MapPin className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                        {supplier.sameAsRegistered
                          ? 'Communication Address (Same as Registered)'
                          : 'Communication Address'}
                      </h3>
                      {supplier.sameAsRegistered ? (
                        <p className="text-xs sm:text-sm text-gray-500">
                          Same as registered address
                        </p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {[
                            { label: 'Address Line 1', value: supplier.communicationAddress?.address_line_1 || '-' },
                            { label: 'Address Line 2', value: supplier.communicationAddress?.address_line_2, hide: !supplier.communicationAddress?.address_line_2 },
                            { label: 'Address Line 3', value: supplier.communicationAddress?.address_line_3, hide: !supplier.communicationAddress?.address_line_3 },
                            { label: 'City', value: supplier.communicationAddress?.city || '-' },
                            { label: 'State', value: supplier.communicationAddress?.state || '-' },
                            { label: 'Post Code', value: supplier.communicationAddress?.postCode || '-' },
                            { label: 'Country', value: supplier.communicationAddress?.country || '-' }
                          ].filter(item => !item.hide).map((item, index) => (
                            <div key={index} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              <p className="text-xs sm:text-sm text-gray-500 col-span-1">
                                {item.label}
                              </p>
                              <p className="text-xs sm:text-sm font-medium col-span-2 sm:col-span-3">
                                {item.value}
                              </p>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {[
                              {
                                label: 'Contact Person',
                                value: `${contact.title ? contact.title + ' ' : ''}${contact.contact_person || '-'}`
                              },
                              { label: 'Position', value: contact.position || '-' },
                              {
                                label: 'Email',
                                value: contact.email || '-',
                                icon: <Mail className="mr-1 text-gray-400" size={14} />
                              },
                              {
                                label: 'Telephone',
                                value: contact.telephoneNo || '-',
                                icon: <Phone className="mr-1 text-gray-400" size={14} />
                              },
                              {
                                label: 'Mobile',
                                value: contact.mobileNo || '-',
                                icon: <Phone className="mr-1 text-gray-400" size={14} />
                              }
                            ].map((item, idx) => (
                              <div key={idx}>
                                <p className="text-xs sm:text-sm text-gray-500">{item.label}</p>
                                <p className="text-xs sm:text-sm font-medium flex items-center">
                                  {item.icon}{item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
                      {[
                        { label: 'Bank Name', value: supplier.bankDetails?.bankName || '-' },
                        { label: 'Bank Address', value: supplier.bankDetails?.bankAddress || '-' },
                        { label: 'Account Number', value: supplier.bankDetails?.accountNumber || '-' },
                        { label: 'IFSC Code', value: supplier.bankDetails?.ifsc || '-' }
                      ].map((item, index) => (
                        <div key={index}>
                          <p className="text-xs sm:text-sm text-gray-500">{item.label}</p>
                          <p className="text-xs sm:text-sm font-medium">{item.value}</p>
                        </div>
                      ))}
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
                      {[
                        {
                          label: 'Credit Limit (₹)',
                          value: supplier.terms?.creditLimit ? `₹${supplier.terms.creditLimit.toLocaleString()}` : '-'
                        },
                        {
                          label: 'Trade Discount (%)',
                          value: supplier.terms?.tradeDiscount || '-'
                        },
                        {
                          label: 'Settlement Discount (%)',
                          value: supplier.terms?.settlementDiscount || '-'
                        },
                        {
                          label: 'Settlement Days',
                          value: supplier.terms?.settlementDays || '-'
                        },
                        {
                          label: 'Min Order Value (₹)',
                          value: supplier.terms?.minOrderValue ? `₹${supplier.terms.minOrderValue.toLocaleString()}` : '-'
                        },
                        {
                          label: 'Default PO Submission Method',
                          value: supplier.terms?.defaultPurchaseOrderSubmissionMethod || '-'
                        }
                      ].map((item, index) => (
                        <div key={index}>
                          <p className="text-xs sm:text-sm text-gray-500">{item.label}</p>
                          <p className="text-xs sm:text-sm font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subcontractor Tab */}
                {activeTab === 'subcontractor' && supplier.subcontractor?.isSubcontractor && (
                  <div>
                    <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6 flex items-center">
                      <Shield className="mr-2 text-gray-500" size={isMobile ? 16 : 18} />
                      Subcontractor Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {[
                        {
                          label: 'Has Insurance Documents',
                          value: supplier.subcontractor.hasInsuranceDocuments ? 'Yes' : 'No',
                          icon: supplier.subcontractor.hasInsuranceDocuments ? (
                            <Check className="mr-1 text-green-600" size={14} />
                          ) : (
                            <X className="mr-1 text-gray-500" size={14} />
                          )
                        },
                        ...(supplier.subcontractor.hasInsuranceDocuments ? [{
                          label: 'Insurance Expiration Date',
                          value: new Date(supplier.subcontractor.insuranceExpirationDate).toLocaleDateString()
                        }] : []),
                        {
                          label: 'Has Health & Safety Policy',
                          value: supplier.subcontractor.hasHealthSafetyPolicy ? 'Yes' : 'No',
                          icon: supplier.subcontractor.hasHealthSafetyPolicy ? (
                            <Check className="mr-1 text-green-600" size={14} />
                          ) : (
                            <X className="mr-1 text-gray-500" size={14} />
                          )
                        },
                        ...(supplier.subcontractor.hasHealthSafetyPolicy ? [{
                          label: 'Policy Expiration Date',
                          value: new Date(supplier.subcontractor.healthSafetyPolicyExpirationDate).toLocaleDateString()
                        }] : [])
                      ].map((item, index) => (
                        <div key={index}>
                          <p className="text-xs sm:text-sm text-gray-500">{item.label}</p>
                          <p className="text-xs sm:text-sm font-medium flex items-center">
                            {item.icon || null}{item.value}
                          </p>
                        </div>
                      ))}
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

export default ViewSupplier;