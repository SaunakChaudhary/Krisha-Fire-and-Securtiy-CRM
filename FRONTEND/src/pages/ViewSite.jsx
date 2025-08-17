import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Building, MapPin, Mail, ChevronDown, ChevronUp, Edit, Printer, Share2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ViewSite = () => {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [siteData, setSiteData] = useState(null);

    const [expandedSections, setExpandedSections] = useState({
        general: true,
        address: false,
        contact: false,
        additional: false
    });

    useEffect(() => {
        const fetchSiteData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sites/${siteId}`);
                const data = await response.json();
                
                if (response.ok) {
                    setSiteData(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch site data');
                }
            } catch (error) {
                toast.error(error.message);
                navigate('/sites'); // Redirect if error occurs
            } finally {
                setLoading(false);
            }
        };

        fetchSiteData();
    }, [siteId, navigate]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleEdit = () => {
        navigate(`/update-site/${siteId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="animate-pulse bg-white rounded-lg shadow-sm p-6">
                                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!siteData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                                <p className="text-red-500">Site not found</p>
                                <button 
                                    onClick={() => navigate('/sites')}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Back to Sites
                                </button>
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

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{siteData.site_name}</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Site Details</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Edit size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Edit Site</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                            </div>
                        </div>

                        {/* Site Details Sections */}
                        <div className="space-y-4">
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
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Site Code</label>
                                            <p className="text-sm sm:text-base font-medium text-gray-800">{siteData.site_code}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Site Name</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.site_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Status</label>
                                            <div className="flex items-center">
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                                    siteData.status === 'Live' ? 'bg-green-500' : 
                                                    siteData.status === 'Dead' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`}></span>
                                                <p className="text-sm sm:text-base text-gray-800 capitalize">{siteData.status}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Premises Type</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {siteData.premises_type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Route</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.route || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Distance</label>
                                            <p className="text-sm sm:text-base text-gray-800">
                                                {siteData.distance ? `${siteData.distance} km` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Area</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.area || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Sales Person</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.sales_person || '-'}</p>
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
                                    </div>
                                    {expandedSections.address ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.address ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 1</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.address_line_1}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 2</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.address_line_2 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 3</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.address_line_3 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Address Line 4</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.address_line_4 || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Postcode</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.postcode}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">City</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.city}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">State</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.state}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.country}</p>
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
                                    </div>
                                    {expandedSections.contact ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.contact ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Title</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.title || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.contact_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Contact Number</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.contact_no || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.contact_email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Position</label>
                                            <p className="text-sm sm:text-base text-gray-800">{siteData.position || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('additional')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <Building className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Additional Information
                                        </h2>
                                    </div>
                                    {expandedSections.additional ? (
                                        <ChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>
                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.additional ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Admin Remarks</label>
                                            <p className="text-sm sm:text-base text-gray-800 whitespace-pre-line">
                                                {siteData.admin_remarks || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Site Remarks</label>
                                            <p className="text-sm sm:text-base text-gray-800 whitespace-pre-line">
                                                {siteData.site_remarks || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewSite;