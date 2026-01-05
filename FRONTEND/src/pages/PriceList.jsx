import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";

const PriceList = () => {
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
      if (!hasPermission("Manage Stock")) {
        return navigate("/UserUnAuthorized/Manage Stock");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedFilters, setSelectedFilters] = useState({
    manufacturer: '',
    productGroup: '',
    unit: '',
    obsolete: 'all'
  });
  const [showMore, setShowMore] = useState({}); // Changed to object keyed by product id

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Sorting logic
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = React.useMemo(() => {
    if (!sortConfig.key) return products;
    // If nested key (e.g. manufacturer.name)
    const getValue = (obj, key) => key.split('.').reduce((o, i) => o ? o[i] : '', obj);
    return [...products].sort((a, b) => {
      const aValue = getValue(a, sortConfig.key)?.toString().toLowerCase() || '';
      const bValue = getValue(b, sortConfig.key)?.toString().toLowerCase() || '';
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [products, sortConfig]);

  // Filtering logic
  const filteredProducts = sortedProducts.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.specifications && product.specifications.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilters =
      (selectedFilters.unit === '' || product.unit === selectedFilters.unit) &&
      (selectedFilters.obsolete === 'all' ||
        (selectedFilters.obsolete === 'active' && !product.obsolete_product) ||
        (selectedFilters.obsolete === 'obsolete' && product.obsolete_product));
    return matchesSearch && matchesFilters;
  });

  // CSV Download
  const downloadCSV = () => {
    const headers = [
      'Product Code', 'Product Name', 'HSN No', 'SAC No',
      'Unit', 'GST', 'Purchase Cost', 'Standard Sale', 'Installation Sale',
      'Manufacturer', 'Specifications', 'Obsolete'
    ];
    const csvData = filteredProducts.map(product => [
      product.product_code,
      product.product_name,
      product.HSN_No || 'N/A',
      product.SAC_NO || 'N/A',
      product.unit,
      product.GST || 'N/A',
      product.purchase_cost || 'N/A',
      product.standard_sale || 'N/A',
      product.installation_sale || 'N/A',
      product.manufacturer?.name || 'N/A',
      product.specifications || 'N/A',
      product.obsolete_product ? 'Yes' : 'No'
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product_price_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort indicator
  const renderSortDirection = (key) => {
    if (sortConfig.key !== key) return (
      <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
      </svg>
    );
    return (
      <svg className={`w-4 h-4 ml-1 text-blue-600`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d={sortConfig.direction === 'ascending' ? "M8 15l4-4 4 4" : "M8 9l4 4 4-4"}></path>
      </svg>
    );
  };

  // Product Card (Grid view)
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden">
      <div className="aspect-w-16 aspect-h-9 bg-gray-50 relative">
        {product.upload_image ? (
          <img
            src={import.meta.env.VITE_UPLOAD_URL + "/" + product.upload_image}
            alt={product.product_name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
        {product.obsolete_product && (
          <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
            Obsolete
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{product.product_name}</h3>
            <p className="text-sm text-gray-500 font-mono">{product.product_code}</p>
          </div>
        </div>
        {product.specifications && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.specifications}</p>
        )}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Unit</p>
            <p className="font-medium text-gray-900">{product.unit}</p>
          </div>
          {product.GST && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">GST</p>
              <p className="font-medium text-gray-900">{product.GST}%</p>
            </div>
          )}
          {product.HSN_No && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">HSN No</p>
              <p className="font-medium text-gray-900">{product.HSN_No}</p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between items-center">
            <div>
              {product.standard_sale && (
                <div>
                  <p className="text-xs text-gray-500">Standard Sale</p>
                  <p className="font-bold text-lg text-green-600">₹{product.standard_sale.toLocaleString()}</p>
                </div>
              )}
            </div>
            {product.purchase_cost && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Purchase Cost</p>
                <p className="font-medium text-gray-900">₹{product.purchase_cost.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
          <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading products...</span>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Catalog</h1>
                <p className="text-gray-600">Manage and view your complete product inventory</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {/* Grid icon */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {/* Table icon */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                    </svg>
                  </button>
                </div>
                <button
                  onClick={downloadCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                <input
                  type="text"
                  placeholder="Search by name, code, or specs..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedFilters.unit}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, unit: e.target.value })}
                >
                  <option value="">All Units</option>
                  <option value="Numbers">Numbers</option>
                  <option value="KGS">KGS</option>
                  <option value="LOT">LOT</option>
                  <option value="METERS">METERS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedFilters.obsolete}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, obsolete: e.target.value })}
                >
                  <option value="all">All Products</option>
                  <option value="active">Active Only</option>
                  <option value="obsolete">Obsolete Only</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilters({ manufacturer: '', productGroup: '', unit: '', obsolete: 'all' });
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredProducts.length}</span> of <span className="font-semibold">{products.length}</span> products
            </p>
          </div>

          {/* Content */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}

              {/* Table View - Show only on md+ screens */}
              {viewMode === 'table' && (
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800 cursor-pointer" onClick={() => handleSort('product_code')}>
                          Code {renderSortDirection('product_code')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800 cursor-pointer" onClick={() => handleSort('product_name')}>
                          Name {renderSortDirection('product_name')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">Specs</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">Unit</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">HSN</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">GST</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800 cursor-pointer" onClick={() => handleSort('purchase_cost')}>
                          Purchase {renderSortDirection('purchase_cost')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800 cursor-pointer" onClick={() => handleSort('standard_sale')}>
                          Sale {renderSortDirection('standard_sale')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-gray-700">{product.product_code}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {product.specifications && product.specifications.length > 60 ? (
                              <>
                                <span>
                                  {showMore[product._id]
                                    ? product.specifications
                                    : product.specifications.substring(0, 60) + '...'}
                                </span>
                                <button
                                  onClick={() =>
                                    setShowMore(s => ({ ...s, [product._id]: !s[product._id] }))
                                  }
                                  className="ml-2 text-xs text-blue-600 hover:underline"
                                >
                                  {showMore[product._id] ? 'Show less' : 'More'}
                                </button>
                              </>
                            ) : (
                              product.specifications
                            )}
                          </td>
                          <td className="px-4 py-3">{product.unit}</td>
                          <td className="px-4 py-3">{product.HSN_No || 'N/A'}</td>
                          <td className="px-4 py-3">{product.GST ? `${product.GST}%` : 'N/A'}</td>
                          <td className="px-4 py-3">{product.purchase_cost ? `₹${product.purchase_cost.toLocaleString()}` : 'N/A'}</td>
                          <td className="px-4 py-3">{product.standard_sale ? `₹${product.standard_sale.toLocaleString()}` : 'N/A'}</td>
                          <td className="px-4 py-3">
                            {product.obsolete_product ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">Obsolete</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table view for mobile (unchanged except for showMore fix) */}
              <div className="block md:hidden divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="p-4 flex gap-4 hover:bg-gray-50 transition">
                    <div className="h-20 w-20 flex-shrink-0">
                      {product.upload_image ? (
                        <img
                          className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                          src={import.meta.env.VITE_UPLOAD_URL + "/" + product.upload_image}
                          alt={product.product_name}
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{product.product_name}</h3>
                      {product.specifications && (
                        <p className={`text-sm text-gray-500 ${showMore[product._id] ? "" : "line-clamp-2"}`}>
                          {showMore[product._id] ? product.specifications : product.specifications.slice(0, 60) + (product.specifications.length > 60 ? "..." : "")}
                        </p>
                      )}
                      {product.specifications && product.specifications.length > 60 && (
                        <button
                          onClick={() =>
                            setShowMore((s) => ({ ...s, [product._id]: !s[product._id] }))
                          }
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          {showMore[product._id] ? "Show less" : "More"}
                        </button>
                      )}
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Code:</span> {product.product_code}</div>
                        <div><span className="font-medium">Unit:</span> {product.unit}</div>
                        {product.HSN_No && <div><span className="font-medium">HSN:</span> {product.HSN_No}</div>}
                        {product.GST && <div><span className="font-medium">GST:</span> {product.GST}%</div>}
                        <div><span className="font-medium">Purchase:</span> {product.purchase_cost ? `₹${product.purchase_cost.toLocaleString()}` : 'N/A'}</div>
                        <div><span className="font-medium">Sale:</span> {product.standard_sale ? `₹${product.standard_sale.toLocaleString()}` : 'N/A'}</div>
                      </div>
                      <div className="mt-2">
                        {product.obsolete_product ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Obsolete</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PriceList;
