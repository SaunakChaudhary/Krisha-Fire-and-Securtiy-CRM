import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  Edit,
  Calendar,
  Phone,
  MapPin,
  User,
  Building,
  Truck,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";

const ViewPurchaseOrderDetails = () => {
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

  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-order/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch purchase order');
        }

        const data = await response.json();
        setPurchaseOrder(data);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        toast.error('Failed to load purchase order details');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Purchase Order Not Found</h2>
          <Link to="/purchase-orders" className="text-red-600 hover:underline mt-2 inline-block">
            Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 print:ml-0">
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <Link
                    to="/manage-purchase-order"
                    className="mr-3 p-1 rounded-md hover:bg-gray-100 text-gray-600"
                  >
                    <ArrowLeft size={20} />
                  </Link>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                      Purchase Order: {purchaseOrder.PurchaseOrderNumber}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      Created on {new Date(purchaseOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    <Printer size={16} className="mr-1" />
                    Print
                  </button>
                  <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
                    <Download size={16} className="mr-1" />
                    Download
                  </button>
                  <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
                    <Mail size={16} className="mr-1" />
                    Email
                  </button>
                  <Link
                    to={`/purchase-orders/edit/${purchaseOrder._id}`}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'details' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Order Details
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'products' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Products ({purchaseOrder.products?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'delivery' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Delivery Info
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Company Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Building size={16} className="mr-1" />
                      Company
                    </h3>
                    <p className="font-medium text-gray-800">
                      {purchaseOrder.company_id?.company_name || 'N/A'}
                    </p>
                    {purchaseOrder.company_id?.address && (
                      <p className="text-sm text-gray-600 mt-1">{purchaseOrder.company_id.address}</p>
                    )}
                  </div>

                  {/* Supplier Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <User size={16} className="mr-1" />
                      Supplier
                    </h3>
                    <p className="font-medium text-gray-800">
                      {purchaseOrder.supplier_id?.supplierName || 'N/A'}
                    </p>
                    {purchaseOrder.supplier_id?.contactNumber && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <Phone size={14} className="mr-1" />
                        {purchaseOrder.supplier_id.contactNumber}
                      </p>
                    )}
                    {purchaseOrder.supplier_id?.address && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {purchaseOrder.supplier_id.address}
                      </p>
                    )}
                  </div>

                  {/* Order Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <FileText size={16} className="mr-1" />
                      Order Information
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Placed By</p>
                        <p className="text-sm font-medium">{purchaseOrder.placed_by.firstname + " " + purchaseOrder.placed_by.lastname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Order Date</p>
                        <p className="text-sm font-medium flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(purchaseOrder.date).toLocaleDateString()}
                        </p>
                      </div>
                      {purchaseOrder.due_date && (
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium">
                            {new Date(purchaseOrder.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {purchaseOrder.settlement_days > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Settlement Days</p>
                          <p className="text-sm font-medium">{purchaseOrder.settlement_days} days</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(purchaseOrder.total_amount)}</span>
                      </div>
                      {purchaseOrder.discount_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Discount ({purchaseOrder.discount_percent}%):</span>
                          <span className="font-medium text-green-600">
                            -{formatCurrency(purchaseOrder.total_amount * (purchaseOrder.discount_percent / 100))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">GST Inclusive:</span>
                        <span className="font-medium">{formatCurrency(purchaseOrder.gst_inclusive)}</span>
                      </div>
                      {purchaseOrder.gst_adjust !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">GST Adjustment:</span>
                          <span className={`font-medium ${purchaseOrder.gst_adjust > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {purchaseOrder.gst_adjust > 0 ? '+' : ''}{formatCurrency(purchaseOrder.gst_adjust)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-800">Gross Amount:</span>
                        <span className="font-bold text-lg">{formatCurrency(purchaseOrder.gross_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {purchaseOrder.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                      <p className="text-sm text-gray-700">{purchaseOrder.notes}</p>
                    </div>
                  )}

                  {/* Other Terms */}
                  {purchaseOrder.other_terms && (
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Other Terms</h3>
                      <p className="text-sm text-gray-700">{purchaseOrder.other_terms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Products Tab */}
              {activeTab === "products" && (
                <div>
                  {/* Desktop / Tablet Table */}
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
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Discount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GST %
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseOrder.products?.map((product, index) => (
                          <tr key={index}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.product_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {product.description || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {product.manufacturer || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {product.quantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {product.discount
                                ? formatCurrency(product.discount)
                                : "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {product.gst_percent}%
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(product.total_amount)}
                            </td>
                          </tr>
                        ))}
                        {(!purchaseOrder.products ||
                          purchaseOrder.products.length === 0) && (
                            <tr>
                              <td
                                colSpan="8"
                                className="px-4 py-4 text-center text-sm text-gray-500"
                              >
                                No products found in this purchase order
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="sm:hidden space-y-4">
                    {purchaseOrder.products?.length > 0 ? (
                      purchaseOrder.products.map((product, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white"
                        >
                          <div className="flex justify-between mb-2">
                            <h3 className="font-medium text-sm text-gray-900">
                              {product.product_name}
                            </h3>
                            <span className="text-sm font-bold text-gray-700">
                              {formatCurrency(product.total_amount)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <p>
                              <span className="font-medium">Desc: </span>
                              {product.description || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Mfg: </span>
                              {product.manufacturer || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Qty: </span>
                              {product.quantity}
                            </p>
                            <p>
                              <span className="font-medium">Price: </span>
                              {formatCurrency(product.price)}
                            </p>
                            <p>
                              <span className="font-medium">Discount: </span>
                              {product.discount
                                ? formatCurrency(product.discount)
                                : "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">GST: </span>
                              {product.gst_percent}%
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white">
                        No products found in this purchase order
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Tab */}
              {activeTab === 'delivery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery Address */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <MapPin size={16} className="mr-1" />
                      Delivery Address
                    </h3>
                    {purchaseOrder.deliver_to_store ? (
                      <p className="font-medium">Deliver to company store</p>
                    ) : purchaseOrder.deliver_to ? (
                      <div>
                        <p className="font-medium">
                          {purchaseOrder.deliver_to.name || 'Customer'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {purchaseOrder.delivery_address || purchaseOrder.deliver_to.address}
                        </p>
                        {purchaseOrder.deliver_to.phone && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            <Phone size={14} className="mr-1" />
                            {purchaseOrder.deliver_to.phone}
                          </p>
                        )}
                      </div>
                    ) : purchaseOrder.delivery_address ? (
                      <p className="text-sm text-gray-700">{purchaseOrder.delivery_address}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No delivery address specified</p>
                    )}
                  </div>

                  {/* Delivery Instructions */}
                  {purchaseOrder.delivery_instructions && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Instructions</h3>
                      <p className="text-sm text-gray-700">{purchaseOrder.delivery_instructions}</p>
                    </div>
                  )}

                  {/* Delivery Date */}
                  {purchaseOrder.delivery_date && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Calendar size={16} className="mr-1" />
                        Scheduled Delivery Date
                      </h3>
                      <p className="text-sm font-medium">
                        {new Date(purchaseOrder.delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Call Reference */}
                  {purchaseOrder.call_id && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Related Call</h3>
                      <p className="text-sm font-medium">Call ID: {purchaseOrder.call_id.callNumber || purchaseOrder.call_id._id}</p>
                      {purchaseOrder.call_id.purpose && (
                        <p className="text-sm text-gray-600 mt-1">Purpose: {purchaseOrder.call_id.purpose}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderDetails;