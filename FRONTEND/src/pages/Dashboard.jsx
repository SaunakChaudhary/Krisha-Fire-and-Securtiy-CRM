import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import {
    FileText, ClipboardList, Users,
    Building, CheckSquare,
    Award, TrendingUp, Share2, Activity, Calendar,
    Shield, FileDigit, Package, Truck, FileX, X,
    Building2,
    RefreshCw
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
    const [amcModalOpen, setAmcModalOpen] = useState(false);
    const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
    const [nextServiceModalOpen, setNextServiceModalOpen] = useState(false);
    const [activeJobModal, setActiveJobModal] = useState(false);
    const [scheduledCallsModal, setScheduledCallsModal] = useState(false);
    const [completedCallsModal, setCompletedCallsModal] = useState(false);
    const [alertQueue, setAlertQueue] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);


    const [amcExpiringDetails, setAmcExpiringDetails] = useState([]);
    const [warrantyExpiringDetails, setWarrantyExpiringDetails] = useState([]);
    const passesYearMonthFilter = (date) => {
        if (!date) return false;

        const d = new Date(date);

        if (year && d.getFullYear().toString() !== year) return false;

        if (month) {
            const monthIndex = months.findIndex(m => m === month);
            if (d.getMonth() !== monthIndex) return false;
        }

        return true;
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (dashboardData) {
            prepareChartData();
            prepareWarrantyData();
            prepareQuotationData();
            prepareAmcExpiringDetails();
            prepareWarrantyExpiringDetails();
        }
    }, [dashboardData, year, month]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/details`);

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
        prepareChartData();
        prepareWarrantyData();
        prepareQuotationData();
        prepareAmcExpiringDetails();
        prepareWarrantyExpiringDetails();
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

    // Prepare AMC expiring details
    const prepareAmcExpiringDetails = () => {
        if (!dashboardData) return;

        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const expiringAMCs = [];

        dashboardData.AMCandWarrenty.forEach(site => {
            site.site_systems?.forEach(system => {
                if (system.amc_end_date) {
                    const amcDate = new Date(system.amc_end_date);
                    if (!passesYearMonthFilter(amcDate)) return;
                    if (amcDate <= thirtyDaysFromNow && Math.ceil((amcDate - new Date()) / (1000 * 60 * 60 * 24)) >= 0) {
                        expiringAMCs.push({
                            siteName: site.site_name || 'N/A',
                            customerName: site.customer_id?.customer_name || 'N/A',
                            systemName: system.system_id?.systemName || 'N/A',
                            amcEndDate: system.amc_end_date,
                            daysRemaining: Math.ceil((amcDate - new Date()) / (1000 * 60 * 60 * 24))
                        });
                    }
                }
            });
        });

        // Sort by days remaining (ascending)
        expiringAMCs.sort((a, b) => a.daysRemaining - b.daysRemaining);

        setAmcExpiringDetails(expiringAMCs);
    };

    // Prepare Warranty expiring details
    const prepareWarrantyExpiringDetails = () => {
        if (!dashboardData) return;

        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const expiringWarranties = [];

        dashboardData.AMCandWarrenty.forEach(site => {
            site.site_systems?.forEach(system => {
                if (system.warranty_date) {
                    if (!passesYearMonthFilter(system.warranty_date)) return;
                    const warrantyDate = new Date(system.warranty_date);
                    if (warrantyDate <= thirtyDaysFromNow) {
                        if (Math.ceil((warrantyDate - new Date()) / (1000 * 60 * 60 * 24)) >= 0) {
                            expiringWarranties.push({
                                siteName: site.site_name || 'N/A',
                                customerName: site.customer_id?.customer_name || 'N/A',
                                systemName: system.system_id?.systemName || 'N/A',
                                warrantyDate: system.warranty_date,
                                daysRemaining: Math.ceil((warrantyDate - new Date()) / (1000 * 60 * 60 * 24))
                            });
                        }
                    }
                }
            });
        });

        expiringWarranties.sort((a, b) => a.daysRemaining - b.daysRemaining);

        setWarrantyExpiringDetails(expiringWarranties);
    };

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
            const salesEnquiry = dashboardData?.SalesEnquiries?.find(enq =>
                quotation?.sales_enquiry_id?._id &&
                enq?._id === quotation.sales_enquiry_id._id
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const amcCount = dashboardData.AMCandWarrenty.filter(site =>
            site.site_systems?.some(system =>
                system.amc_end_date &&
                new Date(system.amc_end_date) > today &&
                new Date(system.amc_end_date) <= next30Days
            )
        ).length;


        next30Days.setDate(today.getDate() + 30);

        const warrantyCount = dashboardData.AMCandWarrenty.filter(site =>
            site.site_systems?.some(system =>
                system.warranty_date &&
                new Date(system.warranty_date) > today &&
                new Date(system.warranty_date) <= next30Days
            )
        ).length;


        // Calculate call status counts
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


    const salesPriority = [
        { label: 'HIGH', count: counts.highPrioritizedSalesEnquiry || 0, icon: <TrendingUp className="text-red-500" size={24} /> },
        { label: 'MEDIUM', count: counts.mediumPrioritizedSalesEnquiry || 0, icon: <Activity className="text-yellow-500" size={24} /> },
        { label: 'LOW', count: counts.lowPrioritizedSalesEnquiry || 0, icon: <Share2 className="text-green-500" size={24} /> }
    ];

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

    const ExpiringModal = ({ isOpen, onClose, title, data, type }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out translate-y-[50px] opacity-0 animate-slideDown">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-4">
                        {data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {type === 'amc' ? 'AMC End Date' : 'Warranty End Date'}
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.map((item, index) => (
                                            <tr key={index} className={item.daysRemaining <= 7 ? 'bg-red-50' : item.daysRemaining <= 15 ? 'bg-orange-50' : 'bg-white'}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.customerName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.siteName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.systemName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(type === 'amc' ? item.amcEndDate : item.warrantyDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <span className={
                                                        item.daysRemaining <= 7 ? 'text-red-600' :
                                                            item.daysRemaining <= 15 ? 'text-orange-600' :
                                                                'text-green-600'
                                                    }>
                                                        {item.daysRemaining} days
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No {type === 'amc' ? 'AMC contracts' : 'warranties'} expiring in the next 30 days.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 border-t">
                        <button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const NextServiceModal = ({ isOpen, onClose, title, data, type }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out translate-y-[50px] opacity-0 animate-slideDown">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-4">
                        {data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.map((item, index) => (
                                            <tr key={index} className={item.daysRemaining <= 7 ? 'bg-red-50' : item.daysRemaining <= 15 ? 'bg-orange-50' : 'bg-white'}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.siteName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.systemName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(item.serviceDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <span className={
                                                        item.daysRemaining <= 7 ? 'text-red-600' :
                                                            item.daysRemaining <= 15 ? 'text-orange-600' :
                                                                'text-green-600'
                                                    }>
                                                        {item.daysRemaining} days
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No {type === 'amc' ? 'AMC contracts' : 'warranties'} expiring in the next 30 days.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 border-t">
                        <button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const ActiveJobModal = ({ isOpen, onClose, title, data }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out translate-y-[50px] opacity-0 animate-slideDown">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-4">
                        {dashboardData.Diaries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site System</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.Diaries.map((item, index) => (
                                            item.status !== 'completed' && (
                                                <tr key={index} className='bg-white'>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_number}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_type.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {item.callLog.priority}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_id.site_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_system.systemName}</td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No Active Jobs.
                            </div>
                        )}
                    </div>
                </div>
            </div >
        )
    }

    const ScheduledCallsModal = ({ isOpen, onClose, title, data }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out translate-y-[50px] opacity-0 animate-slideDown">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-4">
                        {dashboardData.Diaries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site System</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.Diaries.map((item, index) => (
                                            item.status === 'scheduled' && (
                                                <tr key={index} className='bg-white'>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_number}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_type.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {item.callLog.priority}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_id.site_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_system.systemName}</td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No Scheduled Calls.
                            </div>
                        )}
                    </div>
                </div>
            </div>)
    }

    const CompltedCallsModal = ({ isOpen, onClose, title, data }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out translate-y-[50px] opacity-0 animate-slideDown">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-4">
                        {dashboardData.Diaries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site System</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.Diaries.map((item, index) => (
                                            item.status === 'completed' && (
                                                <tr key={index} className='bg-white'>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_number}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.callLog.call_type.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {item.callLog.priority}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_id.site_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.callLog.site_system.systemName}</td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No Scheduled Calls.
                            </div>
                        )}
                    </div>
                </div>
            </div>)
    }
    const [servicesReady, setServicesReady] = useState(false);

    const getNextServiceDates = (startDate, endDate, frequency) => {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        let monthsToAdd = 0;

        switch (frequency) {
            case "Monthly":
                monthsToAdd = 1;
                break;
            case "Quarterly":
                monthsToAdd = 3;
                break;
            case "Half-Yearly":
                monthsToAdd = 6;
                break;
            case "Yearly":
                monthsToAdd = 12;
                break;
            default:
                return dates;
        }

        let current = new Date(start);

        while (current <= end) {
            dates.push(new Date(current));
            current.setMonth(current.getMonth() + monthsToAdd);
        }

        return dates;
    };

    const getDaysRemaining = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    };

    const getAlertKey = (type, siteName, systemName, date) =>
        `${type}_${siteName}_${systemName}_${new Date(date).toISOString().split("T")[0]}`;

    const [nextServices, setNextServices] = useState([]);
    const getNextServices = () => {
        const services = [];

        dashboardData?.TotalSites?.forEach(site => {
            site.site_systems?.forEach(system => {
                if (
                    system.amc_start_date &&
                    system.amc_end_date &&
                    system.frequency
                ) {
                    const serviceDates = getNextServiceDates(
                        system.amc_start_date,
                        system.amc_end_date,
                        system.frequency
                    );

                    serviceDates.forEach(date => {
                        if (!passesYearMonthFilter(date)) return;

                        const daysRemaining = getDaysRemaining(date);
                        if (daysRemaining < 0 || daysRemaining > 30) return;

                        services.push({
                            siteName: site.site_name,
                            systemName: getSystemNameById(system.system_id),
                            serviceDate: date,
                            daysRemaining
                        });
                    });
                }
            });
        });

        services.sort((a, b) => a.daysRemaining - b.daysRemaining);
        setNextServices(services);
    };


    const getSystemNameById = async (systemId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/systems/${systemId}`);
            const data = await response.json();
            return data.system.systemName;
        } catch (error) {
            return "INTERNAL SERVER ERROR " + error.message;
        }
    }
    useEffect(() => {
        if (dashboardData) {
            getNextServices();
            setServicesReady(true); 
        }
    }, [dashboardData, year, month]);


    const collectAlerts = () => {
        const alerts = [];
        const shown = JSON.parse(localStorage.getItem("shownExpiryAlerts")) || [];

        dashboardData?.AMCandWarrenty?.forEach(site => {
            site.site_systems?.forEach(system => {

                if (system.amc_end_date && getDaysRemaining(system.amc_end_date) >= 0 && getDaysRemaining(system.amc_end_date) <= 2) {
                    const key = getAlertKey("AMC", site.site_name, system.system_id?.systemName, system.amc_end_date);
                    if (!shown.includes(key)) {
                        alerts.push({
                            type: "AMC",
                            siteName: site.site_name,
                            systemName: system.system_id?.systemName,
                            date: system.amc_end_date
                        });
                        shown.push(key);
                    }
                }

                if (system.warranty_date && getDaysRemaining(system.warranty_date) >= 0 && getDaysRemaining(system.warranty_date) <= 2) {
                    const key = getAlertKey("Warranty", site.site_name, system.system_id?.systemName, system.warranty_date);
                    if (!shown.includes(key)) {
                        alerts.push({
                            type: "Warranty",
                            siteName: site.site_name,
                            systemName: system.system_id?.systemName,
                            date: system.warranty_date
                        });
                        shown.push(key);
                    }
                }
            });
        });

        // 🟢 SERVICE ALERTS (NOW GUARANTEED READY)
        nextServices.forEach(service => {
            if (service.daysRemaining >= 0 && service.daysRemaining <= 2) {
                const key = getAlertKey("Service", service.siteName, service.systemName, service.serviceDate);
                if (!shown.includes(key)) {
                    alerts.push({
                        type: "Service",
                        siteName: service.siteName,
                        systemName: service.systemName,
                        date: service.serviceDate
                    });
                    shown.push(key);
                }
            }
        });

        localStorage.setItem("shownExpiryAlerts", JSON.stringify(shown));
        return alerts;
    };

    useEffect(() => {
        if (!servicesReady) return;

        if (alertQueue.length > 0 || currentAlert) return;

        if (
            dashboardData?.AMCandWarrenty?.length ||
            nextServices?.length
        ) {
            const alerts = collectAlerts();

            if (alerts.length > 0) {
                setAlertQueue(alerts);
                setCurrentAlert(alerts[0]);
            }
        }
    }, [servicesReady, dashboardData, nextServices]);


    const handleCloseAlert = () => {
        setAlertQueue(prevQueue => {
            const remaining = prevQueue.slice(1);
            setCurrentAlert(remaining.length > 0 ? remaining[0] : null);
            return remaining;
        });
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

    const cards = [
        {
            icon: <Shield size={20} />,
            title: 'AMC Expiring',
            count: counts.amcCount || 0,
            iconBg: 'bg-orange-600',
            onClick: () => setAmcModalOpen(true)
        },
        {
            icon: <Shield size={20} />,
            title: 'Warranty Expiring',
            count: counts.warrantyCount || 0,
            iconBg: 'bg-cyan-600',
            onClick: () => setWarrantyModalOpen(true)
        },
        {
            icon: <RefreshCw size={20} />,
            title: 'Next Service Due',
            count: nextServices.length || 0,
            iconBg: 'bg-cyan-600',
            onClick: () => setNextServiceModalOpen(true)
        },
        { icon: <FileText size={20} />, title: 'Hold Sales Enquiry', count: counts.pendingSalesEnquiry || 0, iconBg: 'bg-cyan-500', onClick: () => navigate("/search-sales-enquiry") },
        { icon: <Award size={20} />, title: 'Won Sales Enquiry', count: counts.wonSalesEnquiry || 0, iconBg: 'bg-green-500', onClick: () => navigate("/search-sales-enquiry") },
        { icon: <FileDigit size={20} />, title: 'Quotations', count: counts.quotationCount || 0, iconBg: 'bg-gray-700', onClick: () => navigate("/search-quotation") },
        { icon: <FileDigit size={20} />, title: 'Quotation Value', count: `₹${(counts.totalQuotationValue || 0).toLocaleString('en-IN')}`, iconBg: 'bg-purple-600' },
        { icon: <Users size={20} />, title: 'Total Customers', count: counts.totalCustomers || 0, iconBg: 'bg-orange-500', onClick: () => navigate("/search-customer") },
        { icon: <Building2 size={20} />, title: 'Total Sites', count: counts.totalSites || 0, iconBg: 'bg-orange-500', onClick: () => navigate("/search-site") },
        { icon: <Building size={20} />, title: 'Active Sites', count: counts.activeSites || 0, iconBg: 'bg-orange-500', onClick: () => navigate("/search-site") },
        { icon: <ClipboardList size={20} />, title: 'Active Jobs', count: counts.activeJobs || 0, iconBg: 'bg-green-600', onClick: () => setActiveJobModal(true) },
        { icon: <Calendar size={20} />, title: 'Scheduled Calls', count: counts.scheduledCalls || 0, iconBg: 'bg-purple-500', onClick: () => setScheduledCallsModal(true) },
        { icon: <CheckSquare size={20} />, title: 'Completed Calls', count: counts.completedCalls || 0, iconBg: 'bg-green-500', onClick: () => setCompletedCallsModal(true) },
        { icon: <FileX size={20} />, title: 'DC Pending Invoice', count: counts.dcPendingInvoice || 0, iconBg: 'bg-orange-400', onClick: () => navigate("/delivery-chalan") },
        { icon: <Truck size={20} />, title: 'Total Suppliers', count: counts.totalSuppliers || 0, iconBg: 'bg-gray-700', onClick: () => navigate("/search-supplier") },
        { icon: <Truck size={20} />, title: 'Active Suppliers', count: counts.activeSuppliers || 0, iconBg: 'bg-gray-700', onClick: () => navigate("/search-supplier") },
        { icon: <Package size={20} />, title: 'Total Products', count: counts.totalProducts || 0, iconBg: 'bg-gray-700', onClick: () => navigate("/price-list") },
        { icon: <Package size={20} />, title: 'Available Products', count: counts.availableProducts || 0, iconBg: 'bg-green-500', onClick: () => navigate("/price-list") },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                    <h2 className='font-semibold text-2xl sm:text-3xl my-4'>Dashboard</h2>
                    {currentAlert && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-5 rounded-lg w-[350px]">
                                <h2 className="text-lg font-bold mb-2">
                                    ⚠️ {currentAlert.type === "Service" ? `Next ${currentAlert.type}` : `${currentAlert.type} Expiry`} Alert
                                </h2>

                                <p><b>Site:</b> {currentAlert.siteName}</p>
                                <p><b>System:</b> {currentAlert.systemName}</p>
                                <p><b>Date:</b> {new Date(currentAlert.date).toDateString()}</p>
                                <p className="text-red-600 font-semibold">2 Days Left</p>

                                <button
                                    onClick={handleCloseAlert}
                                    className="mt-4 w-full bg-red-600 text-white py-2 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

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
                            <div key={index} onClick={card.onClick} className={card.onClick ? 'cursor-pointer' : ''}>
                                <DashboardCard
                                    icon={card.icon}
                                    title={card.title}
                                    count={card.count}
                                    iconBg={card.iconBg}
                                />
                            </div>
                        ))}
                    </div>

                    {/* AMC Expiring Modal */}
                    <ExpiringModal
                        isOpen={amcModalOpen}
                        onClose={() => setAmcModalOpen(false)}
                        title="AMC Expiring Details"
                        data={amcExpiringDetails}
                        type="amc"
                    />

                    {/* Warranty Expiring Modal */}
                    <ExpiringModal
                        isOpen={warrantyModalOpen}
                        onClose={() => setWarrantyModalOpen(false)}
                        title="Warranty Expiring Details"
                        data={warrantyExpiringDetails}
                        type="warranty"
                    />

                    <NextServiceModal
                        isOpen={nextServiceModalOpen}
                        onClose={() => setNextServiceModalOpen(false)}
                        title="Next Service Due Details"
                        data={nextServices}
                        type="amc"
                    />

                    {/* Active Job Modal */}
                    <ActiveJobModal
                        isOpen={activeJobModal}
                        onClose={() => setActiveJobModal(false)}
                        title="Active Jobs"
                    />


                    {/* Scheduled Calls Modal */}
                    <ScheduledCallsModal
                        isOpen={scheduledCallsModal}
                        onClose={() => setScheduledCallsModal(false)}
                        title="Scheduled Calls"
                    />
                    <CompltedCallsModal
                        isOpen={completedCallsModal}
                        onClose={() => setCompletedCallsModal(false)}
                        title="Completed Calls"
                    />

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