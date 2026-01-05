import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit, Printer, Download, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";

const ViewJobCosting = () => {
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
            if (!hasPermission("Manage Job Costing")) {
                return navigate("/UserUnAuthorized/Manage Job Costing");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { id } = useParams();
    const [jobCosting, setJobCosting] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch job costing details
    useEffect(() => {
        const fetchJobCosting = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/job-costing/${id}`, {
                });
                if (!response.ok) throw new Error('Failed to fetch job costing');
                const data = await response.json();
                setJobCosting(data);
            } catch (error) {
                toast.error(error.message || 'Failed to load job costing');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobCosting();
    }, [id]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex flex-1">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 transition-all duration-300">
                        <div className="max-w-7xl mx-auto">
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading job costing details...</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!jobCosting) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex flex-1">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 transition-all duration-300">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <h2 className="text-xl font-medium text-gray-800 mb-2">Job Costing Not Found</h2>
                                <p className="text-gray-600 mb-6">The requested job costing could not be found.</p>
                                <button
                                    onClick={() => navigate('/manage-job-costing')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center mx-auto"
                                >
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                    Back to Job Costings
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 transition-all duration-300">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                            <div>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                                >
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                    <span>Back</span>
                                </button>
                                <h1 className="text-2xl font-bold text-gray-800">Job Costing Details</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {jobCosting.customer_id?.customer_name || 'N/A'} - {jobCosting.site_id?.site_name || 'N/A'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/edit-job-costing/${id}`)}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Edit className="h-5 w-5 mr-2" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Basic Information */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
                                        <p className="text-sm font-medium text-gray-900">
                                            {jobCosting.customer_id.customer_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Site</label>
                                        <p className="text-sm font-medium text-gray-900">
                                            {jobCosting.site_id.site_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Quotation</label>
                                        <p className="text-sm font-medium text-gray-900">
                                            {jobCosting.quotation_id.quotation_id || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Products List */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Cost</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Cost</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {jobCosting.product_list?.length > 0 ? (
                                                jobCosting.product_list.map((product, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{product.description}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Unit: {formatCurrency(product.material_unit_price)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {product.quantity}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {formatCurrency(product.material_total_price)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {formatCurrency(product.installation_total_price)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {formatCurrency(product.purchase_total_price)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                        No products found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="2" className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total</td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.total_material_cost)}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.total_installation_cost)}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.total_purchase_cost)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Cost Summary */}
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Cost Summary</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Expenses */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-md font-medium text-gray-700 mb-3">Expenses</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Purchase Cost:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.purchase_cost)}
                                                </span>
                                            </div>
                                            {Object.entries(jobCosting.misc_expenses || {}).map(([key, value]) => (
                                                value > 0 && (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-sm text-gray-600">
                                                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatCurrency(value)}
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Total Expenses:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.total_cost)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Summary */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-md font-medium text-gray-700 mb-3">Project Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Project Cost:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.project_cost)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Total Cost:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(jobCosting.total_cost)}
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                                <span className="text-sm font-medium text-gray-700">Margin:</span>
                                                <span className={`text-sm font-medium ${jobCosting.margin >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(jobCosting.margin)} ({jobCosting.margin_percent?.toFixed(2)}%)
                                                </span>
                                            </div>
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

export default ViewJobCosting;