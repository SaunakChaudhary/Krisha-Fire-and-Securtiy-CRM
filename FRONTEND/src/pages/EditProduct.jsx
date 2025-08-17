import React, { useState, useEffect } from 'react';
import { FiUpload, FiX, FiCheck, FiChevronDown, FiChevronUp, FiPackage, FiDollarSign, FiClock, FiFileText, FiTruck } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        prices: false,
        specifications: false,
        supplier: false,
        image: false
    });

    const [formData, setFormData] = useState({
        product_code: '',
        product_name: '',
        HSN_No: '',
        SAC_NO: '',
        manufacturer: '',
        specifications: '',
        unit: '',
        GST: '',
        installation_GST: '',
        product_group: '',
        obsolete_product: false,
        preferred_supplier: '',
        units: '',
        unit_description: '',
        purchase_cost: '',
        average_cost: '',
        standard_cost: '',
        standard_sale: '',
        installation_sale: '',
        maintenance_sale: '',
        other_sale: '',
        labour_hours: '',
        maintenance_hours: '',
        commission_hours: '',
        basic_specification_text: '',
        detailed_specification_text: '',
    });

    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [manufacturers, setManufacturers] = useState([]);
    const [productGroups, setProductGroups] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch product data and related options
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch product data
                const productResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/products/${id}`
                );
                const productData = await productResponse.json();

                if (productResponse.ok) {
                    setFormData({
                        ...productData.data,
                        manufacturer: productData.data.manufacturer?._id || '',
                        product_group: productData.data.product_group?._id || '',
                        preferred_supplier: productData.data.preferred_supplier?._id || ''
                    });

                    if (productData.data.imageUrl) {
                        setImagePreview(productData.data.imageUrl);
                    }
                } else {
                    throw new Error('Failed to fetch product');
                }

                // Fetch manufacturers
                const manuResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reference-codes/category/ManufacturerCode`
                );
                const manuData = await manuResponse.json();
                setManufacturers(manuData || []);

                // Fetch product groups
                const pgResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reference-codes/category/productGroup`
                );
                const pgData = await pgResponse.json();
                setProductGroups(pgData || []);

                // Fetch suppliers
                const supplierResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/supplier`
                );
                const supplierData = await supplierResponse.json();
                setSuppliers(supplierData.data || []);

            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load product data');
                navigate('/manage/product-code');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.product_code.trim()) newErrors.product_code = 'Product Code is required';
        if (!formData.product_name.trim()) newErrors.product_name = 'Product Name is required';
        if (!formData.unit) newErrors.unit = 'Unit is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const formDataToSend = new FormData();

        // Append all fields except the image
        for (const key in formData) {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        }

        // Handle image conditionally
        if (imageFile) {
            formDataToSend.append('upload_image', imageFile);
        }


        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Something went wrong!');
                return;
            }

            toast.success('Product updated successfully!');
            navigate('/manage/product-code');

        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/manage/product-code');
    };

    const sectionStatus = {
        basic: formData.product_code !== '' && formData.product_name !== '' && formData.unit !== '',
        prices: formData.GST !== '' || formData.installation_GST !== '' ||
            formData.purchase_cost !== '' || formData.average_cost !== '' || formData.standard_cost !== '' ||
            formData.standard_sale !== '' || formData.installation_sale !== '' || formData.maintenance_sale !== '' || formData.other_sale !== '' ||
            formData.labour_hours !== '' || formData.maintenance_hours !== '' || formData.commission_hours !== '',
        specifications: formData.basic_specification_text !== '' || formData.detailed_specification_text !== '',
        supplier: formData.preferred_supplier !== '' || formData.obsolete_product,
        image: imagePreview !== ''
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="max-w-7xl mx-auto p-4">
                            <div className="flex justify-center items-center h-64">
                                <p>Loading product data...</p>
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
                    <div className="max-w-7xl mx-auto p-4">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Product</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Edit the details of product: {formData.product_code}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <FiX size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    form="product-form"
                                    className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <FiCheck size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Update Product</span>
                                    <span className="sm:hidden">Update</span>
                                </button>
                            </div>
                        </div>

                        {/* Form Sections */}
                        <form id="product-form" className="space-y-4" onSubmit={onSubmit}>
                            {/* Basic Information Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('basic')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <FiPackage className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Basic Information
                                        </h2>
                                        {sectionStatus.basic && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.basic ? (
                                        <FiChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <FiChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.basic ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Code*</label>
                                            <input
                                                name="product_code"
                                                value={formData.product_code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            />
                                            {errors.product_code && <span className="text-red-500 text-xs">{errors.product_code}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                                            <input
                                                name="product_name"
                                                value={formData.product_name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            />
                                            {errors.product_name && <span className="text-red-500 text-xs">{errors.product_name}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">HSN No</label>
                                            <input
                                                name="HSN_No"
                                                value={formData.HSN_No}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">SAC No</label>
                                            <input
                                                name="SAC_NO"
                                                value={formData.SAC_NO}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                                            <select
                                                name="manufacturer"
                                                value={formData.manufacturer}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Manufacturer</option>
                                                {manufacturers.map(manu => (
                                                    <option key={manu._id} value={manu._id}>{manu.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Group</label>
                                            <select
                                                name="product_group"
                                                value={formData.product_group}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Product Group</option>
                                                {productGroups.map(group => (
                                                    <option key={group._id} value={group._id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unit*</label>
                                            <select
                                                name="unit"
                                                value={formData.unit}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Select Unit</option>
                                                <option value="Numbers">Numbers</option>
                                                <option value="KGS">KGS</option>
                                                <option value="LOT">LOT</option>
                                                <option value="METERS">METERS</option>
                                            </select>
                                            {errors.unit && <span className="text-red-500 text-xs">{errors.unit}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Units</label>
                                            <input
                                                type="number"
                                                name="units"
                                                value={formData.units}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unit Description</label>
                                            <input
                                                name="unit_description"
                                                value={formData.unit_description}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Specifications</label>
                                            <input
                                                name="specifications"
                                                value={formData.specifications}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Combined Prices Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('prices')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <div className="text-red-600 mr-3 font-semibold text-xl">₹</div>
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Prices
                                        </h2>
                                        {sectionStatus.prices && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.prices ? (
                                        <FiChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <FiChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.prices ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 space-y-6">
                                        {/* Tax Information */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tax Information</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST %</label>
                                                        <input
                                                            type="number"
                                                            name="GST"
                                                            value={formData.GST}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Installation GST %</label>
                                                        <input
                                                            type="number"
                                                            name="installation_GST"
                                                            value={formData.installation_GST}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost Information */}
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Cost Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
                                                    <input
                                                        type="number"
                                                        name="purchase_cost"
                                                        value={formData.purchase_cost}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Average Cost</label>
                                                    <input
                                                        type="number"
                                                        name="average_cost"
                                                        value={formData.average_cost}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Standard Cost</label>
                                                    <input
                                                        type="number"
                                                        name="standard_cost"
                                                        value={formData.standard_cost}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sales Information */}
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Sales Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Standard Sale</label>
                                                    <input
                                                        type="number"
                                                        name="standard_sale"
                                                        value={formData.standard_sale}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Installation Sale</label>
                                                    <input
                                                        type="number"
                                                        name="installation_sale"
                                                        value={formData.installation_sale}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Maintenance Sale</label>
                                                    <input
                                                        type="number"
                                                        name="maintenance_sale"
                                                        value={formData.maintenance_sale}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Other Sale</label>
                                                    <input
                                                        type="number"
                                                        name="other_sale"
                                                        value={formData.other_sale}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Information */}
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Time Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Labour Hours</label>
                                                    <input
                                                        type="number"
                                                        name="labour_hours"
                                                        value={formData.labour_hours}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Maintenance Hours</label>
                                                    <input
                                                        type="number"
                                                        name="maintenance_hours"
                                                        value={formData.maintenance_hours}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Commission Hours</label>
                                                    <input
                                                        type="number"
                                                        name="commission_hours"
                                                        value={formData.commission_hours}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Specifications Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('specifications')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <FiFileText className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Specifications
                                        </h2>
                                        {sectionStatus.specifications && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.specifications ? (
                                        <FiChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <FiChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.specifications ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Basic Specification Text</label>
                                            <textarea
                                                name="basic_specification_text"
                                                value={formData.basic_specification_text}
                                                onChange={handleInputChange}
                                                rows={5}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Detailed Specification Text</label>
                                            <textarea
                                                name="detailed_specification_text"
                                                value={formData.detailed_specification_text}
                                                onChange={handleInputChange}
                                                rows={5}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Supplier & Status Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('supplier')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <FiTruck className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Supplier & Status
                                        </h2>
                                        {sectionStatus.supplier && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.supplier ? (
                                        <FiChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <FiChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.supplier ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Preferred Supplier</label>
                                            <select
                                                name="preferred_supplier"
                                                value={formData.preferred_supplier}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                                            >
                                                <option value="">Select Preferred Supplier</option>
                                                {suppliers.map(supplier => (
                                                    <option key={supplier._id} value={supplier._id}>{supplier.supplierCode + " - " + supplier.supplierName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="obsolete_product"
                                                checked={formData.obsolete_product}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-xs sm:text-sm text-gray-700">Obsolete Product</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('image')}
                                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center">
                                        <FiUpload className="text-red-600 mr-3" size={18} />
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                                            Product Image
                                        </h2>
                                        {sectionStatus.image && (
                                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    {expandedSections.image ? (
                                        <FiChevronUp size={18} className="text-gray-500" />
                                    ) : (
                                        <FiChevronDown size={18} className="text-gray-500" />
                                    )}
                                </button>

                                <div className={`transition-all duration-300 overflow-hidden ${expandedSections.image ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 sm:p-6">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer">
                                                <FiUpload className="mr-2" size={14} />
                                                {imagePreview ? 'Change Image' : 'Upload Image'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                            {imagePreview && (
                                                <div className="relative">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Product preview"
                                                        className="h-16 w-16 object-cover rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                    >
                                                        <FiX size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {imagePreview && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                {imageFile ? 'New image will be uploaded' : 'Current product image'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Update Product
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditProduct;