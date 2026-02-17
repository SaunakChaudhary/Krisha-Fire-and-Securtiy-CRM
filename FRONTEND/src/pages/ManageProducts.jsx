import React, { useState, useEffect, useContext } from 'react';
import { FiPlus, FiSearch, FiFilter, FiX, FiEye, FiEdit } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";
import { Upload } from 'lucide-react';
import { useRef } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const ManageProducts = () => {
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
            if (!hasPermission("Manage System Code")) {
                return navigate("/UserUnAuthorized/Manage Product Code");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [productGroups, setProductGroups] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch products and product groups
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch products
                const productsResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/products`
                );
                const productsData = await productsResponse.json();
                setProducts(productsData.data || []);
                setFilteredProducts(productsData.data || []);

                // Fetch product groups
                const pgResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/reference-codes/category/productGroup`
                );
                const pgData = await pgResponse.json();
                setProductGroups(pgData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                setProducts([]);
                setFilteredProducts([]);
                setProductGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter products based on search term and selected group
    useEffect(() => {
        let result = products;

        if (searchTerm) {
            result = result.filter(product =>
                (product.product_code && product.product_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.product_name && product.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedGroup) {
            result = result.filter(product =>
                product.product_group && product.product_group._id === selectedGroup
            );
        }

        setFilteredProducts(result);
    }, [searchTerm, selectedGroup, products]);

    const handleAddProduct = () => {
        navigate('/product-code');
    };

    const handleEditProduct = (productId) => {
        navigate(`/edit-product/${productId}`);
    };

    const handleViewDetails = (productId) => {
        navigate(`/view-product/${productId}`)
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGroup('');
    };
    const fileInputRef = useRef(null);

    const parseExcelToProducts = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                    const products = rows.map((row, index) => ({
                        product_code: String(row.product_code).trim(),
                        product_name: String(row.product_name).trim(),
                        HSN_No: row.HSN_No || null,
                        SAC_NO: row.SAC_NO || null,

                        // reference codes (NOT ObjectIds)
                        manufacturer_code: row.manufacturer_code || null,
                        product_group_code: row.product_group_code || null,
                        preferred_supplier_code: row.preferred_supplier_code || null,

                        specifications: row.specifications || null,
                        unit: row.unit, // must match enum
                        GST: Number(row.GST) || 0,
                        installation_GST: Number(row.installation_GST) || 0,

                        obsolete_product:
                            String(row.obsolete_product).toLowerCase() === "true",

                        units: Number(row.units) || 0,
                        unit_description: row.unit_description || null,

                        purchase_cost: Number(row.purchase_cost) || 0,
                        average_cost: Number(row.average_cost) || 0,
                        standard_cost: Number(row.standard_cost) || 0,

                        standard_sale: Number(row.standard_sale) || 0,
                        installation_sale: Number(row.installation_sale) || 0,
                        maintenance_sale: Number(row.maintenance_sale) || 0,
                        other_sale: Number(row.other_sale) || 0,

                        labour_hours: Number(row.labour_hours) || 0,
                        maintenance_hours: Number(row.maintenance_hours) || 0,
                        commission_hours: Number(row.commission_hours) || 0,

                        basic_specification_text: row.basic_specification_text || null,
                        detailed_specification_text: row.detailed_specification_text || null,

                        upload_image: "", // explicitly blank
                        __row: index + 2, // Excel row number (for error reporting)
                    }));

                    resolve(products);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async(e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);

        try {
            const products = await parseExcelToProducts(file);

            // OPTIONAL: frontend validation
            if (!products.length) {
                alert("Excel is empty");
                return;
            }
            console.log(products);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/products/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products }),
            });

            const result = await res.json();
            toast.success(result.message);
        } catch (err) {
            console.error(err);
            alert("Excel parsing failed");
        } finally {
            setLoading(false);
        }
    };


    const handleButtonClick = () => {
        fileInputRef.current.click();
    };


    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-7xl mx-auto p-2 sm:p-4">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                            <div className="mb-2 sm:mb-0">
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Manage Products</h1>
                                <p className="text-xs sm:text-sm text-gray-500">View and manage all products</p>
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={handleAddProduct}
                                    className="flex items-center px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition"
                                >
                                    <FiPlus size={14} className="mr-1 sm:mr-2" />
                                    <span className="whitespace-nowrap">Add New Product</span>
                                </button>
                                <div>
                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {/* Visible Button */}
                                    <button
                                        type="button"
                                        onClick={handleButtonClick}
                                        disabled={loading}
                                        className="rounded border border-blue-700 bg-blue-600 px-4 py-1.5
                   text-sm font-medium text-white
                   hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                    >
                                        {loading ? "Importing..." : "Import Products"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                {/* Search by product code/name */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Search by Code/Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiSearch className="text-gray-400" size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter product code or name"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 sm:pl-10 w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Filter by product group */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Filter by Product Group
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiFilter className="text-gray-400" size={14} />
                                        </div>
                                        <select
                                            value={selectedGroup}
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                            className="pl-8 sm:pl-10 w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        >
                                            <option value="">All Product Groups</option>
                                            {productGroups.map(group => (
                                                <option key={group._id} value={group._id}>{group.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Clear filters button */}
                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition w-full justify-center"
                                    >
                                        <FiX size={14} className="mr-1 sm:mr-2" />
                                        <span>Clear Filters</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-4 sm:p-8 text-center">
                                    <p>Loading products...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-4 sm:p-8 text-center">
                                    <p>No products found. {searchTerm || selectedGroup ? 'Try changing your filters.' : ''}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    {/* Desktop Table */}
                                    <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                    Product Code
                                                </th>
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                    Product Name
                                                </th>
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                    Product Group
                                                </th>
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredProducts.map((product) => (
                                                <React.Fragment key={product._id}>
                                                    <tr className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                            {product.product_code}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                            {product.product_name}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                                            {product.product_group?.name || '-'}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium space-x-2">
                                                            <button
                                                                onClick={() => handleViewDetails(product._id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="View Details"
                                                            >
                                                                <FiEye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditProduct(product._id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Edit"
                                                            >
                                                                <FiEdit size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile Cards */}
                                    <div className="sm:hidden space-y-3 p-2">
                                        {filteredProducts.map((product) => (
                                            <div key={product._id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-sm">{product.product_code}</p>
                                                        <p className="text-gray-600 text-sm">{product.product_name}</p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Group: {product.product_group?.name || '-'}
                                                        </p>
                                                    </div>
                                                    <div className='flex gap-3'>
                                                        <button
                                                            onClick={() => handleEditProduct(product._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Edit"
                                                        >
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewDetails(product._id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <FiEye size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageProducts;