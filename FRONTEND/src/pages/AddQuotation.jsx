import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Building, Plus, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const AddQuotation = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [systems, setSystems] = useState([]);
  const [products, setProducts] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState({
    companies: true,
    customers: true,
    systems: true,
    products: true,
    sites: true,
    submitting: false
  });

  const [expandedSections, setExpandedSections] = useState({
    quotationDetails: true,
    systemDetails: true,
    productSelection: true,
    termsConditions: false
  });

  const [formData, setFormData] = useState({
    company_id: "",
    customer_id: "",
    site_id: "",
    terms_and_conditions: "",
    include_in_pdf: {
      sr_no: true,
      item_description: true,
      part_code: true,
      make: true,
      quantity: true,
      unit: true,
      gst_percent: true,
      specification: true
    },
    system_details: "",
    product_details: []
  });

  const [currentProduct, setCurrentProduct] = useState({
    product_id: "",
    description: "",
    manufacturer: "",
    gst_percent: 18,
    quantity: 1,
    price: 0,
    total_amount: 0,
    installation_price: 0,
    installation_gst_percent: 18,
    installation_amount: 0,
    narration: ""
  });

  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // API call to fetch companies
  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data);
      setLoading(prev => ({ ...prev, companies: false }));
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };

  // API call to fetch systems
  const fetchSystems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/systems`);
      if (!response.ok) throw new Error('Failed to fetch systems');
      const data = await response.json();
      setSystems(data.systems);
      setLoading(prev => ({ ...prev, systems: false }));
    } catch (error) {
      console.error("Error fetching systems:", error);
      toast.error("Failed to load systems");
      setLoading(prev => ({ ...prev, systems: false }));
    }
  };

  // API call to fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.data);
      setLoading(prev => ({ ...prev, products: false }));
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // API call to fetch customers by company
  const fetchCustomersByCompany = async (companyId) => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers?company_id=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
      setLoading(prev => ({ ...prev, customers: false }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  // API call to fetch sites by customer
  const fetchSitesByCustomer = async (customerId) => {
    try {
      setLoading(prev => ({ ...prev, sites: true }));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sites?customer_id=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data);
      setLoading(prev => ({ ...prev, sites: false }));
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to load sites");
      setLoading(prev => ({ ...prev, sites: false }));
    }
  };

  // API call to create quotation
  const createQuotation = async (quotationData) => {
    try {
      setLoading(prev => ({ ...prev, submitting: true }));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(quotationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quotation');
      }

      const data = await response.json();
      toast.success("Quotation created successfully!");
      navigate('/search-quotation');
      return data;
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast.error(error.message || "Failed to create quotation");
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  // Calculate product amounts
  const calculateProductAmount = () => {
    const quantity = parseFloat(currentProduct.quantity) || 0;
    const price = parseFloat(currentProduct.price) || 0;
    const gst_percent = parseFloat(currentProduct.gst_percent) || 0;
    const installation_price = parseFloat(currentProduct.installation_price) || 0;
    const installation_gst_percent = parseFloat(currentProduct.installation_gst_percent) || 0;

    const total_amount = quantity * price;
    const installation_amount = quantity * installation_price;

    setCurrentProduct(prev => ({
      ...prev,
      total_amount,
      installation_amount
    }));
  };

  // Search products
  const handleProductSearch = (searchTerm) => {
    setProductSearch(searchTerm);

    if (searchTerm.length > 1) {
      const filtered = products.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.product_code && product.product_code.toLowerCase().includes(searchTerm.toLowerCase())))
      setProductSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setProductSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a product from suggestions
  const handleProductSelect = (product) => {
    setProductSearch(product.product_name);
    setCurrentProduct(prev => ({
      ...prev,
      product_id: product._id,
      description: product.product_name,
      manufacturer: product.manufacturer?.name || product.manufacturer || "",
      gst_percent: product.GST || 18,
      price: product.standard_sale || 0,
      installation_price: product.installation_sale || 0,
      installation_gst_percent: product.installation_GST || 18
    }));
    setShowSuggestions(false);
    calculateProductAmount();
  };

  // Add product to the list
  const addProduct = () => {
    if (currentProduct.product_id && currentProduct.description && currentProduct.quantity && currentProduct.price) {
      calculateProductAmount();
      const newProduct = {
        ...currentProduct,
        id: Date.now()
      };

      setFormData(prev => ({
        ...prev,
        product_details: [...prev.product_details, newProduct]
      }));

      // Reset current product
      setCurrentProduct({
        product_id: "",
        description: "",
        manufacturer: "",
        gst_percent: 18,
        quantity: 1,
        price: 0,
        total_amount: 0,
        installation_price: 0,
        installation_gst_percent: 18,
        installation_amount: 0,
        narration: ""
      });
      setProductSearch("");
    }
  };

  // Remove product from the list
  const removeProduct = (id) => {
    setFormData(prev => ({
      ...prev,
      product_details: prev.product_details.filter(product => product.id !== id)
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;
    let installationSubtotal = 0;
    let installationGst = 0;

    formData.product_details.forEach(product => {
      subtotal += parseFloat(product.total_amount) || 0;
      totalGst += (parseFloat(product.total_amount) * parseFloat(product.gst_percent)/100 || 0);
      installationSubtotal += parseFloat(product.installation_amount) || 0;
      installationGst += (parseFloat(product.installation_amount) * parseFloat(product.installation_gst_percent)/100 || 0);
    });

    const grossTotal = subtotal + totalGst + installationSubtotal + installationGst;

    return {
      subtotal,
      totalGst,
      installationSubtotal,
      installationGst,
      grossTotal
    };
  };

  const { subtotal, totalGst, installationSubtotal, installationGst, grossTotal } = calculateTotals();

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.company_id || !formData.customer_id || !formData.site_id) {
      toast.error("Please select company, customer, and site");
      return;
    }

    if (formData.product_details.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    try {
      const submissionData = {
        ...formData,
        product_details: formData.product_details.map(({ id, ...rest }) => rest)
      };
      
      await createQuotation(submissionData);
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchCompanies(),
        fetchSystems(),
        fetchProducts()
      ]);
    };

    fetchInitialData();
  }, []);

  // Fetch customers when company is selected
  useEffect(() => {
    if (formData.company_id) {
      fetchCustomersByCompany(formData.company_id);
      // Reset customer and site when company changes
      setFormData(prev => ({
        ...prev,
        customer_id: "",
        site_id: ""
      }));
      setCustomers([]);
      setSites([]);
    }
  }, [formData.company_id]);

  // Fetch sites when customer is selected
  useEffect(() => {
    if (formData.customer_id) {
      fetchSitesByCustomer(formData.customer_id);
      // Reset site when customer changes
      setFormData(prev => ({
        ...prev,
        site_id: ""
      }));
      setSites([]);
    }
  }, [formData.customer_id]);

  // Recalculate amounts when relevant fields change
  useEffect(() => {
    calculateProductAmount();
  }, [
    currentProduct.quantity,
    currentProduct.price,
    currentProduct.gst_percent,
    currentProduct.installation_price,
    currentProduct.installation_gst_percent
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Create New Quotation</h1>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => navigate(-1)}
                >
                  <X size={16} className="mr-2" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition ${loading.submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  onClick={handleSubmit}
                  disabled={loading.submitting}
                >
                  <Save size={16} className="mr-2" />
                  {loading.submitting ? 'Saving...' : 'Save Quotation'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quotation Details Section */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection("quotationDetails")}
                >
                  <div className="flex items-center">
                    <Building className="text-red-600 mr-2" size={18} />
                    <h2 className="text-lg font-semibold text-gray-800">Quotation Details</h2>
                  </div>
                  {expandedSections.quotationDetails ? (
                    <ChevronUp className="text-gray-500" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={18} />
                  )}
                </div>

                {expandedSections.quotationDetails && (
                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Company */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company*</label>
                      <select
                        name="company_id"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        required
                        disabled={loading.companies}
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company._id} value={company._id}>
                            {company.company_name}
                          </option>
                        ))}
                      </select>
                      {loading.companies && <p className="text-xs text-gray-500 mt-1">Loading companies...</p>}
                    </div>

                    {/* Customer */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer*</label>
                      <select
                        name="customer_id"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.customer_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.company_id || loading.customers}
                      >
                        <option value="">Select Customer</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.customer_name}
                          </option>
                        ))}
                      </select>
                      {loading.customers && <p className="text-xs text-gray-500 mt-1">Loading customers...</p>}
                    </div>

                    {/* Site */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site*</label>
                      <select
                        name="site_id"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.site_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.customer_id || loading.sites}
                      >
                        <option value="">Select Site</option>
                        {sites.map(site => (
                          <option key={site._id} value={site._id}>
                            {site.site_name}
                          </option>
                        ))}
                      </select>
                      {loading.sites && <p className="text-xs text-gray-500 mt-1">Loading sites...</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* System Details Section */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection("systemDetails")}
                >
                  <h2 className="text-lg font-semibold text-gray-800">System Details</h2>
                  {expandedSections.systemDetails ? (
                    <ChevronUp className="text-gray-500" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={18} />
                  )}
                </div>

                {expandedSections.systemDetails && (
                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
                        <select
                          name="system_details"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={formData.system_details}
                          onChange={handleInputChange}
                          disabled={loading.systems}
                        >
                          <option value="">Select System</option>
                          {systems.map(system => (
                            <option key={system._id} value={system._id}>
                              {system.systemName}
                            </option>
                          ))}
                        </select>
                        {loading.systems && <p className="text-xs text-gray-500 mt-1">Loading systems...</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selection Section */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection("productSelection")}
                >
                  <h2 className="text-lg font-semibold text-gray-800">Product Selection</h2>
                  {expandedSections.productSelection ? (
                    <ChevronUp className="text-gray-500" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={18} />
                  )}
                </div>

                {expandedSections.productSelection && (
                  <div className="p-4 md:p-6 space-y-6">
                    {/* Product Search and Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {/* Product Search */}
                      <div className="col-span-1 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Product*</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={productSearch}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          placeholder="Type product name or code..."
                        />
                        {showSuggestions && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                            {productSuggestions.map(product => (
                              <div
                                key={product._id}
                                className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                                onClick={() => handleProductSelect(product)}
                              >
                                <div className="font-medium">{product.product_name}</div>
                                <div className="text-sm text-gray-500">
                                  {product.product_code && `Code: ${product.product_code}`}
                                  {product.manufacturer && (
                                    <span className="ml-2">
                                      Manufacturer: {typeof product.manufacturer === 'object' ? product.manufacturer.name : product.manufacturer}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Description */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                        <input
                          type="text"
                          name="description"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.description}
                          onChange={handleProductChange}
                          
                        />
                      </div>

                      {/* Manufacturer */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                        <input
                          type="text"
                          name="manufacturer"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.manufacturer}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.quantity}
                          onChange={handleProductChange}
                          
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price*</label>
                        <input
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.price}
                          onChange={handleProductChange}
                          
                        />
                      </div>

                      {/* GST */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                        <input
                          type="number"
                          name="gst_percent"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.gst_percent}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* Installation Price */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installation Price</label>
                        <input
                          type="number"
                          name="installation_price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.installation_price}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* Installation GST */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Installation GST %</label>
                        <input
                          type="number"
                          name="installation_gst_percent"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.installation_gst_percent}
                          onChange={handleProductChange}
                        />
                      </div>

                      {/* Narration */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                        <input
                          type="text"
                          name="narration"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={currentProduct.narration}
                          onChange={handleProductChange}
                        />
                      </div>
                    </div>

                    {/* Add Product Button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        onClick={addProduct}
                      >
                        <Plus size={16} className="mr-2" />
                        Add Product
                      </button>
                    </div>

                    {/* Products Table - Responsive Design */}
                    {formData.product_details.length > 0 && (
                      <div className="overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inst. Price</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inst. GST %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inst. Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formData.product_details.map((product, index) => (
                                <tr key={product.id}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                                    {product.description}
                                    {product.narration && (
                                      <p className="text-xs text-gray-500">{product.narration}</p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.price.toFixed(2)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.gst_percent}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.total_amount.toFixed(2)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.installation_price.toFixed(2)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.installation_gst_percent}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.installation_amount.toFixed(2)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                      onClick={() => removeProduct(product.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-500">Subtotal</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{subtotal.toFixed(2)}</td>
                                <td colSpan="2" className="px-3 py-2 text-right text-sm font-medium text-gray-500">Installation Subtotal</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{installationSubtotal.toFixed(2)}</td>
                                <td></td>
                              </tr>
                              <tr>
                                <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-500">GST</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{totalGst.toFixed(2)}</td>
                                <td colSpan="2" className="px-3 py-2 text-right text-sm font-medium text-gray-500">Installation GST</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{installationGst.toFixed(2)}</td>
                                <td></td>
                              </tr>
                              <tr>
                                <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-500">Total Amount</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{(subtotal + totalGst).toFixed(2)}</td>
                                <td colSpan="2" className="px-3 py-2 text-right text-sm font-medium text-gray-500">Installation Total</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{(installationSubtotal + installationGst).toFixed(2)}</td>
                                <td></td>
                              </tr>
                              <tr>
                                <td colSpan="7" className="px-3 py-2 text-right text-sm font-bold text-gray-700">Gross Total</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900">{grossTotal.toFixed(2)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                          {formData.product_details.map((product, index) => (
                            <div key={product.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{product.description}</h3>
                                  {product.narration && (
                                    <p className="text-xs text-gray-500 mt-1">{product.narration}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Qty:</span>
                                  <span className="ml-1">{product.quantity}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Price:</span>
                                  <span className="ml-1">{product.price.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">GST:</span>
                                  <span className="ml-1">{product.gst_percent}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Amount:</span>
                                  <span className="ml-1">{product.total_amount.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Inst. Price:</span>
                                  <span className="ml-1">{product.installation_price.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Inst. GST:</span>
                                  <span className="ml-1">{product.installation_gst_percent}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Inst. Amount:</span>
                                  <span className="ml-1">{product.installation_amount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Mobile Totals */}
                          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="col-span-2 font-medium text-gray-700 border-b pb-2 mb-2">Summary</div>
                              <div>
                                <span className="text-gray-500">Subtotal:</span>
                                <span className="ml-1 font-medium">{subtotal.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">GST:</span>
                                <span className="ml-1 font-medium">{totalGst.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Inst. Subtotal:</span>
                                <span className="ml-1 font-medium">{installationSubtotal.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Inst. GST:</span>
                                <span className="ml-1 font-medium">{installationGst.toFixed(2)}</span>
                              </div>
                              <div className="col-span-2 border-t pt-2 mt-2">
                                <span className="text-gray-700 font-bold">Gross Total:</span>
                                <span className="ml-1 font-bold">{grossTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Terms & Conditions Section */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection("termsConditions")}
                >
                  <h2 className="text-lg font-semibold text-gray-800">Terms & Conditions</h2>
                  {expandedSections.termsConditions ? (
                    <ChevronUp className="text-gray-500" size={18} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={18} />
                  )}
                </div>

                {expandedSections.termsConditions && (
                  <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                        <textarea
                          name="terms_and_conditions"
                          rows="4"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={formData.terms_and_conditions}
                          onChange={handleInputChange}
                          placeholder="Enter terms and conditions for this quotation..."
                        ></textarea>
                      </div>

                      {/* <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">PDF Display Options</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(formData.include_in_pdf).map(([option, value]) => (
                            <div key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`pdf-option-${option}`}
                                checked={value}
                                onChange={() => handlePdfOptionChange(option)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`pdf-option-${option}`} className="ml-2 block text-sm text-gray-700 capitalize">
                                {option.replace(/_/g, ' ')}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${loading.submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loading.submitting}
                >
                  {loading.submitting ? 'Saving...' : 'Save Quotation'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddQuotation;