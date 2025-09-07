import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";

const SiteSystems = () => {

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
            if (!hasPermission("Manage Site")) {
                return navigate("/UserUnAuthorized/Manage Site");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);


    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [systemData, setSystemData] = useState(null);
    const [technicians, setTechnicians] = useState([]);
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
        frequency: '',
        installed_by: ''
    });
    const [errors, setErrors] = useState({});

    const { siteId, systemId } = useParams();

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
                const [siteData, techData] = await Promise.all([
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/sites/${siteId}`),
                    fetchWithErrorHandling(`${import.meta.env.VITE_API_URL}/api/user`)
                ]);

                // Find the specific system in site_systems
                const system = siteData.site_systems.find(sys => sys._id === systemId);
                if (!system) {
                    throw new Error('System not found');
                }

                setSystemData(system);

                // Set form data
                setFormData({
                    status: system.status || 'New',
                    date_of_sale: system.date_of_sale ? system.date_of_sale.split('T')[0] : '',
                    date_of_install: system.date_of_install ? system.date_of_install.split('T')[0] : '',
                    takeover_date: system.takeover_date ? system.takeover_date.split('T')[0] : '',
                    rented: system.rented || false,
                    econtract_expiry_date: system.econtract_expiry_date ? system.econtract_expiry_date.split('T')[0] : '',
                    warranty_date: system.warranty_date ? system.warranty_date.split('T')[0] : '',
                    amc_start_date: system.amc_start_date ? system.amc_start_date.split('T')[0] : '',
                    amc_end_date: system.amc_end_date ? system.amc_end_date.split('T')[0] : '',
                    frequency: system.frequency || '',
                    installed_by: system.installed_by?._id || ''
                });

                // Filter engineers
                const engineers = (techData.users || []).filter(
                    user => user.accesstype_id?.name === "Engineer"
                );
                setTechnicians(engineers);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error(error.message || 'Failed to load system data');
                setLoading(false);
                navigate(`/site/${siteId}/system`);
            }
        };

        fetchData();
    }, [siteId, systemId, navigate]);

    const validateForm = () => {
        const newErrors = {};

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Prepare payload with only filled fields
            const payload = {
                ...formData
            };

            // Remove empty strings from payload
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== '' && v !== null)
            );

            await fetchWithErrorHandling(
                `${import.meta.env.VITE_API_URL}/api/systems/${siteId}/systems/${systemId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(cleanPayload)
                }
            );

            toast.success('System updated successfully');
            navigate(`/site/${siteId}/system`);

        } catch (error) {
            console.error('Error updating system:', error);
            toast.error(error.message || 'Failed to update system');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to remove this system from the site?')) {
            try {
                await fetchWithErrorHandling(
                    `${import.meta.env.VITE_API_URL}/api/sites/${siteId}/systems/${systemId}`,
                    { method: 'DELETE' }
                );

                toast.success('System removed successfully');
                navigate(`/site/${siteId}/system`);

            } catch (error) {
                console.error('Error removing system:', error);
                toast.error(error.message || 'Failed to remove system');
            }
        }
    };

    if (loading || !systemData) {
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-4 lg:pl-80 transition-all duration-300">
                    <div className="max-w-4xl mx-auto">
                        {/* Header Section */}
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <button
                                    onClick={() => navigate(`/site/${siteId}/system`)}
                                    className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
                                >
                                    <ArrowLeft size={18} className="mr-1" />
                                    Back to Systems
                                </button>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Edit {systemData.system_id.systemName} System
                                </h1>
                                <p className="text-gray-600 mt-2">Update system details and configuration</p>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                                <Trash2 size={18} className="mr-2" />
                                Remove System
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            System Code
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                            value={systemData.system_id.systemCode}
                                            readOnly
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            System Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                            value={systemData.system_id.systemName}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                {/* AMC Fields - Only shown when status is Live */}
                                {formData.status === 'Live' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    AMC Start Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    name="amc_start_date"
                                                    className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                                        Installed By
                                    </label>
                                    <select
                                        name="installed_by"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.installed_by}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Select Technician --</option>
                                        {technicians.map(tech => (
                                            <option key={tech._id} value={tech._id}>
                                                {tech.firstname} {tech.lastname}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/site/${siteId}/system`)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Save size={18} className="mr-2" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SiteSystems;