import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Save, X, Plus, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const EditJobCosting = () => {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: "",
    site_id: "",
    quotation_id: "",
    product_list: [],
    misc_expenses: {
      expense_1: 0,
      expense_2: 0,
      expense_3: 0,
      expense_4: 0,
    },
  });

  // Fetch initial data and job costing record
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Fetch products first so we can match them with the job costing products
        const productsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products`
        );
        if (!productsRes.ok) throw new Error("Failed to fetch products");
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);

        // Fetch job costing record
        const jobCostingRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/job-costing/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!jobCostingRes.ok) throw new Error("Failed to fetch job costing");
        const jobCostingData = await jobCostingRes.json();

        // Fetch customers
        const customersRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/customers`
        );
        if (!customersRes.ok) throw new Error("Failed to fetch customers");
        const customersData = await customersRes.json();
        setCustomers(customersData);

        // Process product list to ensure purchase costs are included
        const processedProductList = jobCostingData.product_list.map(
          (product) => {
            // Find matching product in products list
            const matchingProduct = productsData.data.find(
              (p) =>
                p._id === product.product_id?._id ||
                p._id === product.product_id
            );

            return {
              ...product,
              purchase_unit_price:
                matchingProduct?.purchase_cost ||
                product.purchase_unit_price ||
                0,
              purchase_total_price:
                (product.quantity || 0) *
                (matchingProduct?.purchase_cost ||
                  product.purchase_unit_price ||
                  0),
            };
          }
        );

        // Set form data from the fetched job costing
        setFormData({
          customer_id:
            jobCostingData.customer_id?._id || jobCostingData.customer_id || "",
          site_id: jobCostingData.site_id?._id || jobCostingData.site_id || "",
          quotation_id:
            jobCostingData.quotation_id?._id ||
            jobCostingData.quotation_id ||
            "",
          product_list: processedProductList,
          misc_expenses: jobCostingData.misc_expenses || {
            expense_1: 0,
            expense_2: 0,
            expense_3: 0,
            expense_4: 0,
          },
        });

        // Fetch sites for the customer if customer_id exists
        if (jobCostingData.customer_id) {
          const sitesRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/sites?customer_id=${
              jobCostingData.customer_id._id || jobCostingData.customer_id
            }`
          );
          if (!sitesRes.ok) throw new Error("Failed to fetch sites");
          const sitesData = await sitesRes.json();
          setSites(sitesData);
        }

        // Fetch quotations for the site if site_id exists
        if (jobCostingData.site_id) {
          const quotationsRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/quotation`
          );
          if (!quotationsRes.ok) throw new Error("Failed to fetch quotations");
          const quotationsData = await quotationsRes.json();
          setQuotations(quotationsData.data);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load data");
        console.error(error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // [Rest of your useEffect hooks remain the same...]

  // Calculate totals
  const calculateTotals = () => {
    const productList = formData.product_list;

    const totalMaterial = productList.reduce(
      (sum, product) => sum + (product.material_total_price || 0),
      0
    );
    const totalInstallation = productList.reduce(
      (sum, product) => sum + (product.installation_total_price || 0),
      0
    );
    const totalPurchase = productList.reduce(
      (sum, product) => sum + (product.purchase_total_price || 0),
      0
    );

    // Calculate misc expenses
    const miscExpenses = Object.values(formData.misc_expenses).reduce(
      (sum, val) => sum + (val || 0),
      0
    );

    // Calculate totals
    const productCost = totalMaterial;
    const installationCost = totalInstallation;
    const purchaseCost = totalPurchase;
    const totalCost = purchaseCost + miscExpenses;

    // Calculate project cost as sum of all product costs
    const projectCost = totalMaterial + totalInstallation;

    // Calculate margin
    const margin = projectCost - totalCost;
    const marginPercent = projectCost > 0 ? (margin / projectCost) * 100 : 0;

    return {
      total_material_cost: totalMaterial,
      total_installation_cost: totalInstallation,
      total_purchase_cost: totalPurchase,
      product_cost: productCost,
      installation_cost: installationCost,
      purchase_cost: purchaseCost,
      total_cost: totalCost,
      project_cost: projectCost,
      margin: margin,
      margin_percent: marginPercent,
    };
  };

  const {
    total_material_cost,
    total_installation_cost,
    total_purchase_cost,
    product_cost,
    installation_cost,
    purchase_cost,
    total_cost,
    project_cost,
    margin,
    margin_percent,
  } = calculateTotals();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle misc expense changes
  const handleMiscExpenseChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      misc_expenses: {
        ...prev.misc_expenses,
        [name]: parseFloat(value) || 0,
      },
    }));
  };

  // Remove product from the list
  const removeProduct = (index) => {
    setFormData((prev) => {
      const newList = [...prev.product_list];
      newList.splice(index, 1);
      return {
        ...prev,
        product_list: newList,
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/job-costing/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...formData,
            ...calculateTotals(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update job costing");
      }

      toast.success("Job costing updated successfully");
      navigate("/manage-job-costing");
    } catch (error) {
      toast.error(error.message || "Failed to update job costing");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(false)}
          />
          <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(false)}
        />
        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Edit Job Costing
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Update the job costing record
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm"
                  onClick={() => navigate(-1)}
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  className={`flex items-center px-3 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition text-sm ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <Save size={16} className="mr-2" />
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

            {/* Main Form */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              {/* Customer, Site, Quotation Selection */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer
                    </label>
                    <select
                      name="customer_id"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Site Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site
                    </label>
                    <select
                      name="site_id"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.site_id}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.customer_id}
                    >
                      <option value="">Select Site</option>
                      {sites.map((site) => (
                        <option key={site._id} value={site._id}>
                          {site.site_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quotation Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quotation
                    </label>
                    <select
                      name="quotation_id"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.quotation_id}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.site_id}
                    >
                      <option value="">Select Quotation</option>
                      {quotations.map((quotation) => (
                        <option key={quotation._id} value={quotation._id}>
                          {quotation.quotation_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Product List Section */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Products
                  </h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="hidden sm:inline">Total Products:</span>
                    <span className="ml-1 font-medium">
                      {formData.product_list.length}
                    </span>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Installation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.product_list.length > 0 ? (
                        formData.product_list.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.description}
                              </div>
                              <div className="text-xs text-gray-500">
                                Unit:{" "}
                                {product.material_unit_price?.toFixed(2) ||
                                  "0.00"}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {product.quantity}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(product.material_total_price || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(
                                  product.installation_total_price || 0
                                ).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(product.purchase_total_price || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-900 flex items-center"
                                onClick={() => removeProduct(index)}
                              >
                                <Trash2 size={16} className="mr-1" />
                                <span className="hidden sm:inline">Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-4 text-center text-sm text-gray-500"
                          >
                            No products added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          className="px-4 py-3 text-right text-sm font-medium text-gray-500"
                          colSpan="2"
                        >
                          Total
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {total_material_cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {total_installation_cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {total_purchase_cost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Costs Section */}
              <div className="p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Cost Summary
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expenses Column */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Miscellaneous Expenses
                      </h3>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((num) => (
                          <div key={num}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Expense {num}
                            </label>
                            <input
                              type="number"
                              name={`expense_${num}`}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              value={formData.misc_expenses[`expense_${num}`]}
                              onChange={handleMiscExpenseChange}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Cost Breakdown
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Purchase Cost:</span>
                          <span className="font-medium">
                            {total_purchase_cost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Misc Expenses:</span>
                          <span className="font-medium">
                            {Object.values(formData.misc_expenses)
                              .reduce((sum, val) => sum + (val || 0), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Cost:</span>
                          <span>{total_cost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Column */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Project Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Project Cost:</span>
                          <span className="font-medium">
                            {project_cost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Cost:</span>
                          <span className="font-medium">
                            {total_cost.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Margin (Amount):
                          </span>
                          <span
                            className={`font-medium ${
                              margin >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {margin.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Margin (%):</span>
                          <span
                            className={`font-medium ${
                              margin_percent >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {margin_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Quick Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Products</div>
                          <div className="text-lg font-medium">
                            {formData.product_list.length}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">
                            Material Cost
                          </div>
                          <div className="text-lg font-medium">
                            {total_material_cost.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">
                            Installation
                          </div>
                          <div className="text-lg font-medium">
                            {total_installation_cost.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Purchase</div>
                          <div className="text-lg font-medium">
                            {total_purchase_cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditJobCosting;
