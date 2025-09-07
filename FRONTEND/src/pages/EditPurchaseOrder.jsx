import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FileText, ShoppingCart, Package, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Plus, Minus, Save, Printer, Search
} from 'lucide-react';
import { toast } from "react-hot-toast";
import { AuthContext } from "../Context/AuthContext";
import { useParams, useNavigate } from 'react-router-dom';

const EditPurchaseOrder = () => {
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
      if (!hasPermission("Manage Purchase Order")) {
        return navigate("/UserUnAuthorized/Manage Purchase Order");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    supplier: true,
    delivery: true,
    products: true,
    terms: true
  });

  // Data lists
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Main form state
  const [formData, setFormData] = useState({
    company_id: '',
    supplier_id: '',
    address: '',
    mobile_no: '',
    on_order: false,
    delivered: false,
    call_id: '',
    date: '',
    due_date: '',
    placed_by: '',
    notes: '',
    deliver_to: '',
    deliver_to_store: false,
    delivery_address: '',
    delivery_instructions: '',
    delivery_date: '',
    other_terms: '',
    products: [],
    total_amount: 0,
    gst_inclusive: 0,
    gst_adjust: 0,
    gross_amount: 0,
    discount_percent: 0,
    settlement_days: 0,
    mark_as_confirmation_order: false,
    auto_created: false
  });

  const [fetchedData, setFetchedData] = useState({});

  // Fetch all necessary data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch form dropdown data
        const [companiesRes, suppliersRes, customersRes, productsRes, callsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/company`),
          fetch(`${import.meta.env.VITE_API_URL}/api/supplier`),
          fetch(`${import.meta.env.VITE_API_URL}/api/customers`),
          fetch(`${import.meta.env.VITE_API_URL}/api/products`),
          fetch(`${import.meta.env.VITE_API_URL}/api/calls`)
        ]);
        setCompanies(await companiesRes.json());
        setSuppliers((await suppliersRes.json()).data.filter(sup => sup.status === "Active"));
        setCustomers(await customersRes.json());
        setProducts((await productsRes.json()).data);
        setCalls((await callsRes.json()).data);

        // Fetch existing PO data
        const poRes = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-order/${id}`);
        const poData = await poRes.json();
        setFetchedData(poData);
        if (!poRes.ok) throw new Error(poData.message || "Failed to fetch purchase order");

        // Patch missing fields if PO missing any (for robustness)
        setFormData({
          ...formData,
          ...poData,
          company_id: poData.company_id?._id || '',
          placed_by: poData.placed_by?._id || poData.placed_by || '',
          supplier_id: poData.supplier_id?._id || '',
          deliver_to: poData.deliver_to?._id || '',
          date: poData.date ? poData.date.split('T')[0] : '',               // ✔️ fixed
          due_date: poData.due_date ? poData.due_date.split('T')[0] : '',   // ✔️ fixed
          delivery_date: poData.delivery_date ? poData.delivery_date.split('T')[0] : '' // ✔️ fixed
        });
      } catch (error) {
        console.error("Error initializing edit form:", error);
        toast.error(error.message || 'Error loading data');
      }
    };

    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (formData.supplier_id) {
      const selectedSupplier = suppliers.find(s => s._id === formData.supplier_id);
      if (selectedSupplier) {
        const addressParts = [
          selectedSupplier.communicationAddress?.address_line_1,
          selectedSupplier.communicationAddress?.address_line_2,
          selectedSupplier.communicationAddress?.address_line_3,
          selectedSupplier.communicationAddress?.address_line_4
        ].filter(part => part && part.trim() !== '');
        setFormData(prev => ({
          ...prev,
          address: addressParts.join(', '),
          mobile_no: selectedSupplier.contacts?.mobileNo || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        address: '',
        mobile_no: ''
      }));
    }
    // eslint-disable-next-line
  }, [formData.supplier_id, suppliers]);

  useEffect(() => {
    if (formData.deliver_to) {
      const selectedCustomer = customers.find(c => c._id === formData.deliver_to);
      if (selectedCustomer && selectedCustomer.address) {
        setFormData(prev => ({
          ...prev,
          delivery_address: [selectedCustomer.address.line1, selectedCustomer.address.line2, selectedCustomer.address.line3, selectedCustomer.address.line4]
            .filter(Boolean).join(', ')
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        delivery_address: ''
      }));
    }
    // eslint-disable-next-line
  }, [formData.deliver_to, customers]);

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProductFromSearch = (product) => {
    const newProduct = {
      product_id: product._id,
      product_name: product.product_name,
      description: product.description || '',
      manufacturer: product.manufacturer?.name || '',
      gst_percent: product.GST || 0,
      quantity: 1,
      price: product.purchase_cost || 0,
      discount: 0,
      total_amount: product.purchase_cost || 0
    };
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    recalculateTotals([...formData.products, newProduct]);
    setSearchTerm('');
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    // Recalculate total for this product
    if (['quantity', 'price', 'discount', 'gst_percent'].includes(field)) {
      const quantity = field === 'quantity' ? value : updatedProducts[index].quantity;
      const price = field === 'price' ? value : updatedProducts[index].price;
      const discount = field === 'discount' ? value : updatedProducts[index].discount;
      updatedProducts[index].total_amount = (quantity * price) - discount;
    }
    setFormData(prev => ({
      ...prev,
      products: updatedProducts
    }));
    recalculateTotals(updatedProducts);
  };

  const recalculateTotals = (productsList) => {
    const totalAmount = productsList.reduce((sum, product) => sum + (product.total_amount || 0), 0);
    const gstAmount = productsList.reduce((sum, product) => {
      const gst = (product.total_amount || 0) * (product.gst_percent || 0) / 100;
      return sum + gst;
    }, 0);
    const grossAmount = totalAmount + gstAmount + parseFloat(formData.gst_adjust || 0);
    setFormData(prev => ({
      ...prev,
      total_amount: totalAmount,
      gst_inclusive: gstAmount,
      gross_amount: grossAmount
    }));
  };

  const removeProduct = (index) => {
    const updatedProducts = [...formData.products];
    updatedProducts.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      products: updatedProducts
    }));
    recalculateTotals(updatedProducts);
  };

  const resetProducts = () => {
    setFormData(prev => ({
      ...prev,
      products: []
    }));
    recalculateTotals([]);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (['gst_adjust'].includes(name)) {
      recalculateTotals([...formData.products]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id || !formData.supplier_id || formData.products.length === 0) {
      toast.error('Please fill all required fields and add at least one product');
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/purchase-order/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update purchase order');
      toast.success('Purchase Order updated successfully!');
      navigate('/manage-purchase-order');
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast.error(error.message || 'Failed to update purchase order. Please try again.');
    }
  };

  const handleClear = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Only set if user is available
    if (user?.user?._id) {
      setFormData((prev) => ({
        ...prev,
        placed_by: user.user._id
      }));
    }
  }, [user]);

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Purchase Order</h1>
                <p className="text-xs sm:text-sm text-gray-500">Modify an existing purchase order</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleClear}
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  <XCircle size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Reload</span>
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                >
                  <Save size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </button>
                <button
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => window.print()}
                >
                  <Printer size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Supplier Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('supplier')}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <FileText className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Supplier Information
                    </h2>
                  </div>
                  {expandedSections.supplier
                    ? <ChevronUp size={18} className="text-gray-500" />
                    : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.supplier ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company*</label>
                      <select
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                      <select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.supplierName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        readOnly
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                      <input
                        type="text"
                        name="mobile_no"
                        value={formData.mobile_no}
                        onChange={handleInputChange}
                        readOnly
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Call Reference</label>
                      <select
                        name="call_id"
                        value={formData.call_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      >
                        <option value="">Select Call (Optional)</option>
                        {calls.map(call => (
                          <option key={call._id} value={call._id}>
                            #{call.call_number} - {call.site_id?.site_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PO Date</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Placed By</label>
                      <input
                        type="text"
                        value={
                          fetchedData.placed_by?.firstname
                            ? `${fetchedData.placed_by.firstname} ${fetchedData.placed_by.lastname || ''}`
                            : fetchedData.placed_by || ''
                        }
                        readOnly
                        disabled
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-100 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('delivery')}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <Package className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Delivery Information
                    </h2>
                  </div>
                  {expandedSections.delivery
                    ? <ChevronUp size={18} className="text-gray-500" />
                    : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.delivery ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Deliver To Customer</label>
                      <select
                        name="deliver_to"
                        value={formData.deliver_to}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      >
                        <option value="">Select Customer (Optional)</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.customer_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          name="deliver_to_store"
                          checked={formData.deliver_to_store}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-700">Deliver to our store</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                      <textarea
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
                      <textarea
                        name="delivery_instructions"
                        value={formData.delivery_instructions}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                      <input
                        type="date"
                        name="delivery_date"
                        value={formData.delivery_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("products")}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <ShoppingCart className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Products
                    </h2>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                      {formData.products.length} items
                    </span>
                  </div>
                  {expandedSections.products ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </button>

                <div
                  className={`transition-all duration-300 overflow-hidden ${expandedSections.products
                    ? "max-h-[5000px] opacity-100"
                    : "max-h-0 opacity-0"
                    }`}
                >
                  <div className="p-4 sm:p-6">
                    {/* Product Search */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Product Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Product
                          </label>
                          <input
                            type="text"
                            placeholder="To Select, begin typing"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex space-x-2 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                if (searchTerm && filteredProducts.length > 0) {
                                  addProductFromSearch(filteredProducts);
                                }
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 whitespace-nowrap flex-1"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={resetProducts}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300 whitespace-nowrap flex-1"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchTerm && filteredProducts.length > 0 && (
                        <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                          {filteredProducts.slice(0, 5).map((product) => (
                            <div
                              key={product._id}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => addProductFromSearch(product)}
                            >
                              <div className="font-medium text-xs">{product.product_name}</div>
                              <div className="text-xs text-gray-500">
                                {product.manufacturer?.name} - ₹{product.purchase_cost}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Products Table (Desktop/Tablet) */}
                    {formData.products.length > 0 ? (
                      <>
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Manufacturer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  GST %
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Qty
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Discount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formData.products.map((product, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {product.product_name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={product.description}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {product.manufacturer}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={product.gst_percent}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "gst_percent",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      value={product.quantity}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "quantity",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                      required
                                      min="1"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={product.price}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "price",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                      required
                                      min="0"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={product.discount}
                                      onChange={(e) =>
                                        handleProductChange(
                                          index,
                                          "discount",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                      min="0"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={product.total_amount?.toFixed(2)}
                                      readOnly
                                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-md bg-gray-100"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => removeProduct(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Minus size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-4">
                          {formData.products.map((product, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-sm">{product.product_name}</h4>
                                <button
                                  type="button"
                                  onClick={() => removeProduct(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Minus size={16} />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="col-span-2">
                                  <label className="block font-medium mb-1">Description</label>
                                  <input
                                    type="text"
                                    value={product.description}
                                    onChange={(e) =>
                                      handleProductChange(index, "description", e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block font-medium mb-1">Manufacturer</label>
                                  <p className="text-gray-700">{product.manufacturer}</p>
                                </div>
                                <div>
                                  <label className="block font-medium mb-1">GST %</label>
                                  <input
                                    type="number"
                                    value={product.gst_percent}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "gst_percent",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block font-medium mb-1">Qty</label>
                                  <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "quantity",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="block font-medium mb-1">Price</label>
                                  <input
                                    type="number"
                                    value={product.price}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "price",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block font-medium mb-1">Discount</label>
                                  <input
                                    type="number"
                                    value={product.discount}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "discount",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                    min="0"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block font-medium mb-1">Total</label>
                                  <input
                                    type="number"
                                    value={product.total_amount?.toFixed(2)}
                                    readOnly
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-100"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Totals */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Order Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium">Total Amount</span>
                                <span className="text-sm font-medium">
                                  ₹{formData.total_amount?.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium">GST (Inc Adj.)</span>
                                <span className="text-sm font-medium">
                                  ₹{formData.gst_inclusive?.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b items-center">
                                <span className="text-sm font-medium">GST (Adjust)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  name="gst_adjust"
                                  value={formData.gst_adjust}
                                  onChange={handleInputChange}
                                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md text-right"
                                />
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-sm font-bold">Gross Amount</span>
                                <span className="text-sm font-bold">
                                  ₹{formData.gross_amount?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart size={32} className="mx-auto mb-2" />
                        <p>No products added yet. Search for products above to add them.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* Terms Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('terms')}
                  className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <FileText className="text-red-600 mr-3" size={18} />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      Terms & Conditions
                    </h2>
                  </div>
                  {expandedSections.terms
                    ? <ChevronUp size={18} className="text-gray-500" />
                    : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.terms ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Other Terms</label>
                      <textarea
                        name="other_terms"
                        value={formData.other_terms}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount %</label>
                      <input
                        type="number"
                        step="0.01"
                        name="discount_percent"
                        value={formData.discount_percent}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Settlement Days</label>
                      <input
                        type="number"
                        name="settlement_days"
                        value={formData.settlement_days}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        name="mark_as_confirmation_order"
                        checked={formData.mark_as_confirmation_order}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700">Mark as Confirmation Order</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reload
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditPurchaseOrder;
