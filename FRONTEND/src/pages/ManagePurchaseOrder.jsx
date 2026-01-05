import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, FileText, Edit, Eye, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const PurchaseOrderManage = () => {

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
      if (!hasPermission("Manage Purchase Order")) {
        return navigate("/UserUnAuthorized/Manage Purchase Order");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Fetch purchase orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/purchase-order`);
        if (!res.ok) throw new Error('Failed to fetch purchase orders');
        const data = await res.json();
        setPurchaseOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load purchase orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter purchase orders based on search term and status
  useEffect(() => {
    let filtered = [...purchaseOrders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(po =>
        po._id.toLowerCase().includes(term) ||
        po.supplier_id?.supplierName?.toLowerCase().includes(term) ||
        po.company_id?.company_name?.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, purchaseOrders]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col mb-6">
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Purchase Orders</h1>
                <p className="text-xs sm:text-sm text-gray-500">View, search, and manage purchase orders</p>
              </div>
              <div className={`block sm:flex flex-col sm:flex-row gap-3`}>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ID, Supplier, Company..."
                      className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <Link
                    to="/add-purchase-order"
                    className="flex items-center justify-center px-4 py-2 text-sm bg-red-600 rounded-md text-white hover:bg-red-700 transition whitespace-nowrap"
                  >
                    <FileText size={16} className="mr-2" />
                    <span className="font-semibold">Create PO</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <>
                {/* Purchase Orders Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                  {/* Desktop Table */}
                  <table className="hidden md:table min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((po) => (
                        <React.Fragment key={po._id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{po.PurchaseOrderNumber}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{po.company_id?.company_name || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{po.supplier_id?.supplierName || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{po.placed_by?.firstname + " " + po.placed_by?.lastname || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(po.date).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 flex justify-center">
                              <Link
                                to={`/purchase-orders/view/${po._id}`}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                to={`/purchase-orders/edit/${po._id}`}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => toggleExpand(po._id)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title={expandedOrder === po._id ? 'Collapse Details' : 'Expand Details'}
                              >
                                {expandedOrder === po._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedOrder === po._id && (
                            <tr>
                              <td colSpan="7" className="bg-gray-50 p-4 text-sm text-gray-700">
                                <div>
                                  <strong>Delivery Address:</strong> {po.delivery_address || 'N/A'}
                                </div>
                                <div>
                                  <strong>Notes:</strong> {po.notes || 'None'}
                                </div>
                                <div>
                                  <strong>Total Amount:</strong> ₹{po.total_amount?.toFixed(2) || '0.00'}
                                </div>
                                <div>
                                  <strong>GST Inclusive:</strong> ₹{po.gst_inclusive?.toFixed(2) || '0.00'}
                                </div>
                                <div>
                                  <strong>Gross Amount:</strong> ₹{po.gross_amount?.toFixed(2) || '0.00'}
                                </div>
                                <div className="mt-2">
                                  <strong>Products:</strong>
                                  <ul className="list-disc list-inside">
                                    {po.products?.map((product) => (
                                      <li key={product.product_id}>
                                        {product.product_name} - Qty: {product.quantity} - Price: ₹{product.price.toFixed(2)}
                                      </li>
                                    )) || <li>No products listed</li>}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">No purchase orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="md:hidden">
                    {paginatedOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No purchase orders found.</div>
                    ) : (
                      paginatedOrders.map((po) => (
                        <div key={po._id} className="border-b border-gray-200 last:border-b-0 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-blue-600">{po.PurchaseOrderNumber}</div>
                              <div className="text-sm text-gray-700 mt-1">{po.company_id?.company_name || 'N/A'}</div>
                              <div className="text-sm text-gray-700">{po.supplier_id?.supplierName || 'N/A'}</div>
                            </div>
                            <div className="flex">
                              <button
                                onClick={() => toggleExpand(po._id)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title={expandedOrder === po._id ? 'Collapse Details' : 'Expand Details'}
                              >
                                {expandedOrder === po._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <Link
                                to={`/purchase-orders/view/${po._id}`}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                to={`/purchase-orders/edit/${po._id}`}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div className="text-sm text-gray-500">{new Date(po.date).toLocaleDateString()}</div>

                          </div>

                          <div className="text-sm text-gray-700 mt-1">By: {po.placed_by?.firstname + " " + po.placed_by?.lastname || 'N/A'}</div>

                          {expandedOrder === po._id && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                              <div>
                                <strong>Delivery Address:</strong> {po.delivery_address || 'N/A'}
                              </div>
                              <div className="mt-1">
                                <strong>Notes:</strong> {po.notes || 'None'}
                              </div>
                              <div className="mt-1">
                                <strong>Total Amount:</strong> ₹{po.total_amount?.toFixed(2) || '0.00'}
                              </div>
                              <div>
                                <strong>GST Inclusive:</strong> ₹{po.gst_inclusive?.toFixed(2) || '0.00'}
                              </div>
                              <div>
                                <strong>Gross Amount:</strong> ₹{po.gross_amount?.toFixed(2) || '0.00'}
                              </div>
                              <div className="mt-2">
                                <strong>Products:</strong>
                                <ul className="list-disc list-inside pl-3">
                                  {po.products?.map((product) => (
                                    <li key={product.product_id}>
                                      {product.product_name} - Qty: {product.quantity} - Price: ₹{product.price.toFixed(2)}
                                    </li>
                                  )) || <li>No products listed</li>}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                    <div className="text-sm text-gray-500">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{' '}
                      <span className="font-medium">{filteredOrders.length}</span> purchase orders
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded-md text-sm ${currentPage === page ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PurchaseOrderManage;