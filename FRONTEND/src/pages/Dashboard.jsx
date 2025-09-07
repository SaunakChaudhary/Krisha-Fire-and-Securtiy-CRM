import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import {
    FileText, ClipboardList, Users,
    Phone, Building, CheckSquare,
    Award, TrendingUp, Share2, Activity, Calendar,
    Shield, FileDigit, Package, Truck, FileX,
    Heart,
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
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
            if (!hasPermission("Dashboard")) {
                return navigate("/UserUnAuthorized/dashboard");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSideOpen] = useState(false);
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inquiryData, setInquiryData] = useState([]);
    const [customerData, setCustomerData] = useState([]);
    const [warrantyData, setWarrantyData] = useState([]);
    const [quotationData, setQuotationData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (dashboardData) {
            prepareChartData();
            prepareWarrantyData();
            prepareQuotationData();
        }
    }, [dashboardData, year, month]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/details`);

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        // Filter data based on year/month
        prepareChartData();
        prepareWarrantyData();
        prepareQuotationData();
    };

    const handleClear = () => {
        setYear('');
        setMonth('');
        fetchDashboardData();
    };

    const years = ['2023', '2024', '2025', '2026'];
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    // Calculate quotation totals using the same logic as AddQuotation page
    const calculateQuotationTotals = (quotation) => {
        let subtotal = 0;
        let totalGst = 0;
        let installationSubtotal = 0;
        let installationGst = 0;

        quotation.product_details?.forEach(product => {
            // Product calculations
            const productTotal = (parseFloat(product.quantity) || 0) * (parseFloat(product.price) || 0);
            subtotal += productTotal;
            totalGst += productTotal * ((parseFloat(product.gst_percent) || 0) / 100);

            // Installation calculations
            const installationTotal = (parseFloat(product.quantity) || 0) * (parseFloat(product.installation_price) || 0);
            installationSubtotal += installationTotal;
            installationGst += installationTotal * ((parseFloat(product.installation_gst_percent) || 0) / 100);
        });

        const grossTotal = subtotal + totalGst + installationSubtotal + installationGst;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalGst: parseFloat(totalGst.toFixed(2)),
            installationSubtotal: parseFloat(installationSubtotal.toFixed(2)),
            installationGst: parseFloat(installationGst.toFixed(2)),
            grossTotal: parseFloat(grossTotal.toFixed(2))
        };
    };

    const prepareChartData = () => {
        if (!dashboardData) return;

        // Month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize inquiryData with the correct fields
        const newInquiryData = monthNames.map(name => ({
            name,
            Quoted: 0,
            Won: 0,
            Lost: 0,
            Hold: 0,
            Assigned: 0
        }));

        // Filter Sales Enquiries by year
        const filteredEnquiries = dashboardData.SalesEnquiries.filter(enq => {
            if (!year) return true;
            const date = new Date(enq.createdAt || enq.date || enq.created_at);
            return date.getFullYear().toString() === year;
        });

        // Filter by month
        const monthIndex = months.findIndex(m => m === month);
        const finalEnquiries = monthIndex >= 0
            ? filteredEnquiries.filter(enq => {
                const date = new Date(enq.createdAt || enq.date || enq.created_at);
                return date.getMonth() === monthIndex;
            })
            : filteredEnquiries;

        // Populate inquiry data with the correct status mapping
        finalEnquiries.forEach(enq => {
            const date = new Date(enq.createdAt || enq.date || enq.created_at);
            const monthIdx = date.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
                switch (enq.status) {
                    case 'Quoted':
                        newInquiryData[monthIdx].Quoted += 1;
                        break;
                    case 'Won':
                        newInquiryData[monthIdx].Won += 1;
                        break;
                    case 'Lost':
                        newInquiryData[monthIdx].Lost += 1;
                        break;
                    case 'Hold':
                        newInquiryData[monthIdx].Hold += 1;
                        break;
                    case 'Assigned':
                    case 'New Assigned':
                        newInquiryData[monthIdx].Assigned += 1;
                        break;
                    default:
                        break;
                }
            }
        });

        setInquiryData(newInquiryData);

        // ============================
        // Customer Data
        // ============================
        const newCustomerData = monthNames.map(name => ({
            name,
            newCustomer: 0,
            newSite: 0
        }));

        // Filter customers by year
        const filteredCustomers = dashboardData.TotalCustomers.filter(customer => {
            if (!year) return true;
            const date = new Date(customer.createdAt || customer.created_at);
            return date.getFullYear().toString() === year;
        });

        // Filter customers by month
        const finalCustomers = monthIndex >= 0
            ? filteredCustomers.filter(customer => {
                const date = new Date(customer.createdAt || customer.created_at);
                return date.getMonth() === monthIndex;
            })
            : filteredCustomers;

        // Populate customers
        finalCustomers.forEach(customer => {
            const date = new Date(customer.createdAt || customer.created_at);
            const monthIdx = date.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
                newCustomerData[monthIdx].newCustomer += 1;
            }
        });

        // Filter sites by year
        const filteredSites = dashboardData.TotalSites.filter(site => {
            if (!year) return true;
            const date = new Date(site.createdAt || site.created_at);
            return date.getFullYear().toString() === year;
        });

        // Filter sites by month
        const finalSites = monthIndex >= 0
            ? filteredSites.filter(site => {
                const date = new Date(site.createdAt || site.created_at);
                return date.getMonth() === monthIndex;
            })
            : filteredSites;

        // Populate sites
        finalSites.forEach(site => {
            const date = new Date(site.createdAt || site.created_at);
            const monthIdx = date.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
                newCustomerData[monthIdx].newSite += 1;
            }
        });

        setCustomerData(newCustomerData);
    };

    const prepareWarrantyData = () => {
        if (!dashboardData) return;

        // Month names for 2025 chart
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize warranty data for 2025
        const newWarrantyData = monthNames.map(name => ({
            name,
            warranty: 0,
            AMC: 0
        }));

        // Filter for 2025 expirations only
        const targetYear = 2025;

        // Process AMC and Warranty data
        dashboardData.AMCandWarrenty.forEach(site => {
            site.site_systems?.forEach(system => {
                // Process AMC end dates
                if (system.amc_end_date) {
                    const amcDate = new Date(system.amc_end_date);
                    if (amcDate.getFullYear() === targetYear) {
                        const monthIdx = amcDate.getMonth();
                        if (monthIdx >= 0 && monthIdx < 12) {
                            newWarrantyData[monthIdx].AMC += 1;
                        }
                    }
                }

                // Process warranty dates
                if (system.warranty_date) {
                    const warrantyDate = new Date(system.warranty_date);
                    if (warrantyDate.getFullYear() === targetYear) {
                        const monthIdx = warrantyDate.getMonth();
                        if (monthIdx >= 0 && monthIdx < 12) {
                            newWarrantyData[monthIdx].warranty += 1;
                        }
                    }
                }
            });
        });

        setWarrantyData(newWarrantyData);
    };

    const prepareQuotationData = () => {
        if (!dashboardData) return;

        // Filter quotations by year if selected
        let filteredQuotations = dashboardData.Quotations;
        if (year) {
            filteredQuotations = filteredQuotations.filter(quote => {
                const date = new Date(quote.createdAt || quote.created_at);
                return date.getFullYear().toString() === year;
            });
        }

        // Filter by month if selected
        const monthIndex = months.findIndex(m => m === month);
        if (monthIndex >= 0) {
            filteredQuotations = filteredQuotations.filter(quote => {
                const date = new Date(quote.createdAt || quote.created_at);
                return date.getMonth() === monthIndex;
            });
        }

        // Group quotations by status (Quoted, Won, Lost)
        let quotedValue = 0;
        let wonValue = 0;
        let lostValue = 0;

        let quotedCount = 0;
        let wonCount = 0;
        let lostCount = 0;

        filteredQuotations.forEach(quotation => {
            const totals = calculateQuotationTotals(quotation);

            // Find the associated sales enquiry
            const salesEnquiry = dashboardData.SalesEnquiries.find(
                enq => enq._id === quotation.sales_enquiry_id._id
            );

            if (salesEnquiry) {
                switch (salesEnquiry.status) {
                    case 'Quoted':
                        quotedValue += totals.grossTotal;
                        quotedCount += 1;
                        break;
                    case 'Won':
                        wonValue += totals.grossTotal;
                        wonCount += 1;
                        break;
                    case 'Lost':
                        lostValue += totals.grossTotal;
                        lostCount += 1;
                        break;
                    default:
                        // For any other status, count as quoted
                        quotedValue += totals.grossTotal;
                        quotedCount += 1;
                        break;
                }
            } else {
                // If no sales enquiry found, count as quoted
                quotedValue += totals.grossTotal;
                quotedCount += 1;
            }
        });

        // Format data for pie chart
        const pieChartData = [
            {
                name: 'Quoted',
                value: quotedValue,
                count: quotedCount,
                color: '#8884d8'
            },
            {
                name: 'Won',
                value: wonValue,
                count: wonCount,
                color: '#82ca9d'
            },
            {
                name: 'Lost',
                value: lostValue,
                count: lostCount,
                color: '#ff6961'
            }
        ];

        setQuotationData(pieChartData);
    };

    const calculateCounts = () => {
        if (!dashboardData) return {};

        // Calculate AMC and Warranty counts
        const amcCount = dashboardData.AMCandWarrenty.filter(site =>
            site.site_systems?.some(system =>
                system.amc_end_date && new Date(system.amc_end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            )
        ).length;

        const warrantyCount = dashboardData.AMCandWarrenty.filter(site =>
            site.site_systems?.some(system =>
                system.warranty_date && new Date(system.warranty_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            )
        ).length;

        // Calculate call status counts
        const newCalls = dashboardData.Calls.filter(call => call.status === 'New').length;
        const scheduledCalls = dashboardData.Diaries.filter(diary => diary.status === 'scheduled').length;
        const completedCalls = dashboardData.Diaries.filter(diary => diary.status === 'completed').length;

        // Calculate other counts
        const pendingSalesEnquiry = dashboardData.SalesEnquiries.filter(enq => enq.status === "Hold").length;
        const wonSalesEnquiry = dashboardData.SalesEnquiries.filter(enq => enq.status === "Won").length;
        const quotationCount = dashboardData.Quotations.length;

        // Calculate total quotation value using the same logic
        let totalQuotationValue = 0;
        dashboardData.Quotations.forEach(quotation => {
            const totals = calculateQuotationTotals(quotation);
            totalQuotationValue += totals.grossTotal;
        });

        const totalCustomers = dashboardData.TotalCustomers.length;
        const totalSites = dashboardData.TotalSites.length;
        const activeSites = dashboardData.TotalSites.filter(site => site.status === 'Live' || site.status === 'New').length;
        const activeJobs = dashboardData.Diaries.filter(diary => diary.status === 'on-site' || diary.status === 'on-route' || diary.status === 'accepted' || diary.status === 'scheduled').length;

        const dcPendingInvoice = dashboardData.DCPendingInvoice.filter(dc => dc.invoice_status === 'Pending').length;
        const totalSuppliers = dashboardData.Suppliers.length;
        const activeSuppliers = dashboardData.Suppliers.filter(supplier => supplier.status === 'Active').length;

        const totalProducts = dashboardData.TotalProducts.length;
        const availableProducts = dashboardData.TotalProducts.filter(product => product.units > 0).length;

        let highPrioritizedSalesEnquiry = 0;
        let mediumPrioritizedSalesEnquiry = 0;
        let lowPrioritizedSalesEnquiry = 0;

        dashboardData.Calls.forEach(enquiry => {
            const priority = Number(enquiry.priority) || 0;
            if (priority > 80) {
                highPrioritizedSalesEnquiry++;
            } else if (priority > 40) {
                mediumPrioritizedSalesEnquiry++;
            } else {
                lowPrioritizedSalesEnquiry++;
            }
        });

        return {
            highPrioritizedSalesEnquiry,
            mediumPrioritizedSalesEnquiry,
            lowPrioritizedSalesEnquiry,
            amcCount,
            warrantyCount,
            pendingSalesEnquiry,
            quotationCount,
            totalQuotationValue,
            totalCustomers,
            wonSalesEnquiry,
            totalSites,
            activeSites,
            activeJobs,
            newCalls,
            scheduledCalls,
            completedCalls,
            dcPendingInvoice,
            totalSuppliers,
            activeSuppliers,
            totalProducts,
            availableProducts
        };
    };

    const counts = dashboardData ? calculateCounts() : {};

    const cards = [
        { icon: <Shield size={20} />, title: 'AMC Expiring', count: counts.amcCount || 0, iconBg: 'bg-orange-600' },
        { icon: <Shield size={20} />, title: 'Warranty Expiring', count: counts.warrantyCount || 0, iconBg: 'bg-cyan-600' },
        { icon: <FileText size={20} />, title: 'Pending Sales Enquiry', count: counts.pendingSalesEnquiry || 0, iconBg: 'bg-cyan-500' },
        { icon: <Award size={20} />, title: 'Won Sales Enquiry', count: counts.wonSalesEnquiry || 0, iconBg: 'bg-green-500' },
        { icon: <FileDigit size={20} />, title: 'Quotations', count: counts.quotationCount || 0, iconBg: 'bg-gray-700' },
        { icon: <FileDigit size={20} />, title: 'Quotation Value', count: `₹${(counts.totalQuotationValue || 0).toLocaleString('en-IN')}`, iconBg: 'bg-purple-600' },
        { icon: <Users size={20} />, title: 'Total Customers', count: counts.totalCustomers || 0, iconBg: 'bg-orange-500' },
        { icon: <Building size={20} />, title: 'Total Sites', count: counts.totalSites || 0, iconBg: 'bg-orange-500' },
        { icon: <Building size={20} />, title: 'Active Sites', count: counts.activeSites || 0, iconBg: 'bg-orange-500' },
        { icon: <ClipboardList size={20} />, title: 'Active Jobs', count: counts.activeJobs || 0, iconBg: 'bg-green-600' },
        { icon: <Phone size={20} />, title: 'New Calls', count: counts.newCalls || 0, iconBg: 'bg-blue-500' },
        { icon: <Calendar size={20} />, title: 'Scheduled Calls', count: counts.scheduledCalls || 0, iconBg: 'bg-purple-500' },
        { icon: <CheckSquare size={20} />, title: 'Completed Calls', count: counts.completedCalls || 0, iconBg: 'bg-green-500' },
        { icon: <FileX size={20} />, title: 'DC Pending Invoice', count: counts.dcPendingInvoice || 0, iconBg: 'bg-orange-400' },
        { icon: <Truck size={20} />, title: 'Total Suppliers', count: counts.totalSuppliers || 0, iconBg: 'bg-gray-700' },
        { icon: <Truck size={20} />, title: 'Active Suppliers', count: counts.activeSuppliers || 0, iconBg: 'bg-gray-700' },
        { icon: <Package size={20} />, title: 'Total Products', count: counts.totalProducts || 0, iconBg: 'bg-gray-700' },
        { icon: <Package size={20} />, title: 'Available Products', count: counts.availableProducts || 0, iconBg: 'bg-green-500' },
    ];

    const salesPriority = [
        { label: 'HIGH', count: counts.highPrioritizedSalesEnquiry || 0, icon: <TrendingUp className="text-red-500" size={24} /> },
        { label: 'MEDIUM', count: counts.mediumPrioritizedSalesEnquiry || 0, icon: <Activity className="text-yellow-500" size={24} /> },
        { label: 'LOW', count: counts.lowPrioritizedSalesEnquiry || 0, icon: <Share2 className="text-green-500" size={24} /> }
    ];

    // Custom tooltip for pie chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm">Total Value: ₹{data.value.toLocaleString('en-IN')}</p>
                    <p className="text-sm">Count: {data.count} quotations</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            Error: {error}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                    <h2 className='font-semibold text-2xl sm:text-3xl my-4'>Dashboard</h2>

                    {/* Filter Section */}
                    <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
                        {/* Year Dropdown */}
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-2"
                            >
                                <option value="">Select Year</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Dropdown */}
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Month</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-2"
                            >
                                <option value="">Select Month</option>
                                {months.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                            <button
                                onClick={handleSearch}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded w-full sm:w-auto"
                            >
                                Search
                            </button>
                            <button
                                onClick={handleClear}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded w-full sm:w-auto"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
                        {cards.map((card, index) => (
                            <DashboardCard
                                key={index}
                                icon={card.icon}
                                title={card.title}
                                count={card.count}
                                iconBg={card.iconBg}
                            />
                        ))}
                    </div>

                    {/* Sales Priority Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Priority</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {salesPriority.map((item, i) => (
                                <div key={i} className="flex flex-col items-center p-6 rounded-lg bg-gray-50 border border-gray-200 text-center">
                                    <div className="mb-3">{item.icon}</div>
                                    <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                                    <span className="text-sm font-medium text-gray-600">{item.label} PRIORITY</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="space-y-6">
                        {/* Middle Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sales Inquiry Chart */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Sales Inquiry Details {year ? `for ${year}` : ''} {month ? `- ${month}` : ''}
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={inquiryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Quoted" stroke="#8884d8" strokeWidth={2} />
                                        <Line type="monotone" dataKey='Won' stroke="#82ca9d" strokeWidth={2} />
                                        <Line type="monotone" dataKey="Lost" stroke="#ff6961" strokeWidth={2} />
                                        <Line type="monotone" dataKey="Hold" stroke="#facc15" strokeWidth={2} />
                                        <Line type="monotone" dataKey="Assigned" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* New Customer Bar Chart */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    New Customers & New Sites {year ? `for ${year}` : ''} {month ? `- ${month}` : ''}
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={customerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="newCustomer" fill="#10b981" name="New Customers" />
                                        <Bar dataKey="newSite" fill="#3b82f6" name="New Sites" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Warranty & AMC Expiry Chart */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Warranty & AMC Contract Expiring Details for 2025</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={warrantyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="warranty" fill="#3b82f6" name="Warranty" />
                                        <Bar dataKey="AMC" fill="#facc15" name="AMC" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Quotation Status Pie Chart */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Quotation Summary {year ? `for ${year}` : ''} {month ? `- ${month}` : ''}
                                </h3>
                                <div className="flex items-center justify-center h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={quotationData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {quotationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                                    {quotationData.map((item, index) => (
                                        <div key={index} className="p-2 bg-gray-50 rounded">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm">₹{item.value.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-gray-500">{item.count} quotations</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;