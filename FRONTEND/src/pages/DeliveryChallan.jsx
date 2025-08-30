import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sites, setSites] = useState([]);
    const [calls, setCalls] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
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

    // Fetch all necessary data
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

                // Fetch delivery challans
                const challansResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-challans`);
                if (!challansResponse.ok) throw new Error('Failed to fetch delivery challans');
                const challansData = await challansResponse.json();
                setChallans(challansData);

            } catch (err) {
                setError(err.message);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-challans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create delivery challan');
            }

            const newChallan = await response.json();
            setChallans(prev => [...prev, newChallan]);
            setShowCreateForm(false);
            setFormData({
                company: '',
                customer: '',
                site: '',
                call_number: '',
                delivery_date: new Date().toISOString().split('T')[0],
                po_date: '',
                reference_po_no: '',
                issued_by: '',
                remarks: '',
                is_invoiced: false,
                products: []
            });
        } catch (err) {
            setError(err.message);
        }
    };

    // Filter challans based on active tab and search term
    const filteredChallans = challans.filter(challan => {
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'pending' && !challan.is_invoiced) ||
            (activeTab === 'invoiced' && challan.is_invoiced);

        const matchesSearch = searchTerm === '' ||
            (challan.reference_po_no?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (challan.company?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (challan.customer?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-lg text-gray-600">Loading delivery challans...</span>
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
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Challans</h1>
                                <p className="text-gray-600">Manage and track your delivery documentation</p>
                            </div>

                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span className="hidden sm:inline">Create Challan</span>
                                <span className="sm:hidden">Create</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats and Filters */}
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-3 md:mr-4">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">{challans.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="rounded-full bg-yellow-100 p-2 md:p-3 mr-3 md:mr-4">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">{challans.filter(c => !c.is_invoiced).length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3 md:mr-4">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 01118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-gray-600">Invoiced</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">{challans.filter(c => c.is_invoiced).length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-gray-600">This Month</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                                        {challans.filter(c => {
                                            const created = new Date(c.delivery_date);
                                            const now = new Date();
                                            return created.getMonth() === now.getMonth() &&
                                                created.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${activeTab === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setActiveTab('invoiced')}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium ${activeTab === 'invoiced' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Invoiced
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search challans..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 text-sm md:text-base"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Create Challan Form Modal */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                                <div className="p-4 md:p-6">
                                    <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-gray-200">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create Delivery Challan</h2>
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                                                <select
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                                                <input
                                                    type="text"
                                                    name="remarks"
                                                    value={formData.remarks}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                                                    placeholder="Enter remarks"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                                                <input
                                                    type="text"
                                                    name="issued_by"
                                                    value={user.user.firstname + " " + user.user.lastname}
                                                    onChange={handleInputChange}
                                                    readOnly
                                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 bg-gray-100 rounded-lg text-sm md:text-base"
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
                                                        className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                                                        placeholder="Type to search products..."
                                                    />
                                                    {showSuggestions && productSuggestions.length > 0 && (
                                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            {productSuggestions.map(product => (
                                                                <div
                                                                    key={product._id}
                                                                    className="px-3 md:px-4 py-2 md:py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm md:text-base"
                                                                    onClick={() => selectProduct(product)}
                                                                >
                                                                    <div className="font-medium">{product.product_name}</div>
                                                                    <div className="text-xs md:text-sm text-gray-600">Code: {product.product_code}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Added Products List */}
                                            {formData.products.length > 0 ? (
                                                <div className="space-y-4">
                                                    {formData.products.map((product, index) => (
                                                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Product</label>
                                                                <div className="px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 rounded-lg">
                                                                    <div className="font-medium text-sm md:text-base">{product.product_name}</div>
                                                                    <div className="text-xs md:text-sm text-gray-600">Code: {product.product_code}</div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Quantity *</label>
                                                                <input
                                                                    type="number"
                                                                    value={product.quantity}
                                                                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                                                    min="1"
                                                                    required
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Serial Number</label>
                                                                <input
                                                                    type="text"
                                                                    value={product.serial_number}
                                                                    onChange={(e) => handleProductChange(index, 'serial_number', e.target.value)}
                                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                                                                    <span className="ml-2 text-xs md:text-sm text-gray-700">Obsolete</span>
                                                                </label>
                                                            </div>

                                                            <div className="flex items-end justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeProduct(index)}
                                                                    className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium flex items-center"
                                                                >
                                                                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                                    </svg>
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 md:py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                                    <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                    <p className="text-sm md:text-base text-gray-500">No products added. Search and select products above.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end space-x-3 md:space-x-4 pt-4 md:pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateForm(false)}
                                                className="px-4 md:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm md:text-base"
                                            >
                                                Create Challan
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Challans List */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {filteredChallans.length === 0 ? (
                            <div className="text-center py-12 md:py-16">
                                <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery challans found</h3>
                                <p className="text-gray-500 text-sm md:text-base">Get started by creating your first delivery challan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {/* Mobile Cards View */}
                                <div className="md:hidden">
                                    {filteredChallans.map((challan) => (
                                        <div key={challan._id} className="p-4 border-b border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-sm font-bold text-blue-600">
                                                    {challan.challan_id}
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${challan.is_invoiced
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {challan.is_invoiced ? 'Invoiced' : 'Pending'}
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="text-sm font-medium text-gray-900">{challan.company?.company_name || 'N/A'}</div>
                                                <div className="text-xs text-gray-600">{challan.customer?.customer_name || 'N/A'}</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                                <div>
                                                    {new Date(challan.delivery_date).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    {challan.reference_po_no || 'No PO'}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/view-delivery-chalan/${challan._id}`)} 
                                                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Challan Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Company
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Delivery Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                PO Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredChallans.map((challan) => (
                                            <tr key={challan._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-blue-600">
                                                        {challan.challan_id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{challan.company?.company_name || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{challan.customer?.customer_name || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(challan.delivery_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {challan.reference_po_no || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${challan.is_invoiced
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {challan.is_invoiced ? 'Invoiced' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button onClick={() => navigate(`/view-delivery-chalan/${challan._id}`)} className="text-blue-600 hover:text-blue-900 flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DeliveryChallan;