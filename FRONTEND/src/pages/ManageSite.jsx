import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, MapPin, Home, User, Phone, Edit, Trash2, Eye, Plus, ChevronDown, ChevronUp, Settings, Settings2Icon } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";
import { Upload } from 'lucide-react';

const ManageSites = () => {
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
    const [sites, setSites] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [filteredSites, setFilteredSites] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedSite, setExpandedSite] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    // Fetch sites and companies from API
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch sites
            const sitesResponse = await fetch(`${import.meta.env.VITE_API_URL}/sites`);
            if (!sitesResponse.ok) {
                throw new Error('Failed to fetch sites');
            }
            const sitesData = await sitesResponse.json();
            setSites(sitesData);
            setFilteredSites(sitesData);

            // Fetch companies
            const companiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/company`);
            if (!companiesResponse.ok) {
                throw new Error('Failed to fetch companies');
            }
            const companiesData = await companiesResponse.json();
            setCompanies(companiesData);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...sites];
        if (selectedCompany) {
            filtered = filtered.filter(site =>
                site.customer_id.company_id === selectedCompany
            );
        }

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(site =>
                (site._id && site._id.toLowerCase().includes(term)) ||
                (site.site_name && site.site_name.toLowerCase().includes(term)) ||
                (site.property_ref_no && site.property_ref_no.toLowerCase().includes(term)) ||
                (site.contact_name && site.contact_name.toLowerCase().includes(term)) ||
                (site.mobile && site.mobile.includes(term)) ||
                (site.city && site.city.toLowerCase().includes(term)) ||
                (site.state && site.state.toLowerCase().includes(term))
            );
        }

        setFilteredSites(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedCompany, sites]);

    const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
    const paginatedSites = filteredSites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const toggleSiteExpand = (siteId) => {
        setExpandedSite(expandedSite === siteId ? null : siteId);
    };

    const statusColors = {
        New: "bg-blue-100 text-blue-800",
        Live: "bg-green-100 text-green-800",
        Dead: "bg-red-100 text-red-800"
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // first sheet
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet); // Excel → JSON

                // Send to backend
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/sites/import`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(parsedData),
                    }
                );

                if (response.ok) {
                    console.log("Sites uploaded successfully!");
                    fetchData();
                } else {
                    const errorData = await response.json();
                    console.error("Failed to upload users:", errorData);
                }
            } catch (err) {
                console.error("Error processing file:", err);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            {/* Page Header */}
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Sites</h1>
                                <p className="text-xs sm:text-sm text-gray-500">View and manage sites for this customer</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="block w-full sm:w-48 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company._id} value={company._id}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>
                                <Link
                                    to={`/add-site`}
                                    className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <Plus size={14} className="mr-1 sm:mr-2" />
                                    <span className="sm:inline">Add New Site</span>
                                </Link>
                                <div className="flex items-center space-x-3 bg-white shadow-sm border rounded-lg px-4 py-2 w-fit">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                    <label
                                        htmlFor="fileInput"
                                        className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        Upload Excel File
                                    </label>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Site ID, Name, Property Ref, Contact, Mobile, City, State..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="text-center text-red-600 mb-4">{error}</div>
                        )}

                        {!loading && !error && (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                                    {filteredSites.length === 0 ? (
                                        <p className="p-6 text-center text-gray-500">No sites found.</p>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premises Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedSites.map(site => (
                                                    <tr key={site._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.site_code}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.site_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {site.customer_id.customer_name || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.premises_type}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div className="flex items-center">
                                                                <User className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.contact_name}
                                                            </div>
                                                            <div className="flex items-center mt-1">
                                                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.contact_no}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div className="flex items-center">
                                                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.city}, {site.state}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[site.status]}`}>
                                                                {site.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end space-x-2">
                                                                <Link
                                                                    to={`/site/${site._id}/system?status=${site.status}`}
                                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                                    title="System"
                                                                >
                                                                    <Settings2Icon className="h-4 w-4" />
                                                                </Link>
                                                                <Link
                                                                    to={`/view-site/${site._id}`}
                                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                                    title="View"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                                <Link
                                                                    to={`/update-site/${site._id}`}
                                                                    className="text-green-600 hover:text-green-900 p-1"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-4">
                                    {paginatedSites.map(site => (
                                        <div key={site._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                            <button
                                                onClick={() => toggleSiteExpand(site._id)}
                                                className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center">
                                                    <Home className="text-red-600 mr-3" size={18} />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">{site.site_name}</h3>
                                                        <p className="text-xs text-gray-500">{site.site_code}</p>
                                                    </div>
                                                </div>
                                                {expandedSite === site._id ? (
                                                    <ChevronUp className="text-gray-500" size={18} />
                                                ) : (
                                                    <ChevronDown className="text-gray-500" size={18} />
                                                )}
                                            </button>
                                            <div className={`transition-all duration-300 overflow-hidden ${expandedSite === site._id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="p-4 border-t border-gray-200">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Customer</p>
                                                            <p className="font-medium">{site.customer_id?.customer_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Property Ref</p>
                                                            <p className="font-medium">{site.property_ref_no}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Status</p>
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[site.status]}`}>
                                                                {site.status}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Contact</p>
                                                            <p className="font-medium flex items-center">
                                                                <User className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.contact_name}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Mobile</p>
                                                            <p className="font-medium flex items-center">
                                                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.contact_no}
                                                            </p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-gray-500">Location</p>
                                                            <p className="font-medium flex items-center">
                                                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                                {site.city}, {site.state}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Route</p>
                                                            <p className="font-medium">{site.route}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Distance</p>
                                                            <p className="font-medium">{site.distance} km</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Area</p>
                                                            <p className="font-medium">{site.area} sq ft</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Sales Person</p>
                                                            <p className="font-medium">{site.sales_person}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end space-x-2">
                                                        <Link
                                                            to={`/site/${site._id}/system?status=${site.status}`}
                                                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                        >
                                                            <Settings2Icon className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                            System
                                                        </Link>
                                                        <Link
                                                            to={`/view-site/${site._id}`}
                                                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                        >
                                                            <Eye className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                            View
                                                        </Link>
                                                        <Link
                                                            to={`/update-site/${site._id}`}
                                                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                                                        >
                                                            <Edit className="-ml-0.5 mr-1.5 h-3 w-3" />
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Empty State */}
                                {filteredSites.length === 0 && !loading && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                        <p className="text-gray-500">No sites found matching your search criteria.</p>
                                        <Link
                                            to={`/add-site`}
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                                            Add New Site
                                        </Link>
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredSites.length > itemsPerPage && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                        <div className="text-sm text-gray-500">
                                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSites.length)}</span> of{' '}
                                            <span className="font-medium">{filteredSites.length}</span> sites
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageSites;