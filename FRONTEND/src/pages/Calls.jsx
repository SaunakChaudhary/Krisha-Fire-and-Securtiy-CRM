import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Search, Filter, ChevronDown, ChevronUp, Calendar, Clock, Phone, AlertCircle, X } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";

const CallList = () => {
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
            if (!hasPermission("Manage Call")) {
                return navigate("/UserUnAuthorized/Manage Calls");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [originalCalls, setOriginalCalls] = useState([]); // Stores all calls from backend
    const [displayCalls, setDisplayCalls] = useState([]); // Calls to display after filtering
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dateRange: { start: '', end: '' }
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch all calls initially
    const fetchCalls = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/calls`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch calls');

            const data = await response.json();

            const formattedCalls = data.data.map(call => ({
                id: call.call_number,
                _id: call._id,
                status: call.status,
                site: {
                    id: call.site_id._id,
                    name: call.site_id.site_name,
                },
                system: {
                    id: call.site_system._id,
                    name: call.site_system.name,
                    model: call.site_system.model
                },
                callType: {
                    id: call.call_type._id,
                    name: call.call_type.name
                },
                callReason: {
                    id: call.call_reason._id,
                    name: call.call_reason.name
                },
                waiting: call.waiting,
                priority: call.priority,
                chargable: call.chargable,
                invoiced: call.invoiced,
                dates: {
                    createdAt: call.createdAt,
                    deadline: call.deadline,
                    completedAt: call.completedAt
                },
                loggedBy: {
                    id: call.logged_by._id,
                    name: call.logged_by.name,
                    email: call.logged_by.email
                },
                engineer: call.engineer_id ? {
                    id: call.engineer_id._id,
                    name: call.engineer_id.name,
                    email: call.engineer_id.email
                } : null
            }));

            setOriginalCalls(formattedCalls);
            setDisplayCalls(formattedCalls);
            updatePagination(formattedCalls);
        } catch (error) {
            console.error('Error fetching calls:', error);
            toast.error(error.message || 'Failed to load calls');
        } finally {
            setLoading(false);
        }
    };

    // Update pagination based on current calls
    const updatePagination = (calls) => {
        setPagination(prev => ({
            ...prev,
            total: calls.length,
            totalPages: Math.ceil(calls.length / prev.limit)
        }));
    };

    // Apply all filters and search
    const applyFilters = () => {
        let filtered = [...originalCalls];

        // Apply search by site name
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(call =>
                call.site.name.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(call => call.status === filters.status);
        }

        // Apply priority filter
        if (filters.priority) {
            filtered = filtered.filter(call => call.priority === filters.priority);
        }

        // Apply date range filter
        if (filters.dateRange.start) {
            const startDate = new Date(filters.dateRange.start);
            filtered = filtered.filter(call => new Date(call.dates.createdAt) >= startDate);
        }

        if (filters.dateRange.end) {
            const endDate = new Date(filters.dateRange.end);
            filtered = filtered.filter(call => new Date(call.dates.createdAt) <= endDate);
        }

        setDisplayCalls(filtered);
        updatePagination(filtered);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    // Re-apply filters when search term or filters change
    useEffect(() => {
        if (originalCalls.length > 0) {
            applyFilters();
        }
    }, [searchTerm, filters]);

    // Initial data fetch
    useEffect(() => {
        fetchCalls();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [name]: value
            }
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            priority: '',
            dateRange: { start: '', end: '' }
        });
        setSearchTerm('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isMobile
            ? date.toLocaleDateString('short')
            : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get calls for current page
    const getPaginatedCalls = () => {
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        return displayCalls.slice(start, end);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 lg:pl-72">
                    <div className="min-h-screen">
                        <div className="p-4 sm:p-6">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-4 sm:mb-6">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Call Management</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">View and manage all service calls</p>
                                </div>

                                {/* Search and Filter Bar */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 sm:mb-6">
                                    <form onSubmit={handleSearch} className="mb-3 sm:mb-4">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative flex-grow">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                    placeholder="Search by site name..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </form>

                                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                                            {showFilters ? (
                                                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                            )}
                                        </button>

                                        {showFilters && (
                                            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            name="start"
                                                            className="block w-full pl-2 sm:pl-3 pr-2 sm:pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                            value={filters.dateRange.start}
                                                            onChange={handleDateChange}
                                                        />
                                                        <input
                                                            type="date"
                                                            name="end"
                                                            className="block w-full pl-2 sm:pl-3 pr-2 sm:pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                            value={filters.dateRange.end}
                                                            onChange={handleDateChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className='flex items-end justify-end'>
                                                    <button
                                                        type="button"
                                                        onClick={clearFilters}
                                                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                    >
                                                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Calls Table */}
                                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                                    {loading ? (
                                        <div className="flex justify-center items-center p-8 sm:p-12">
                                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : displayCalls.length === 0 ? (
                                        <div className="text-center p-8 sm:p-12">
                                            <p className="text-sm sm:text-base text-gray-500">No calls found matching your criteria</p>
                                        </div>
                                    ) : isMobile ? (
                                        // Mobile Cards View
                                        <div className="divide-y divide-gray-200">
                                            {getPaginatedCalls().map((call) => (
                                                <div key={call.id} className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium text-gray-900">#{call.id.substring(0, 8)}</div>
                                                            <div className="text-sm text-gray-500 mt-1">{call.site.name}</div>
                                                            <div className="text-xs text-gray-400">{call.system.name}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span
                                                                className={`
                                                                    inline-block px-2 py-0.5 rounded text-xs font-semibold
                                                                    ${call.status === 'open'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : call.status === 'in_progress'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : call.status === 'on_hold'
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : call.status === 'resolved'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : call.status === 'closed'
                                                                                        ? 'bg-gray-200 text-gray-600'
                                                                                        : 'bg-gray-100 text-gray-500'
                                                                    }
                                                                `}
                                                            >
                                                                {{
                                                                    open: 'Open',
                                                                    in_progress: 'In Progress',
                                                                    on_hold: 'On Hold',
                                                                    resolved: 'Resolved',
                                                                    closed: 'Closed'
                                                                }[call.status] || call.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            {call.priority}
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex items-center text-sm">
                                                        {call.priority === 1 ? (
                                                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                                        ) : (
                                                            <Phone className="h-4 w-4 text-blue-500 mr-1" />
                                                        )}
                                                        <span className="font-medium">{call.callType.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 ml-5">{call.callReason.name}</div>

                                                    <div className="mt-2 flex items-center text-xs text-gray-500">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatDate(call.dates.createdAt)}
                                                    </div>

                                                    <div className="mt-3 flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => navigate(`/calls/${call._id}`)}
                                                            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/calls/${call._id}/edit`)}
                                                            className="text-xs px-2 py-1 border border-transparent rounded text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Desktop Table View
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Call ID
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Site / System
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Call Details
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Priority
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Dates
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {getPaginatedCalls().map((call) => (
                                                            <tr key={call.id} className="hover:bg-gray-50">
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    #{call.id.substring(0, 8)}
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{call.site.name}</div>
                                                                    <div className="text-sm text-gray-500">{call.system.name}</div>
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4">
                                                                    <div className="flex items-center">
                                                                        {call.priority === 1 ? (
                                                                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                                                        ) : (
                                                                            <Phone className="h-4 w-4 text-blue-500 mr-2" />
                                                                        )}
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">{call.callType.name}</div>
                                                                            <div className="text-sm text-gray-500">{call.callReason.name}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                                                    <span
                                                                        className={`
                                                                    inline-block px-2 py-0.5 rounded text-xs font-semibold
                                                                    ${call.status === 'open'
                                                                                ? 'bg-blue-100 text-blue-700'
                                                                                : call.status === 'in_progress'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : call.status === 'on_hold'
                                                                                        ? 'bg-orange-100 text-orange-800'
                                                                                        : call.status === 'resolved'
                                                                                            ? 'bg-green-100 text-green-700'
                                                                                            : call.status === 'closed'
                                                                                                ? 'bg-gray-200 text-gray-600'
                                                                                                : 'bg-gray-100 text-gray-500'
                                                                            }
                                                                `}
                                                                    >
                                                                        {{
                                                                            open: 'Open',
                                                                            in_progress: 'In Progress',
                                                                            on_hold: 'On Hold',
                                                                            resolved: 'Resolved',
                                                                            closed: 'Closed'
                                                                        }[call.status] || call.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                                                    {call.priority}
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                                                        <span className="text-sm text-gray-500">{formatDate(call.dates.createdAt)}</span>
                                                                    </div>
                                                                    {call.dates.deadline && (
                                                                        <div className="flex items-center mt-1">
                                                                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                                                            <span className="text-sm text-gray-500">{formatDate(call.dates.deadline)}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                    <button
                                                                        onClick={() => navigate(`/calls/${call._id}`)}
                                                                        className="text-red-600 hover:text-red-900 mr-3"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate(`/calls/${call._id}/edit`)}
                                                                        className="text-blue-600 hover:text-blue-900"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="mb-2 sm:mb-0">
                                                        <p className="text-xs sm:text-sm text-gray-700">
                                                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                                            <span className="font-medium">
                                                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                                                            </span>{' '}
                                                            of <span className="font-medium">{pagination.total}</span> results
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                            <button
                                                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                                                disabled={pagination.page === 1}
                                                                className="relative inline-flex items-center px-2 py-1 sm:px-2 sm:py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Previous
                                                            </button>
                                                            {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                                                                let pageNum;
                                                                if (pagination.totalPages <= 3) {
                                                                    pageNum = i + 1;
                                                                } else if (pagination.page <= 2) {
                                                                    pageNum = i + 1;
                                                                } else if (pagination.page >= pagination.totalPages - 1) {
                                                                    pageNum = pagination.totalPages - 2 + i;
                                                                } else {
                                                                    pageNum = pagination.page - 1 + i;
                                                                }

                                                                return (
                                                                    <button
                                                                        key={pageNum}
                                                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                                        className={`relative inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium ${pagination.page === pageNum
                                                                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        {pageNum}
                                                                    </button>
                                                                );
                                                            })}
                                                            <button
                                                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                                                disabled={pagination.page === pagination.totalPages}
                                                                className="relative inline-flex items-center px-2 py-1 sm:px-2 sm:py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Next
                                                            </button>
                                                        </nav>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CallList;