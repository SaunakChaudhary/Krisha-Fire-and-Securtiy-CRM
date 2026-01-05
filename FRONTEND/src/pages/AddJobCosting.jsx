import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";

const AddJobCosting = () => {
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
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [sites, setSites] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [products, setProducts] = useState([]);

    const [formData, setFormData] = useState({
        customer_id: '',
        site_id: '',
        quotation_id: '',
        product_list: [],
        misc_expenses: {
            expense_1: 0,
            expense_2: 0,
            expense_3: 0,
            expense_4: 0
        }
    });

    const [currentProduct, setCurrentProduct] = useState({
        product_id: '',
        description: '',
        quantity: 1,
        material_unit_price: 0,
        material_total_price: 0,
        installation_unit_price: 0,
        installation_total_price: 0,
        purchase_unit_price: 0,
        purchase_total_price: 0
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch customers
                const customersRes = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
                if (!customersRes.ok) throw new Error('Failed to fetch customers');
                const customersData = await customersRes.json();
                setCustomers(customersData);

                // Fetch products
                const productsRes = await fetch(`${import.meta.env.VITE_API_URL}/products`);
                if (!productsRes.ok) throw new Error('Failed to fetch products');
                const productsData = await productsRes.json();
                setProducts(productsData.data || []);

                // Reset form data
                setFormData(prev => ({
                    ...prev,
                    customer_id: '',
                    site_id: '',
                    quotation_id: '',
                    product_list: []
                }));
            } catch (error) {
                toast.error(error.message || 'Failed to load initial data');
                console.error(error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchSites = async () => {
            if (!formData.customer_id) {
                setSites([]);
                setFormData(prev => ({ ...prev, site_id: '', quotation_id: '' }));
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/sites?customer_id=${formData.customer_id}`);
                if (!response.ok) throw new Error('Failed to fetch sites');
                const data = await response.json();
                setSites(data);

                // Reset site and quotation when customer changes
                setFormData(prev => ({
                    ...prev,
                    site_id: '',
                    quotation_id: ''
                }));
            } catch (error) {
                toast.error(error.message || 'Failed to load sites');
                console.error(error);
            }
        };

        fetchSites();
    }, [formData.customer_id]);

    useEffect(() => {
        const fetchQuotations = async () => {
            if (!formData.site_id) {
                setQuotations([]);
                setFormData(prev => ({ ...prev, quotation_id: '' }));
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/quotation`);
                if (!response.ok) throw new Error('Failed to fetch quotations');
                const data = await response.json();
                setQuotations(data.data);

                // Reset quotation when site changes
                setFormData(prev => ({ ...prev, quotation_id: '' }));
            } catch (error) {
                toast.error(error.message || 'Failed to load quotations');
                console.error(error);
            }
        };

        fetchQuotations();
    }, [formData.site_id]);

    // Load quotation products when quotation is selected
    useEffect(() => {
        const fetchQuotationProducts = async () => {
            if (!formData.quotation_id) {
                setFormData(prev => ({ ...prev, product_list: [] }));
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/quotation/${formData.quotation_id}`);
                if (!response.ok) throw new Error('Failed to fetch quotation details');
                const quotationData = await response.json();

                const quotationProducts = quotationData.data.product_details.map(product => {
                    const matchingProduct = products.find(p => p._id === product.product_id?._id);

                    return {
                        product_id: product.product_id?._id || product.product_id,
                        description: product.product_id?.product_name || product.description,
                        quantity: product.quantity,
                        material_unit_price: product.price || matchingProduct?.standard_cost || 0,
                        material_total_price: (product.quantity || 0) * (product.price || matchingProduct?.standard_cost || 0),
                        installation_unit_price: product.installation_price || matchingProduct?.installation_cost || 0,
                        installation_total_price: (product.quantity || 0) * (product.installation_price || matchingProduct?.installation_cost || 0),
                        purchase_unit_price: matchingProduct?.purchase_cost || 0,
                        purchase_total_price: (product.quantity || 0) * (matchingProduct?.purchase_cost || 0)
                    };
                });

                setFormData(prev => ({
                    ...prev,
                    product_list: quotationProducts
                }));

            } catch (error) {
                toast.error(error.message || 'Failed to load quotation products');
                console.error(error);
            }
        };

        fetchQuotationProducts();
    }, [formData.quotation_id, products]);

    // Calculate totals
    const calculateTotals = () => {
        const productList = formData.product_list;

        const totalMaterial = productList.reduce((sum, product) => sum + (product.material_total_price || 0), 0);
        const totalInstallation = productList.reduce((sum, product) => sum + (product.installation_total_price || 0), 0);
        const totalPurchase = productList.reduce((sum, product) => sum + (product.purchase_total_price || 0), 0);

        // Calculate misc expenses
        const miscExpenses = Object.values(formData.misc_expenses).reduce((sum, val) => sum + (val || 0), 0);

        // Calculate totals
        const productCost = totalMaterial;
        const installationCost = totalInstallation;
        const purchaseCost = totalPurchase;
        const totalCost = purchaseCost + miscExpenses;

        // Calculate project cost as sum of all product costs
        const projectCost = totalMaterial + totalInstallation;

        // Calculate margin
        const margin = projectCost - totalCost;
        const marginPercent = projectCost > 0 ? (margin / projectCost) * 100 : 0;

        return {
            total_material_cost: totalMaterial,
            total_installation_cost: totalInstallation,
            total_purchase_cost: totalPurchase,
            product_cost: productCost,
            installation_cost: installationCost,
            purchase_cost: purchaseCost,
            total_cost: totalCost,
            project_cost: projectCost,
            margin: margin,
            margin_percent: marginPercent
        };
    };

    const {
        total_material_cost,
        total_installation_cost,
        total_purchase_cost,
        purchase_cost,
        total_cost,
        project_cost,
        margin,
        margin_percent
    } = calculateTotals();

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle misc expense changes
    const handleMiscExpenseChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            misc_expenses: {
                ...prev.misc_expenses,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    // Handle product input changes
    const handleProductChange = (e) => {
        const { name, value } = e.target;
        setCurrentProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Calculate product totals when relevant fields change
    useEffect(() => {
        const quantity = parseFloat(currentProduct.quantity) || 0;
        const materialPrice = parseFloat(currentProduct.material_unit_price) || 0;
        const installationPrice = parseFloat(currentProduct.installation_unit_price) || 0;
        const purchasePrice = parseFloat(currentProduct.purchase_unit_price) || 0;

        setCurrentProduct(prev => ({
            ...prev,
            material_total_price: quantity * materialPrice,
            installation_total_price: quantity * installationPrice,
            purchase_total_price: quantity * purchasePrice
        }));
    }, [currentProduct.quantity, currentProduct.material_unit_price, currentProduct.installation_unit_price, currentProduct.purchase_unit_price]);

    // Remove product from the list
    const removeProduct = (index) => {
        setFormData(prev => {
            const newList = [...prev.product_list];
            newList.splice(index, 1);
            return {
                ...prev,
                product_list: newList
            };
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/job-costing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    ...calculateTotals()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save job costing');
            }

            toast.success('Job costing saved successfully');
            navigate('/manage-job-costing');
        } catch (error) {
            toast.error(error.message || 'Failed to save job costing');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-6 transition-all duration-300">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Add Job Costing</h1>
                                <p className="text-sm text-gray-500 mt-1">Create a new job costing record</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm"
                                    onClick={() => navigate(-1)}
                                >
                                    <X size={16} className="mr-2" />
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`flex items-center px-3 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    <Save size={16} className="mr-2" />
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Main Form */}
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            {/* Customer, Site, Quotation Selection */}
                            <div className="p-4 md:p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Customer Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                        <select
                                            name="customer_id"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                            value={formData.customer_id}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(customer => (
                                                <option key={customer._id} value={customer._id}>
                                                    {customer.customer_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Site Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                                        <select
                                            name="site_id"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                            value={formData.site_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={!formData.customer_id}
                                        >
                                            <option value="">Select Site</option>
                                            {sites.map(site => (
                                                <option key={site._id} value={site._id}>
                                                    {site.site_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quotation Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quotation</label>
                                        <select
                                            name="quotation_id"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                            value={formData.quotation_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={!formData.site_id}
                                        >
                                            <option value="">Select Quotation</option>
                                            {quotations.map(quotation => (
                                                <option key={quotation._id} value={quotation._id}>
                                                    {quotation.quotation_id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Product List Section */}
                            <div className="p-4 md:p-6 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800">Products</h2>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="hidden sm:inline">Total Products:</span>
                                        <span className="ml-1 font-medium">{formData.product_list.length}</span>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.product_list.length > 0 ? (
                                                formData.product_list.map((product, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{product.description}</div>
                                                            <div className="text-xs text-gray-500">Unit: {product.material_unit_price.toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                            {product.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{product.material_total_price.toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{product.installation_total_price.toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{product.purchase_total_price.toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                type="button"
                                                                className="text-red-600 hover:text-red-900 flex items-center"
                                                                onClick={() => removeProduct(index)}
                                                            >
                                                                <Trash2 size={16} className="mr-1" />
                                                                <span className="hidden sm:inline">Remove</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                                                        No products added yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-500" colSpan="2">Total</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {total_material_cost.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {total_installation_cost.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {total_purchase_cost.toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Costs Section */}
                            <div className="p-4 md:p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Cost Summary</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Expenses Column */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Miscellaneous Expenses</h3>
                                            <div className="space-y-3">
                                                {[1, 2, 3, 4].map((num) => (
                                                    <div key={num}>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Expense {num}</label>
                                                        <input
                                                            type="number"
                                                            name={`expense_${num}`}
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                            value={formData.misc_expenses[`expense_${num}`]}
                                                            onChange={handleMiscExpenseChange}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Purchase Cost:</span>
                                                    <span className="font-medium">{total_purchase_cost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Misc Expenses:</span>
                                                    <span className="font-medium">
                                                        {Object.values(formData.misc_expenses).reduce((sum, val) => sum + (val || 0), 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-gray-200 my-2"></div>
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span>Total Cost:</span>
                                                    <span>{total_cost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Column */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Project Summary</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Project Cost:</span>
                                                    <span className="font-medium">{project_cost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Total Cost:</span>
                                                    <span className="font-medium">{total_cost.toFixed(2)}</span>
                                                </div>
                                                <div className="border-t border-gray-200 my-2"></div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Margin (Amount):</span>
                                                    <span className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {margin.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Margin (%):</span>
                                                    <span className={`font-medium ${margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {margin_percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Products</div>
                                                    <div className="text-lg font-medium">{formData.product_list.length}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Material Cost</div>
                                                    <div className="text-lg font-medium">{total_material_cost.toFixed(2)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Installation</div>
                                                    <div className="text-lg font-medium">{total_installation_cost.toFixed(2)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Purchase</div>
                                                    <div className="text-lg font-medium">{total_purchase_cost.toFixed(2)}</div>
                                                </div>
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

export default AddJobCosting;