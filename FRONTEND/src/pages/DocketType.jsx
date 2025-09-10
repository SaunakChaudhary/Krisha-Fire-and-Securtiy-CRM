import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FiPlus, FiX, FiChevronDown, FiChevronUp, FiTrash2, FiEdit } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-hot-toast'
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const WorkType = () => {
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
        return navigate("/UserUnAuthorized/Manage Docket Type");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isAssociationModalOpen, setIsAssociationModalOpen] = useState(false);
  const [workTypes, setWorkTypes] = useState([]);
  const [currentWorkType, setCurrentWorkType] = useState({ code: '', name: '', associatedDocketTypes: [] });
  const [currentAssociation, setCurrentAssociation] = useState({ name: '', display: true });
  const [currentTypeIndex, setCurrentTypeIndex] = useState(null);
  const [expandedWorkTypes, setExpandedWorkTypes] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  const API_URL = 'http://localhost:5000/api/work-type';

  useEffect(() => {
    fetchWorkTypes();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchWorkTypes = async () => {
    try {
      const res = await axios.get(API_URL);
      setWorkTypes(res.data);
    } catch (err) {
      console.error('Error fetching work types:', err);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!currentWorkType.code || !currentWorkType.name) return alert('Code and Name are required');

      if (currentTypeIndex !== null) {
        // Update
        const updated = await axios.put(`${API_URL}/${workTypes[currentTypeIndex]._id}`, currentWorkType);
        const updatedWorkTypes = [...workTypes];
        updatedWorkTypes[currentTypeIndex] = updated.data;
        setWorkTypes(updatedWorkTypes);
      } else {
        // Create
        const res = await axios.post(API_URL, currentWorkType);
        setWorkTypes([...workTypes, res.data]);
      }
      closeTypeModal();
    } catch (err) {
      console.error('Error saving work type:', err);
      alert(err.response?.data?.msg || 'Something went wrong');
    }
  };

  const addAssociation = async () => {
    try {
      const { name } = currentAssociation;
      if (!name.trim()) return alert('Name is required');

      const workTypeId = workTypes[currentTypeIndex]._id;
      const res = await axios.post(`${API_URL}/${workTypeId}/associations`, currentAssociation);
      const updatedWorkTypes = [...workTypes];
      updatedWorkTypes[currentTypeIndex] = res.data;
      setWorkTypes(updatedWorkTypes);
      closeAssociationModal();
    } catch (err) {
      console.error('Error adding association:', err);
      alert(err.response?.data?.msg || 'Something went wrong');
    }
  };

  const removeAssociation = async (typeIndex, assocId) => {
    try {
      const workTypeId = workTypes[typeIndex]._id;
      const res = await axios.delete(`${API_URL}/${workTypeId}/associations/${assocId}`);
      const updatedWorkTypes = [...workTypes];
      updatedWorkTypes[typeIndex] = res.data;
      setWorkTypes(updatedWorkTypes);
    } catch (err) {
      console.error('Error removing association:', err);
    }
  };

  const toggleAssociationDisplay = async (typeIndex, assocId) => {
    try {
      const updatedWorkTypes = [...workTypes];
      const association = updatedWorkTypes[typeIndex].associatedDocketTypes.find(
        assoc => assoc._id === assocId
      );

      if (!association) {
        throw new Error('Association not found');
      }

      const newDisplayState = !association.display;
      association.display = newDisplayState;
      setWorkTypes(updatedWorkTypes);

      const workTypeId = workTypes[typeIndex]._id;
      await axios.patch(
        `${API_URL}/${workTypeId}/associations/${assocId}/toggle-display`
      );

      toast.success(
        `Association ${newDisplayState ? 'shown' : 'hidden'} successfully`
      );
    } catch (err) {
      console.error('Error toggling association:', err);
      toast.error(err.response?.data?.msg || 'Failed to toggle display status');

      fetchWorkTypes();
    }
  };

  // Modified to ensure only one dropdown is open at a time
  const toggleWorkTypeExpansion = (typeId) => {
    setExpandedWorkTypes(prev => {
      // If the clicked type is already expanded, close it
      if (prev[typeId]) {
        const newState = { ...prev };
        delete newState[typeId];
        return newState;
      } 
      // Otherwise, close all others and open the clicked one
      else {
        return { [typeId]: true };
      }
    });
  };

  const openAddTypeModal = () => {
    setCurrentWorkType({ code: '', name: '', associatedDocketTypes: [] });
    setCurrentTypeIndex(null);
    setIsTypeModalOpen(true);
    // Close any open dropdowns when opening modal
    setExpandedWorkTypes({});
  };

  const openEditTypeModal = (type, index) => {
    setCurrentWorkType({ ...type });
    setCurrentTypeIndex(index);
    setIsTypeModalOpen(true);
    // Close any open dropdowns when opening modal
    setExpandedWorkTypes({});
  };

  const closeTypeModal = () => {
    setIsTypeModalOpen(false);
    setCurrentWorkType({ code: '', name: '', associatedDocketTypes: [] });
  };

  const openAssociationModal = (index) => {
    setCurrentTypeIndex(index);
    setCurrentAssociation({ name: '', display: true });
    setIsAssociationModalOpen(true);
    // Close any open dropdowns when opening modal
    setExpandedWorkTypes({});
  };

  const closeAssociationModal = () => {
    setIsAssociationModalOpen(false);
    setCurrentAssociation({ name: '', display: true });
  };

  const handleTypeInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentWorkType({ ...currentWorkType, [name]: value });
  };

  const handleAssociationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentAssociation({ ...currentAssociation, [name]: type === 'checkbox' ? checked : value });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 bg-gray-100 pt-24 sm:pt-28 p-4 lg:pl-80 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Work Types</h1>
              <button
                onClick={openAddTypeModal}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus /> {!isMobile && 'Add Work Type'}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {workTypes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No work types found. Create your first work type.
                </div>
              ) : isMobile ? (
                // Mobile view - card layout
                <div className="divide-y divide-gray-200">
                  {workTypes.map((type, typeIndex) => (
                    <div key={type._id || type.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-500">{type.code}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditTypeModal(type, typeIndex)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleWorkTypeExpansion(type._id || type.id)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {expandedWorkTypes[type._id || type.id] ? (
                              <FiChevronUp className="mr-1" />
                            ) : (
                              <FiChevronDown className="mr-1" />
                            )}
                            {type.associatedDocketTypes.length} associations
                          </button>
                          <button
                            onClick={() => openAssociationModal(typeIndex)}
                            className="flex items-center text-sm text-green-600 hover:text-green-800"
                          >
                            <FiPlus className="mr-1" /> Add
                          </button>
                        </div>

                        {expandedWorkTypes[type._id || type.id] && (
                          <div className="mt-2 space-y-2">
                            {type.associatedDocketTypes.map((assoc, assocIndex) => (
                              <div
                                key={assoc._id || assocIndex}
                                className={`flex items-center justify-between p-2 rounded-lg ${assoc.display ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'
                                  }`}
                              >
                                <div>
                                  <span className="text-sm font-medium text-gray-800">{assoc.name}</span>
                                  {!assoc.display && (
                                    <span className="ml-2 text-xs text-gray-500">(hidden)</span>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleAssociationDisplay(typeIndex, assoc._id)}
                                    className={`p-1 rounded-md ${assoc.display
                                      ? 'text-green-600 hover:bg-green-100'
                                      : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                    title={assoc.display ? 'Hide from users' : 'Show to users'}
                                  >
                                    {assoc.display ? '✓' : '✗'}
                                  </button>
                                  <button
                                    onClick={() => removeAssociation(typeIndex, assoc._id)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                                    title="Remove association"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop view - table layout
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associations</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workTypes.map((type, typeIndex) => (
                        <React.Fragment key={type._id || type.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleWorkTypeExpansion(type._id || type.id)}
                                  className="flex items-center text-blue-600 hover:text-blue-800 mr-3"
                                >
                                  {expandedWorkTypes[type._id || type.id] ? (
                                    <FiChevronUp className="mr-1" />
                                  ) : (
                                    <FiChevronDown className="mr-1" />
                                  )}
                                  {type.associatedDocketTypes.length} {type.associatedDocketTypes.length === 1 ? 'association' : 'associations'}
                                </button>
                                <button
                                  onClick={() => openAssociationModal(typeIndex)}
                                  className="flex items-center text-sm text-green-600 hover:text-green-800"
                                >
                                  <FiPlus className="mr-1" /> Add
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openEditTypeModal(type, typeIndex)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                            </td>
                          </tr>
                          {expandedWorkTypes[type._id || type.id] && (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {type.associatedDocketTypes.map((assoc, assocIndex) => (
                                    <div
                                      key={assoc._id || assocIndex}
                                      className={`flex items-center justify-between p-3 rounded-lg ${assoc.display ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">{assoc.name}</span>
                                        {!assoc.display && (
                                          <span className="ml-2 text-xs text-gray-500">(hidden)</span>
                                        )}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => toggleAssociationDisplay(typeIndex, assoc._id)}
                                          className={`p-1 rounded-md ${assoc.display
                                            ? 'text-green-600 hover:bg-green-100'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                          title={assoc.display ? 'Hide from users' : 'Show to users'}
                                        >
                                          {assoc.display ? '✓' : '✗'}
                                        </button>
                                        <button
                                          onClick={() => removeAssociation(typeIndex, assoc._id)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                                          title="Remove association"
                                        >
                                          <FiTrash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Work Type Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeTypeModal}>
              <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full animate-slideDown">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {currentTypeIndex !== null ? 'Edit Work Type' : 'Create Work Type'}
                  </h3>
                  <button onClick={closeTypeModal} className="text-gray-400 hover:text-gray-500">
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleTypeSubmit}>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Work Type Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        id="code"
                        value={currentWorkType.code}
                        onChange={handleTypeInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Work Type Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={currentWorkType.name}
                        onChange={handleTypeInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={closeTypeModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Association Modal */}
      {isAssociationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeAssociationModal}>
              <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full animate-slideDown">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add Associated Call/Docket Type
                  </h3>
                  <button onClick={closeAssociationModal} className="text-gray-400 hover:text-gray-500">
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="assocName" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="assocName"
                      value={currentAssociation.name}
                      onChange={handleAssociationInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="display"
                      id="display"
                      checked={currentAssociation.display}
                      onChange={handleAssociationInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="display" className="ml-2 block text-sm text-gray-700">
                      Display to users
                    </label>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={addAssociation}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={closeAssociationModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
  </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WorkType;