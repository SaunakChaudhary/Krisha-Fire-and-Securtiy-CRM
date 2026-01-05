import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FiEdit, FiKey, FiSearch, FiDownload, FiTrash2, FiTool, FiX } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";
import { Upload } from 'lucide-react';

const ManageUsers = () => {
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
            if (!hasPermission("Manage User")) {
                return navigate("/UserUnAuthorized/Manage User");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [accessTypes, setAccessTypes] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const usersPerPage = 10;

    // Fetch users with their access types (excluding Super Admin)
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/active`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Process users and collect unique access types
            const accessTypeSet = new Set();
            const processedUsers = data.users.map(user => {
                if (user.accesstype_id) {
                    accessTypeSet.add(JSON.stringify(user.accesstype_id));
                }

                return {
                    ...user,
                    accesstype: user.accesstype_id?.name || 'Unknown',
                    accesstype_id: user.accesstype_id?._id || null,
                    createdAt: new Date(user.createdAt).toLocaleDateString(),
                };
            });

            setUsers(processedUsers.filter(user => user.accesstype != "Super Admin"));
            setAccessTypes(Array.from(accessTypeSet).map(str => JSON.parse(str)));
        } catch (error) {
            console.error('Error fetching users:', error);
            setFetchError(error.message || 'Failed to load users. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Filter users based on search term
    const filteredUsers = useCallback(() => {
        return users.filter(user =>
            `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    // Pagination logic
    const paginatedUsers = useCallback(() => {
        const indexOfLastUser = currentPage * usersPerPage;
        const indexOfFirstUser = indexOfLastUser - usersPerPage;
        return filteredUsers().slice(indexOfFirstUser, indexOfLastUser);
    }, [currentPage, filteredUsers]);

    const totalPages = Math.ceil(filteredUsers().length / usersPerPage);

    // Export to Excel
    const exportToExcel = useCallback(() => {
        const worksheet = XLSX.utils.json_to_sheet(filteredUsers().map(user => ({
            Name: `${user.firstname} ${user.lastname}`,
            Email: user.email,
            Username: user.username,
            'Access Type': user.accesstype,
            Status: user.status,
            'Created At': user.createdAt,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(workbook, 'users.xlsx');
    }, [filteredUsers]);

    // Validate edit form
    const validateEditForm = useCallback(() => {
        const newErrors = {};
        if (!selectedUser?.firstname?.trim()) newErrors.firstname = 'First name is required';
        if (!selectedUser?.lastname?.trim()) newErrors.lastname = 'Last name is required';
        if (!selectedUser?.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedUser.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!selectedUser?.username?.trim()) newErrors.username = 'Username is required';
        if (!selectedUser?.accesstype_id) newErrors.accesstype_id = 'Access type is required';

        if (selectedUser?.isEngineer) {
            if (!selectedUser.engineerData?.eng_code?.trim()) newErrors.eng_code = 'Engineer code is required';
            if (!selectedUser.engineerData?.skill_level) newErrors.skill_level = 'Skill level is required';
            if (selectedUser.engineerData?.commission && isNaN(selectedUser.engineerData.commission)) {
                newErrors.commission = 'Commission must be a number';
            }
            if (selectedUser.engineerData?.latitude && isNaN(selectedUser.engineerData.latitude)) {
                newErrors.latitude = 'Latitude must be a number';
            }
            if (selectedUser.engineerData?.longitude && isNaN(selectedUser.engineerData.longitude)) {
                newErrors.longitude = 'Longitude must be a number';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [selectedUser]);

    // Handle edit user
    const handleEdit = useCallback(async (user) => {
        setIsLoading(true);
        try {
            let engineerData = {};
            if (user.accesstype.toLowerCase().includes('engineer')) {
                const engineerResponse = await fetch(`${import.meta.env.VITE_API_URL}/user/engineer/${user._id}`);
                if (!engineerResponse.ok) {
                    throw new Error('Failed to fetch engineer data');
                }
                engineerData = await engineerResponse.json();
                engineerData.latest_location_date = engineerData.latest_location_date
                    ? new Date(engineerData.latest_location_date).toISOString().slice(0, 16)
                    : '';
            }

            setSelectedUser({
                ...user,
                isEngineer: user.accesstype.toLowerCase().includes('engineer'),
                engineerData: user.accesstype.toLowerCase().includes('engineer') ? engineerData : {},
            });
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error fetching engineer data:', error);
            setErrors(prev => ({ ...prev, api: 'Failed to load engineer data. Please try again.' }));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle engineer field changes
    const handleEngineerChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setSelectedUser(prev => ({
            ...prev,
            engineerData: {
                ...prev.engineerData,
                [name]: type === 'checkbox' ? checked : value,
            },
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    }, [errors]);

    // Save edited user
    const handleSaveEdit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateEditForm()) return;

        try {
            const payload = {
                firstname: selectedUser.firstname,
                lastname: selectedUser.lastname,
                email: selectedUser.email,
                username: selectedUser.username,
                accesstype_id: selectedUser.accesstype_id,
                status: selectedUser.status,
                isEngineer: selectedUser.isEngineer,
            };

            if (selectedUser.isEngineer) {
                payload.engineerData = selectedUser.engineerData;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${selectedUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || responseData.errors?.join(', ') || 'Failed to update user');
            }

            setUsers(prevUsers => prevUsers.map(user =>
                user._id === selectedUser._id
                    ? {
                        ...selectedUser,
                        accesstype: accessTypes.find(type => type._id === selectedUser.accesstype_id)?.name || 'Unknown',
                    }
                    : user
            ));

            setIsEditModalOpen(false);
            setErrors({});
        } catch (error) {
            console.error('Error updating user:', error);
            setErrors(prev => ({ ...prev, api: error.message }));
        }
    }, [selectedUser, accessTypes, validateEditForm]);

    // Handle change password
    const handleChangePassword = useCallback((user) => {
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
    }, []);

    // Save new password
    const handleSavePassword = useCallback(async (e) => {
        e.preventDefault();
        const newPassword = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;

        const newErrors = {};
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (newPassword.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${selectedUser._id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: newPassword }),
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to change password');
            }

            setIsPasswordModalOpen(false);
            setErrors({});
        } catch (error) {
            console.error('Error changing password:', error);
            setErrors(prev => ({ ...prev, api: error.message }));
        }
    }, [selectedUser]);

    // Pagination controls
    const PaginationControls = () => (
        <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers().length)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * usersPerPage, filteredUsers().length)}</span> of{' '}
                <span className="font-medium">{filteredUsers().length}</span> users
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Previous
                </button>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );

    // User table row component
    const UserTableRow = ({ user }) => (
        <tr key={user._id} className="hover:bg-gray-50">
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.firstname} {user.lastname}</div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.accesstype}
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt}</td>
            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit"
                    >
                        <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleChangePassword(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                        title="Change Password"
                    >
                        <FiKey className="h-5 w-5" />
                    </button>
                </div>
            </td>
        </tr>
    );

    // User card component for mobile view
    const UserCard = ({ user }) => (
        <div key={user._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{user.firstname} {user.lastname}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Username</p>
                    <p>{user.username}</p>
                </div>
                <div>
                    <p className="text-gray-500">Access</p>
                    <p className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 inline-block">
                        {user.accesstype}
                    </p>
                </div>
                <div>
                    <p className="text-gray-500">Created</p>
                    <p>{user.createdAt}</p>
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
                <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                >
                    <FiEdit className="h-5 w-5" />
                </button>
                <button
                    onClick={() => handleChangePassword(user)}
                    className="text-yellow-600 hover:text-yellow-800 p-1"
                    title="Change Password"
                >
                    <FiKey className="h-5 w-5" />
                </button>
            </div>
        </div>
    );

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // first sheet
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet); // Excel → JSON

                // Send to backend
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/user/bulk-upload`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(parsedData),
                    }
                );

                const data1 = await response.json()
                if (response.ok) {
                    fetchUsers(); 
                } else {
                    const errorData = await response.json();
                    console.error("Failed to upload users:", errorData);
                }
            } catch (err) {
                console.error("Error processing file:", err);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-8 transition-all duration-300">
                    <div className="max-w-2xl sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Users</h1>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiSearch className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={exportToExcel}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-4 py-2 flex items-center justify-center gap-2"
                                    title="Export to Excel"
                                >
                                    <FiDownload />
                                    <span>Export</span>
                                </button>
                                <div className="flex items-center space-x-3 bg-white shadow-sm border rounded-lg px-4 py-2 w-fit">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                    <label
                                        htmlFor="fileInput"
                                        className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        Upload Excel File
                                    </label>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="font-semibold mb-4 text-gray-600">
                            No of Users: {filteredUsers().length}
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                        <div className="h-3 w-48 bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : fetchError ? (
                                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                                    {fetchError}
                                </div>
                            ) : paginatedUsers().length > 0 ? (
                                paginatedUsers().map(user => <UserCard key={user._id} user={user} />)
                            ) : (
                                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                                    No users found matching your search criteria.
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    <div className="flex justify-center items-center">
                                                        <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Loading users...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : fetchError ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-red-600">
                                                    {fetchError}
                                                </td>
                                            </tr>
                                        ) : paginatedUsers().length > 0 ? (
                                            paginatedUsers().map(user => <UserTableRow key={user._id} user={user} />)
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No users found matching your search criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredUsers().length > usersPerPage && <PaginationControls />}
                        </div>
                    </div>
                </main>
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-2 px-2">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg my-10 animate-slideDown h-[92%] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Edit User</h2>
                        {errors.api && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                {errors.api}
                            </div>
                        )}
                        <form onSubmit={handleSaveEdit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full border ${errors.firstname ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        value={selectedUser?.firstname || ''}
                                        onChange={(e) => {
                                            setSelectedUser(prev => ({ ...prev, firstname: e.target.value }));
                                            if (errors.firstname) setErrors(prev => ({ ...prev, firstname: null }));
                                        }}
                                    />
                                    {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full border ${errors.lastname ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        value={selectedUser?.lastname || ''}
                                        onChange={(e) => {
                                            setSelectedUser(prev => ({ ...prev, lastname: e.target.value }));
                                            if (errors.lastname) setErrors(prev => ({ ...prev, lastname: null }));
                                        }}
                                    />
                                    {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className={`w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        value={selectedUser?.email || ''}
                                        onChange={(e) => {
                                            setSelectedUser(prev => ({ ...prev, email: e.target.value }));
                                            if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                                        }}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        value={selectedUser?.username || ''}
                                        onChange={(e) => {
                                            setSelectedUser(prev => ({ ...prev, username: e.target.value }));
                                            if (errors.username) setErrors(prev => ({ ...prev, username: null }));
                                        }}
                                    />
                                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Access Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`w-full border ${errors.accesstype_id ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        value={selectedUser?.accesstype_id || ''}
                                        onChange={(e) => {
                                            const newAccessTypeId = e.target.value;
                                            const isEngineer = accessTypes.find(type => type._id === newAccessTypeId)?.name.toLowerCase().includes('engineer') || false;
                                            setSelectedUser(prev => ({
                                                ...prev,
                                                accesstype_id: newAccessTypeId,
                                                isEngineer,
                                                engineerData: isEngineer ? (prev.engineerData || {}) : {},
                                            }));
                                            if (errors.accesstype_id) setErrors(prev => ({ ...prev, accesstype_id: null }));
                                        }}
                                    >
                                        <option value="">Select access type</option>
                                        {accessTypes.map(type => (
                                            <option key={type._id} value={type._id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.accesstype_id && <p className="mt-1 text-sm text-red-600">{errors.accesstype_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={selectedUser?.status || 'active'}
                                        onChange={(e) => setSelectedUser(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {selectedUser?.isEngineer && (
                                    <div className="mt-6 border-t pt-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <FiTool className="mr-2" />
                                            Engineer Details
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Engineer Code <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="eng_code"
                                                    className={`w-full border ${errors.eng_code ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedUser?.engineerData?.eng_code || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                                {errors.eng_code && <p className="mt-1 text-sm text-red-600">{errors.eng_code}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Skill Level <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="skill_level"
                                                    className={`w-full border ${errors.skill_level ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedUser?.engineerData?.skill_level || ''}
                                                    onChange={handleEngineerChange}
                                                >
                                                    <option value="">Select skill level</option>
                                                    <option value="beginner">Beginner</option>
                                                    <option value="intermediate">Intermediate</option>
                                                    <option value="advanced">Advanced</option>
                                                    <option value="expert">Expert</option>
                                                    <option value="Senior">Senior</option>
                                                </select>
                                                {errors.skill_level && <p className="mt-1 text-sm text-red-600">{errors.skill_level}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                                                <input
                                                    type="number"
                                                    name="commission"
                                                    step="0.01"
                                                    className={`w-full border ${errors.commission ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedUser?.engineerData?.commission || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                                {errors.commission && <p className="mt-1 text-sm text-red-600">{errors.commission}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                                <select
                                                    name="current_status"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.current_status || ''}
                                                    onChange={handleEngineerChange}
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="busy">Busy</option>
                                                    <option value="offline">Offline</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="over_time"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={selectedUser?.engineerData?.over_time || false}
                                                    onChange={handleEngineerChange}
                                                />
                                                <label className="ml-2 block text-sm text-gray-700">Eligible for Overtime</label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                                                <input
                                                    type="text"
                                                    name="address_line1"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.address_line1 || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                                <input
                                                    type="text"
                                                    name="address_line2"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.address_line2 || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                                                <input
                                                    type="text"
                                                    name="address_line3"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.address_line3 || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 4</label>
                                                <input
                                                    type="text"
                                                    name="address_line4"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.address_line4 || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Post Code</label>
                                                <input
                                                    type="text"
                                                    name="postcode"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.postcode || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Latest Location Date</label>
                                                <input
                                                    type="datetime-local"
                                                    name="latest_location_date"
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={selectedUser?.engineerData?.latest_location_date || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                                <input
                                                    type="number"
                                                    name="latitude"
                                                    step="any"
                                                    className={`w-full border ${errors.latitude ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedUser?.engineerData?.latitude || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                                {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                                <input
                                                    type="number"
                                                    name="longitude"
                                                    step="any"
                                                    className={`w-full border ${errors.longitude ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                    value={selectedUser?.engineerData?.longitude || ''}
                                                    onChange={handleEngineerChange}
                                                />
                                                {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setErrors({});
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-10 px-2">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slideDown">
                        <h2 className="text-xl font-bold mb-4">Change Password for {selectedUser?.firstname} {selectedUser?.lastname}</h2>
                        {errors.api && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                {errors.api}
                            </div>
                        )}
                        <form onSubmit={handleSavePassword}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        className={`w-full border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className={`w-full border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPasswordModalOpen(false);
                                        setErrors({});
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;