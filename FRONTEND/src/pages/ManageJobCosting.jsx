import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ManageJobCosting = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [jobCostings, setJobCostings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch job costings
    useEffect(() => {
        const fetchJobCostings = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/job-costing`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch job costings');
                const data = await response.json();
                setJobCostings(data);
            } catch (error) {
                toast.error(error.message || 'Failed to load job costings');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobCostings();
    }, []);

    // Delete job costing
    const deleteJobCosting = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job costing?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/job-costing/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete job costing');

            toast.success('Job costing deleted successfully');
            setJobCostings(jobCostings.filter(job => job._id !== id));
        } catch (error) {
            toast.error(error.message || 'Failed to delete job costing');
            console.error(error);
        }
    };

    // Filter job costings based on search term
    const filteredJobCostings = jobCostings.filter(job => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (job.customer_id?.name?.toLowerCase().includes(searchLower)) ||
            (job.site_id?.name?.toLowerCase().includes(searchLower)) ||
            (job.quotation_id?.quotation_number?.toLowerCase().includes(searchLower)) ||
            (job.project_cost?.toString().includes(searchTerm)) ||
            (job.total_cost?.toString().includes(searchTerm))
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredJobCostings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredJobCostings.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 transition-all duration-300">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Manage Job Costings</h1>
                                <p className="text-sm text-gray-500 mt-1">View and manage all job costing records</p>
                            </div>
                            <button
                                onClick={() => navigate('/add-job-costing')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                            >
                                <span>+ New Job Costing</span>
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Search by customer, site, quotation or amount..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Costings Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading job costings...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Cost</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((job) => (
                                                        <tr key={job._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{job.customer_id.customer_name || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-500">{job.site_id?.site_name || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-500">{job.quotation_id?.quotation_id || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 font-medium">{formatCurrency(job.project_cost)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900 font-medium">{formatCurrency(job.total_cost)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className={`text-sm font-medium ${job.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {formatCurrency(job.margin)} ({job.margin_percent?.toFixed(2)}%)
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <div className="flex justify-end space-x-2">
                                                                    <button
                                                                        onClick={() => navigate(`/view-job-costing/${job._id}`)}
                                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                                        title="View"
                                                                    >
                                                                        <Eye className="h-5 w-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate(`/edit-job-costing/${job._id}`)}
                                                                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="h-5 w-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteJobCosting(job._id)}
                                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                            {searchTerm ? 'No matching job costings found' : 'No job costings available'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {filteredJobCostings.length > itemsPerPage && (
                                        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button
                                                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                                        <span className="font-medium">
                                                            {Math.min(indexOfLastItem, filteredJobCostings.length)}
                                                        </span>{' '}
                                                        of <span className="font-medium">{filteredJobCostings.length}</span> results
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                        <button
                                                            onClick={() => paginate(1)}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            <span className="sr-only">First</span>
                                                            <ChevronsLeft className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            <span className="sr-only">Previous</span>
                                                            <ChevronLeft className="h-5 w-5" />
                                                        </button>
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                                            <button
                                                                key={number}
                                                                onClick={() => paginate(number)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                    currentPage === number
                                                                        ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {number}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            <span className="sr-only">Next</span>
                                                            <ChevronRight className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => paginate(totalPages)}
                                                            disabled={currentPage === totalPages}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            <span className="sr-only">Last</span>
                                                            <ChevronsRight className="h-5 w-5" />
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageJobCosting;