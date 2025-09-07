import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const ReferenceCode = () => {
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
            if (!hasPermission("Manage System Code")) {
                return navigate("/UserUnAuthorized/Manage Reference Code");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [referenceList, setReferenceList] = useState([]);
    const [newReference, setNewReference] = useState({
        code: '',
        name: '',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!selectedCategory) return;

        const fetchReferences = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes/category/${selectedCategory}`);
                const data = await res.json();
                setReferenceList(data);
            } catch (err) {
                console.error('Failed to fetch references:', err);
            }
        };

        fetchReferences();
    }, [selectedCategory]);

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setReferenceList([]);
        setEditingId(null);
        setIsEditing(false);
    };

    const handleAddReference = () => {
        setNewReference({ code: '', name: '', description: '' });
        setEditingId(null);
        setIsEditing(false);
        setShowAddModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReference(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory) return;

        try {
            let res;
            if (isEditing && editingId) {
                // Update existing reference
                res = await fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newReference,
                        category: selectedCategory,
                    })
                });
            } else {
                res = await fetch(`${import.meta.env.VITE_API_URL}/api/reference-codes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newReference,
                        category: selectedCategory,
                    })
                });
            }

            if (!res.ok) throw new Error(isEditing ? 'Failed to update reference' : 'Failed to add reference');
            const result = await res.json();

            if (isEditing) {
                setReferenceList(prev => prev.map(item =>
                    item._id === editingId ? result : item
                ));
            } else {
                setReferenceList(prev => [...prev, result]);
            }

            setNewReference({ code: '', name: '', description: '' });
            setShowAddModal(false);
            setEditingId(null);
            setIsEditing(false);
        } catch (err) {
            console.log(err);
        }
    };

    const handleEdit = (id) => {
        const referenceToEdit = referenceList.find(item => item._id === id);
        if (referenceToEdit) {
            setNewReference({
                code: referenceToEdit.code,
                name: referenceToEdit.name,
                description: referenceToEdit.description
            });
            setEditingId(id);
            setIsEditing(true);
            setShowAddModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reference Code Management</h1>

                        {/* Dropdown and Add Button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                            <div className="relative w-full sm:w-64">
                                <select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" disabled>Select Reference Category</option>
                                    <option value="sourceLead">Source Lead</option>
                                    <option value="salesEnquiryWon">Sales Enquiry Won Reason</option>
                                    <option value="salesEnquiryLost">Sales Enquiry Lost Reason</option>
                                    <option value="callWaitingReason">Call Waiting Reason</option>
                                    <option value="productGroup">Product Group</option>
                                    <option value="ManufacturerCode">Manufacturer Code</option>
                                    <option value="callType">Call Type</option>
                                    <option value="callReason">Call Reason</option>
                                    <option value="TypeOfWork">Type of Work</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDown className="text-gray-500" />
                                </div>
                            </div>

                            <button
                                onClick={handleAddReference}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                <Plus size={18} className="mr-2" />
                                Add Reference
                            </button>
                        </div>

                        {/* Table */}
                        {selectedCategory && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {referenceList.map((item) => (
                                            <tr key={item._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEdit(item._id)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Add/Edit Reference Modal */}
                        {showAddModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-7">
                                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-slideDown">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {isEditing ? 'Edit Reference' : 'Add New Reference'}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setEditingId(null);
                                                setIsEditing(false);
                                            }}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                            <input
                                                type="text"
                                                name="code"
                                                value={newReference.code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={newReference.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                name="description"
                                                value={newReference.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddModal(false);
                                                    setEditingId(null);
                                                    setIsEditing(false);
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                {isEditing ? 'Update' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ReferenceCode;