import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FiEdit, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const System = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systems, setSystems] = useState([]);
  const [filteredSystems, setFilteredSystems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSystem, setCurrentSystem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const productFilterGroups = [
    'Corrective Maintenance',
    'Equipment',
    'Monitoring Charge',
    'Preventative Maintenance'
  ];

  const alarmReportingCategory = ['Intruder', 'Fire', 'CCTV', 'none'];

  const fetchSystems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/systems`);
      if (!response.ok) throw new Error('Failed to fetch systems');
      const data = await response.json();
      setSystems(data.systems);
      setFilteredSystems(data.systems);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  useEffect(() => {
    const results = systems.filter(system =>
      system.systemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (system.description && system.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSystems(results);
  }, [searchTerm, systems]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const openAddModal = () => {
    setCurrentSystem({
      systemCode: '',
      systemName: '',
      description: '',
      referenceOnlySystem: false,
      active: true,
      productFilterGroup: 'Corrective Maintenance',
      alarmReportingCategory: 'none'
    });
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (system) => {
    setCurrentSystem({ ...system });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSystem(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentSystem({
      ...currentSystem,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const method = currentSystem._id ? 'PATCH' : 'POST';
      const url = currentSystem._id
        ? `${import.meta.env.VITE_API_URL}/api/systems/${currentSystem._id}`
        : `${import.meta.env.VITE_API_URL}/api/systems`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSystem)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save system');
      }

      const savedSystem = await response.json();

      if (currentSystem._id) {
        setSystems(systems.map(sys =>
          sys._id === savedSystem.system._id ? savedSystem.system : sys
        ));
      } else {
        setSystems([...systems, savedSystem.system]);
      }

      closeModal();
    } catch (err) {
      setError(err.message);
      console.log(err)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile card view for systems
  const SystemCard = ({ system }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{system.systemName}</h3>
          <p className="text-sm text-gray-500">{system.systemCode}</p>
        </div>
        <button
          onClick={() => openEditModal(system)}
          className="text-blue-600 hover:text-blue-800"
        >
          <FiEdit size={18} />
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{system.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${system.referenceOnlySystem ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {system.referenceOnlySystem ? 'Reference Only' : 'Not Reference'}
        </span>
        <span className={`px-2 py-1 text-xs rounded-full ${system.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {system.active ? 'Active' : 'Inactive'}
        </span>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          {system.productFilterGroup}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
        <main className="flex-1 pt-20 sm:pt-28 pb-4 px-2 sm:px-4 lg:pl-72">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">System Management</h1>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="relative flex-grow max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search systems..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <FiPlus size={18} />
                    <span className="hidden sm:inline">Add System</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 sm:p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm sm:text-base">
                  <p>{error}</p>
                </div>
              )}

              {isMobile ? (
                <div className="space-y-3">
                  {filteredSystems.length > 0 ? (
                    filteredSystems.map((system) => (
                      <SystemCard key={system._id} system={system} />
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 bg-white rounded-lg border border-gray-200">
                      No systems found
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSystems.length > 0 ? (
                        filteredSystems.map((system) => (
                          <tr key={system._id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{system.systemCode}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{system.systemName}</td>
                            <td className="hidden sm:table-cell px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{system.description}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${system.referenceOnlySystem ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {system.referenceOnlySystem ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${system.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {system.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openEditModal(system)}
                                className="text-blue-600 hover:text-blue-900"
                                aria-label="Edit system"
                              >
                                <FiEdit size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                            No systems found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
              <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full mx-2 sm:mx-auto animate-slideDown">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {currentSystem._id ? 'Edit System' : 'Add New System'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    aria-label="Close modal"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="systemCode" className="block text-sm font-medium text-gray-700">
                        System Code *
                      </label>
                      <input
                        type="text"
                        name="systemCode"
                        id="systemCode"
                        value={currentSystem.systemCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="systemName" className="block text-sm font-medium text-gray-700">
                        System Name *
                      </label>
                      <input
                        type="text"
                        name="systemName"
                        id="systemName"
                        value={currentSystem.systemName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={currentSystem.description || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="referenceOnlySystem"
                          id="referenceOnlySystem"
                          checked={currentSystem.referenceOnlySystem}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="referenceOnlySystem" className="ml-2 block text-sm text-gray-700">
                          Reference Only
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="active"
                          id="active"
                          checked={currentSystem.active}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                          Active
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="productFilterGroup" className="block text-sm font-medium text-gray-700">
                        Product Filter Group *
                      </label>
                      <select
                        name="productFilterGroup"
                        id="productFilterGroup"
                        value={currentSystem.productFilterGroup}
                        onChange={handleInputChange}
                        className="mt-1 block border w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        required
                      >
                        {productFilterGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="alarmReportingCategory" className="block text-sm font-medium text-gray-700">
                        Alarm Reporting Category
                      </label>
                      <select
                        name="alarmReportingCategory"
                        id="alarmReportingCategory"
                        value={currentSystem.alarmReportingCategory || 'none'}
                        onChange={handleInputChange}
                        className="mt-1 block border w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        {alarmReportingCategory.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default System;