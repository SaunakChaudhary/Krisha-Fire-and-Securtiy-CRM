import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";

const EditDeliveryChallan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sites, setSites] = useState([]);
    const [calls, setCalls] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [originalProducts, setOriginalProducts] = useState([]);
    
    const [formData, setFormData] = useState({
        company: '',
        customer: '',
        site: '',
        call_number: '',
        delivery_date: new Date().toISOString().split('T')[0],
        po_date: '',
        reference_po_no: '',
        issued_by: user.user._id,
        remarks: '',
        is_invoiced: false,
        products: []
    });

    // Fetch all necessary data and the specific delivery challan
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch companies  
                const companiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/company`);
                if (!companiesResponse.ok) throw new Error('Failed to fetch companies');
                const companiesData = await companiesResponse.json();
                setCompanies(companiesData);

                // Fetch customers
                const customersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
                if (!customersResponse.ok) throw new Error('Failed to fetch customers');
                const customersData = await customersResponse.json();
                setCustomers(customersData);

                // Fetch sites
                const sitesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/sites`);
                if (!sitesResponse.ok) throw new Error('Failed to fetch sites');
                const sitesData = await sitesResponse.json();
                setSites(sitesData);

                // Fetch calls
                const callsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/calls`);
                if (!callsResponse.ok) throw new Error('Failed to fetch calls');
                const callsData = await callsResponse.json();
                setCalls(callsData.data || callsData);

                // Fetch products
                const productsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
                if (!productsResponse.ok) throw new Error('Failed to fetch products');
                const productsData = await productsResponse.json();
                setProducts(productsData.data || productsData);

                // Fetch the specific delivery challan
                const challanResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-challans/${id}`);
                if (!challanResponse.ok) throw new Error('Failed to fetch delivery challan');
                const challanData = await challanResponse.json();
                
                // Store original products for stock restoration if needed
                setOriginalProducts([...challanData.products]);
                
                // Format dates for input fields
                const deliveryDate = new Date(challanData.delivery_date);
                const poDate = challanData.po_date ? new Date(challanData.po_date) : '';
                
                setFormData({
                    company: challanData.company?._id || challanData.company,
                    customer: challanData.customer?._id || challanData.customer,
                    site: challanData.site?._id || challanData.site,
                    call_number: challanData.call_number?._id || challanData.call_number,
                    delivery_date: deliveryDate.toISOString().split('T')[0],
                    po_date: poDate ? poDate.toISOString().split('T')[0] : '',
                    reference_po_no: challanData.reference_po_no || '',
                    issued_by: challanData.issued_by?._id || challanData.issued_by || user.user._id,
                    remarks: challanData.remarks || '',
                    is_invoiced: challanData.is_invoiced || false,
                    products: challanData.products.map(p => ({
                        ...p,
                        product: p.product?._id || p.product
                    }))
                });

            } catch (err) {
                setError(err.message);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user.user._id]);

    // Filter customers based on selected company
    const filteredCustomers = formData.company
        ? customers.filter(customer => customer.company_id === formData.company || customer.company_id?._id === formData.company)
        : customers;

    // Filter sites based on selected customer
    const filteredSites = formData.customer
        ? sites.filter(site => site.customer_id === formData.customer || site.customer_id?._id === formData.customer)
        : sites;

    // Filter calls based on selected site
    const filteredCalls = formData.site
        ? calls.filter(call => call.site_id === formData.site || call.site_id?._id === formData.site)
        : calls;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleProductSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length > 1) {
            const filtered = products.filter(product =>
                product.product_name?.toLowerCase().includes(value.toLowerCase()) ||
                product.product_code?.toLowerCase().includes(value.toLowerCase())
            );
            setProductSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setProductSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectProduct = (product) => {
        // Check if product is already added
        const isAlreadyAdded = formData.products.some(p => p.product === product._id);

        if (!isAlreadyAdded) {
            const newProduct = {
                product: product._id,
                product_name: product.product_name,
                product_code: product.product_code,
                serial_number: '',
                quantity: 1,
                obsolete: false
            };

            setFormData(prev => ({
                ...prev,
                products: [...prev.products, newProduct]
            }));
        }

        setSearchTerm('');
        setProductSuggestions([]);
        setShowSuggestions(false);
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...formData.products];
        
        // Convert quantity to number if needed
        if (field === 'quantity') {
            value = parseInt(value) || 0;
        }
        
        updatedProducts[index][field] = value;

        setFormData(prev => ({
            ...prev,
            products: updatedProducts
        }));
    };

    const removeProduct = (index) => {
        const updatedProducts = [...formData.products];
        updatedProducts.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            products: updatedProducts
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-challans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    // Ensure we're only sending the product ID, not the entire product object
                    products: formData.products.map(p => ({
                        product: p.product,
                        product_code: p.product_code,
                        serial_number: p.serial_number,
                        quantity: p.quantity,
                        obsolete: p.obsolete
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update delivery challan');
            }

            const updatedChallan = await response.json();
            alert('Delivery challan updated successfully!');
            navigate('/delivery-chalan'); // Redirect to the list page
            
        } catch (err) {
            setError(err.message);
            console.error("Error updating delivery challan:", err);
        }
    };

    const handleCancel = () => {
        navigate('/delivery-chalan');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-lg text-gray-600">Loading delivery challan...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <strong>Error:</strong> {error}
                            </div>
                            <button 
                                onClick={() => navigate('/delivery-chalan')}
                                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                            >
                                Back to Delivery Challans
                            </button>
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
                <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="mb-6 lg:mb-0">
                                <button 
                                    onClick={() => navigate('/delivery-chalan')}
                                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                                >
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                    </svg>
                                    Back to Delivery Challans
                                </button>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Delivery Challan</h1>
                                <p className="text-gray-600">Update delivery documentation details</p>
                            </div>
                        </div>
                    </div>

                    {/* Edit Challan Form */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                                    <select
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(company => (
                                            <option key={company._id} value={company._id}>
                                                {company.company_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                                    <select
                                        name="customer"
                                        value={formData.customer}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={!formData.company}
                                    >
                                        <option value="">Select Customer</option>
                                        {filteredCustomers.map(customer => (
                                            <option key={customer._id} value={customer._id}>
                                                {customer.customer_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                                    <select
                                        name="site"
                                        value={formData.site}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={!formData.customer}
                                    >
                                        <option value="">Select Site</option>
                                        {filteredSites.map(site => (
                                            <option key={site._id} value={site._id}>
                                                {site.site_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Call Number</label>
                                    <select
                                        name="call_number"
                                        value={formData.call_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={!formData.site}
                                    >
                                        <option value="">Select Call</option>
                                        {filteredCalls.map(call => (
                                            <option key={call._id} value={call._id}>
                                                #{call.call_number} - {call.site_id?.site_name || 'No Site'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                                    <input
                                        type="date"
                                        name="delivery_date"
                                        value={formData.delivery_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                    <input
                                        type="text"
                                        name="reference_po_no"
                                        value={formData.reference_po_no}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter PO number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Date</label>
                                    <input
                                        type="date"
                                        name="po_date"
                                        value={formData.po_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                                    <input
                                        type="text"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter remarks"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                                    <input
                                        type="text"
                                        name="issued_by"
                                        value={user.user.firstname + " " + user.user.lastname}
                                        readOnly
                                        className="w-full px-4 py-2.5 border border-gray-300 bg-gray-100 rounded-lg"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_invoiced"
                                        checked={formData.is_invoiced}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Mark as Invoiced
                                    </label>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div className="pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                                </div>

                                {/* Product Search */}
                                <div className="relative mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleProductSearch}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Type to search products..."
                                        />
                                        {showSuggestions && productSuggestions.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {productSuggestions.map(product => (
                                                    <div
                                                        key={product._id}
                                                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                        onClick={() => selectProduct(product)}
                                                    >
                                                        <div className="font-medium">{product.product_name}</div>
                                                        <div className="text-sm text-gray-600">Code: {product.product_code}</div>
                                                        <div className="text-sm text-gray-600">Stock: {product.units}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Added Products List */}
                                {formData.products.length > 0 ? (
                                    <div className="space-y-4">
                                        {formData.products.map((product, index) => {
                                            const productInfo = products.find(p => p._id === product.product) || {};
                                            return (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                                        <div className="px-3 py-2 bg-gray-100 rounded-lg">
                                                            <div className="font-medium">{productInfo.product_name || product.product_name}</div>
                                                            <div className="text-sm text-gray-600">Code: {productInfo.product_code || product.product_code}</div>
                                                            <div className="text-sm text-gray-600">Available: {productInfo.units || 'N/A'}</div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                                        <input
                                                            type="number"
                                                            value={product.quantity}
                                                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            min="1"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                                                        <input
                                                            type="text"
                                                            value={product.serial_number}
                                                            onChange={(e) => handleProductChange(index, 'serial_number', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Serial number"
                                                        />
                                                    </div>

                                                    <div className="flex items-end">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={product.obsolete}
                                                                onChange={(e) => handleProductChange(index, 'obsolete', e.target.checked)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">Obsolete</span>
                                                        </label>
                                                    </div>

                                                    <div className="flex items-end justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(index)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                            </svg>
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <p className="text-gray-500">No products added. Search and select products above.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Update Challan
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditDeliveryChallan;