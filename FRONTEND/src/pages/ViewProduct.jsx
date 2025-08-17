import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPackage, FiDollarSign, FiFileText, FiTruck, FiClock } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ViewProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
                const data = await response.json();
                
                if (response.ok) {
                    setProduct(data.data);
                } else {
                    throw new Error('Failed to fetch product');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                toast.error('Failed to load product data');
                navigate('/manage-products');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="flex justify-center items-center h-64">
                            <p>Loading product details...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                        <div className="flex justify-center items-center h-64">
                            <p>Product not found</p>
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
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => navigate('/manage/product-code')}
                                className="flex items-center text-gray-600 hover:text-gray-800"
                            >
                                <FiArrowLeft className="mr-2" />
                                <span>Back to Products</span>
                            </button>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigate(`/edit-product/${id}`)}
                                    className="flex items-center px-3 py-1 text-sm bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
                                >
                                    <FiEdit2 className="mr-2" />
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Product Title */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">{product.product_name}</h1>
                            <p className="text-gray-600">{product.product_code}</p>
                        </div>

                        {/* Main Product Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Basic Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Basic Information Card */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                                        <FiPackage className="text-blue-600 mr-3" />
                                        <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Product Code</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.product_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Product Name</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.product_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">HSN No</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.HSN_No || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">SAC No</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.SAC_NO || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Manufacturer</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.manufacturer?.name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Product Group</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.product_group?.name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Unit</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.unit || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Units</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.units || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Unit Description</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.unit_description || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Specifications</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.specifications || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Specifications Card */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                                        <FiFileText className="text-blue-600 mr-3" />
                                        <h2 className="text-lg font-semibold text-gray-800">Specifications</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Basic Specification</p>
                                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                                {product.basic_specification_text || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Detailed Specification</p>
                                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                                {product.detailed_specification_text || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Pricing and Supplier */}
                            <div className="space-y-6">
                                {/* Pricing Card */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                                        <div className="text-blue-600 mr-3 text-xl font-medium">₹</div>
                                        <h2 className="text-lg font-semibold text-gray-800">Pricing Information</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">GST %</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.GST || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Installation GST %</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.installation_GST || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Purchase Cost</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.purchase_cost || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Average Cost</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.average_cost || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Standard Cost</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.standard_cost || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Standard Sale</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.standard_sale || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Installation Sale</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.installation_sale || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Maintenance Sale</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.maintenance_sale || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Other Sale</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.other_sale || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Information Card */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                                        <FiClock className="text-blue-600 mr-3" />
                                        <h2 className="text-lg font-semibold text-gray-800">Time Information</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Labour Hours</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.labour_hours || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Maintenance Hours</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.maintenance_hours || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Commission Hours</p>
                                            <p className="mt-1 text-sm text-gray-900">{product.commission_hours || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Card */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                                        <FiTruck className="text-blue-600 mr-3" />
                                        <h2 className="text-lg font-semibold text-gray-800">Supplier Information</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Preferred Supplier</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.preferred_supplier.supplierName || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Supplier Code</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.preferred_supplier?.supplierCode || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Product Status</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {product.obsolete_product ? 'Obsolete' : 'Active'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Image Section */}
                        {product.upload_image && (
                            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">Product Image</h2>
                                </div>
                                <div className="p-6 flex justify-center">
                                    <img
                                        src={import.meta.env.VITE_API_URL + "/" + product.upload_image}
                                        alt={product.product_name}
                                        className="max-h-64 object-contain rounded"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewProduct;