import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Edit3Icon, Trash2Icon } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";

const SiteSystem = () => {
    const { user } = useContext(AuthContext);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Get status from query string
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get('status');
        if (statusParam) {
            setStatus(statusParam);
        }
    }, []);

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
            if (!hasPermission("Manage Site")) {
                return navigate("/UserUnAuthorize/Manage Sited");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [systems, setSystems] = useState([]);
    const [availableSystems, setAvailableSystems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSystem, setSelectedSystem] = useState('');
    const [technician, setTechnician] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [siteName, setSiteName] = useState('');
    const [formData, setFormData] = useState({
        status: 'New',
        date_of_sale: '',
        date_of_install: '',
        takeover_date: '',
        rented: false,
        econtract_expiry_date: '',
        warranty_date: '',
        amc_start_date: '',
        amc_end_date: '',
        frequency: ''
    });
    const [errors, setErrors] = useState({});

    const { siteId } = useParams();

    const fetchWithErrorHandling = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch site details
                const [siteData, systemsData, techData] = await Promise.all([
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/sites/${siteId}`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/systems`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/user`)
                ]);

                setSiteName(siteData.site_name);
                setSystems(siteData.site_systems || []);

                // Filter available systems
                const assignedSystemIds = siteData.site_systems.map(sys => sys.system_id._id);
                const filteredSystems = systemsData.systems.filter(
                    system => !assignedSystemIds.includes(system._id)
                );
                setAvailableSystems(filteredSystems);

                // Filter engineers
                const engineers = (techData.users || []).filter(
                    user => user.accesstype_id?.name === "Engineer"
                );
                setTechnicians(engineers);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'Failed to load systems data');
                setLoading(false);
            }
        };

        fetchData();
    }, [siteId]);

    const validateForm = () => {
        const newErrors = {};

        if (!selectedSystem) {
            newErrors.system = 'Please select a system';
        }

        if (formData.rented && !formData.econtract_expiry_date) {
            newErrors.econtract_expiry_date = 'E-Contract expiry date is required for rented systems';
        }

        if (formData.date_of_sale && formData.date_of_install && new Date(formData.date_of_sale) > new Date(formData.date_of_install)) {
            newErrors.date_of_install = 'Install date cannot be before sale date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Clear AMC fields if status changes from Live
        if (name === 'status' && value !== 'Live') {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
                amc_start_date: '',
                amc_end_date: '',
                frequency: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when field is changed
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    const handleSystemSelect = (e) => {
        setSelectedSystem(e.target.value);
        if (errors.system) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.system;
                return newErrors;
            });
        }
    };

    const handleTechnicianSelect = (e) => {
        setTechnician(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Prepare payload with only filled fields
            const payload = {
                system_id: selectedSystem,
                ...(technician && { installed_by: technician }),
                ...formData
            };

            // Remove empty strings from payload
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== '' && v !== null)
            );

            await fetchWithErrorHandling(
                `${import.meta.env.VITE_API_URL}/api/systems/${siteId}`,
                {
                    method: 'POST',
                    body: JSON.stringify(cleanPayload)
                }
            );

            toast.success('System added successfully');

            // Refresh data
            const [siteData, systemsData] = await Promise.all([
                fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/sites/${siteId}`),
                fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/systems`)
            ]);

            setSystems(siteData.site_systems || []);
            setSiteName(siteData.site_name);

            // Update available systems
            const assignedSystemIds = siteData.site_systems.map(sys => sys.system_id._id);
            const filteredSystems = systemsData.systems.filter(
                system => !assignedSystemIds.includes(system._id)
            );
            setAvailableSystems(filteredSystems);

            // Reset form
            setSelectedSystem('');
            setTechnician('');
            setFormData({
                status: 'New',
                date_of_sale: '',
                date_of_install: '',
                takeover_date: '',
                rented: false,
                econtract_expiry_date: '',
                warranty_date: '',
                amc_start_date: '',
                amc_end_date: '',
                frequency: ''
            });

        } catch (error) {
            console.error('Error adding system:', error);
            toast.error(error.message || 'Failed to add system');
        }
    };

    const handleRemoveSystem = async (systemId) => {
        if (window.confirm('Are you sure you want to remove this system from the site?')) {
            try {
                await fetchWithErrorHandling(
                    `${import.meta.env.VITE_API_URL}/api/systems/${siteId}/${systemId}`,
                    { method: 'DELETE' }
                );

                toast.success('System removed successfully');

                // Refresh data
                const [siteData, systemsData] = await Promise.all([
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/sites/${siteId}`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/systems`)
                ]);

                setSystems(siteData.site_systems || []);

                // Update available systems
                const assignedSystemIds = siteData.site_systems.map(sys => sys.system_id._id);
                const filteredSystems = systemsData.systems.filter(
                    system => !assignedSystemIds.includes(system._id)
                );
                setAvailableSystems(filteredSystems);

            } catch (error) {
                console.error('Error removing system:', error);
                toast.error(error.message || 'Failed to remove system');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-4 lg:pl-80">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (status != "Live") {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-4 lg:pl-80">
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="text-2xl font-semibold text-gray-700 mb-2">
                                Site should be <span className="text-blue-600 font-bold">Live</span>
                            </div>
                            <div className="text-gray-500">
                                You can only manage systems for sites that are in <span className="font-medium">Live</span> status.
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-4 lg:pl-80 transition-all duration-300">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Systems for {siteName}</h1>
                            <p className="text-gray-600 mt-2">Add and manage systems assigned to this site</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Add System Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New System</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select System *
                                            </label>
                                            <select
                                                className={`w-full p-2.5 border ${errors.system ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                value={selectedSystem}
                                                onChange={handleSystemSelect}
                                                required
                                            >
                                                <option value="">-- Select a system --</option>
                                                {availableSystems.map(system => (
                                                    <option key={system._id} value={system._id}>
                                                        {system.systemName} ({system.systemCode})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.system && <p className="mt-1 text-sm text-red-600">{errors.system}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Status *
                                                </label>
                                                <select
                                                    name="status"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Live">Live</option>
                                                    <option value="Dead">Dead</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Date of Sale
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date_of_sale"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={formData.date_of_sale}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Date of Install
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date_of_install"
                                                    className={`w-full p-2.5 border ${errors.date_of_install ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={formData.date_of_install}
                                                    onChange={handleInputChange}
                                                />
                                                {errors.date_of_install && <p className="mt-1 text-sm text-red-600">{errors.date_of_install}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Takeover Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="takeover_date"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={formData.takeover_date}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="rented"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={formData.rented}
                                                onChange={handleInputChange}
                                            />
                                            <label className="ml-2 block text-sm text-gray-700">
                                                Rented System
                                            </label>
                                        </div>

                                        {formData.rented && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    E-Contract Expiry Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    name="econtract_expiry_date"
                                                    className={`w-full p-2.5 border ${errors.econtract_expiry_date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={formData.econtract_expiry_date}
                                                    onChange={handleInputChange}
                                                    required={formData.rented}
                                                />
                                                {errors.econtract_expiry_date && <p className="mt-1 text-sm text-red-600">{errors.econtract_expiry_date}</p>}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Warranty Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="warranty_date"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={formData.warranty_date}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        {formData.status === 'Live' && (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            AMC Start Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="amc_start_date"
                                                            className={`w-full p-2.5 borderborder-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                            value={formData.amc_start_date}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            AMC End Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="amc_end_date"
                                                            className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                            value={formData.amc_end_date}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        AMC Frequency *
                                                    </label>
                                                    <select
                                                        name="frequency"
                                                        className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                        value={formData.frequency}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="">-- Select Frequency --</option>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                        <option value="Half-Yearly">Half-Yearly</option>
                                                        <option value="Yearly">Yearly</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Assigned Technician
                                            </label>
                                            <select
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={technician}
                                                onChange={handleTechnicianSelect}
                                            >
                                                <option value="">-- Select Technician --</option>
                                                {technicians.map(tech => (
                                                    <option key={tech._id} value={tech._id}>
                                                        {tech.firstname} {tech.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            Add System
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Current Systems List */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">Current Systems</h2>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {systems.length} system(s)
                                        </span>
                                    </div>

                                    {systems.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No systems assigned</h3>
                                            <p className="mt-1 text-sm text-gray-500">Add a system to get started</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Code
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            System
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            AMC Status
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {systems.map((system) => {
                                                        const amcStatus = system.amc_end_date ?
                                                            (new Date(system.amc_end_date) > new Date() ? 'Active' : 'Expired') :
                                                            'N/A';

                                                        return (
                                                            <tr key={system._id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {system.system_id.systemCode}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {system.system_id.systemName}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                        ${system.status === 'New' ? 'bg-blue-100 text-blue-800' : ''}
                                                                        ${system.status === 'Live' ? 'bg-green-100 text-green-800' : ''}
                                                                        ${system.status === 'Dead' ? 'bg-red-100 text-red-800' : ''}
                                                                        ${system.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' : ''}`}>
                                                                        {system.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {system.status === 'Live' ? (
                                                                        <>
                                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${amcStatus === 'Active' ? 'bg-green-100 text-green-800' : ''}
                ${amcStatus === 'Expired' ? 'bg-red-100 text-red-800' : ''}
                ${amcStatus === 'N/A' ? 'bg-gray-100 text-gray-800' : ''}`}>
                                                                                {amcStatus}
                                                                            </span>
                                                                            {system.amc_end_date && (
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    {new Date(system.amc_end_date).toLocaleDateString()}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-gray-500">N/A</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right flex justify-evenly text-sm font-medium">
                                                                    <button
                                                                        onClick={() => navigate(`/site-systems/${siteId}/${system._id}`)}
                                                                        className="text-yellow-600 hover:text-yellow-900"
                                                                    >
                                                                        <Edit3Icon size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveSystem(system._id)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        <Trash2Icon size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SiteSystem;