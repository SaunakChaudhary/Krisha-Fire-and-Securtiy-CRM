import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthContext } from "../Context/AuthContext";

const SetUserPermission = () => {
  const { user } = useContext(AuthContext);
  
  const [sidebarOpen, setSideOpen] = useState(false);
  const [accessTypes, setAccessTypes] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [currentPermissions, setCurrentPermissions] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const menuItems = [
    "Dashboard",
    "Manage User",
    "Manage Company",
    "Manage Customer",
    "Manage Site",
    "Manage Sales Enquiry",
    "Manage Quotation",
    "Manage Job Costing",
    "Manage System Code",
    "Manage Call",
    "Manage Diary",
    "Manage Supplier",
    "Manage Stock",
    "Manage Purchase Order",
    "Manage Reports",
    "Manage Cabinet",
  ];

  // Initialize permissions structure
  const initializePermissions = (accessTypesData) => {
    const initialPermissions = {};
    menuItems.forEach(item => {
      initialPermissions[item] = {};
      accessTypesData.forEach(accessType => {
        initialPermissions[item][accessType._id] = false;
      });
    });
    return initialPermissions;
  };

  // Fetch access types and existing permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch access types
        const accessTypesResponse = await fetch(`${import.meta.env.VITE_API_URL}/access-types`);
        if (!accessTypesResponse.ok) {
          throw new Error('Failed to fetch access types');
        }
        const accessTypesData = await accessTypesResponse.json();
        setAccessTypes(accessTypesData.filter((at)=> at.name != "Engineer"));

        // Fetch existing permissions
        const permissionsResponse = await fetch(`${import.meta.env.VITE_API_URL}/permissions`);
        if (!permissionsResponse.ok) {
          throw new Error('Failed to fetch permissions');
        }
        const permissionsData = await permissionsResponse.json();
        setCurrentPermissions(permissionsData);

        if (permissionsData.length > 0) {
          // Convert permissions data to the format expected by the component
          const formattedPermissions = initializePermissions(accessTypesData);

          permissionsData.forEach(perm => {
            Object.keys(perm.permissions).forEach(feature => {
              if (formattedPermissions[feature]) {
                // Make sure we're using the role ID as a string
                formattedPermissions[feature][String(perm.role._id || perm.role)] = perm.permissions[feature];
              }
            });
          });

          setPermissions(formattedPermissions);
        } else {
          // Initialize empty permissions if none exist
          setPermissions(initializePermissions(accessTypesData));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePermissionChange = (feature, accessTypeId) => {
    setPermissions(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [accessTypeId]: !prev[feature]?.[accessTypeId]
      }
    }));
  };

  const handleSelectAll = (accessTypeId, select = true) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };

      Object.keys(prev).forEach(feature => {
        if (!newPermissions[feature]) {
          newPermissions[feature] = {};
        }
        newPermissions[feature][accessTypeId] = select;
      });

      return newPermissions;
    });
  };

  const handleSave = async () => {
    setSaveStatus("saving");

    try {
      const permissionsToSave = {};

      // Group permissions by role
      Object.keys(permissions).forEach((feature) => {
        Object.keys(permissions[feature]).forEach((roleId) => {
          const cleanRoleId = String(roleId);

          // Skip invalid role IDs
          if (!cleanRoleId || cleanRoleId === "[object Object]" || cleanRoleId === "null") {
            console.warn("Skipping invalid roleId:", roleId);
            return;
          }

          if (!permissionsToSave[cleanRoleId]) {
            permissionsToSave[cleanRoleId] = {};
          }
          permissionsToSave[cleanRoleId][feature] = permissions[feature][roleId];
        });
      });

      // Try to update or create each permission
      const updatePromises = Object.keys(permissionsToSave).map(async (roleId) => {
        try {
          // First try to update existing permission
          const updateResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/permissions/${roleId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                permissions: permissionsToSave[roleId],
                updatedBy: String(user?.user?._id || user._id),
              }),
            }
          );

          if (updateResponse.ok) {
            return updateResponse.json();
          }

          // If update fails, try to create new permission
          const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/permissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: roleId,
              permissions: permissionsToSave[roleId],
              createdBy: String(user.user._id),
            }),
          });

          if (!createResponse.ok) {
            const data = await createResponse.json();
            throw new Error(data.message || "Failed to create permission");
          }

          return createResponse.json();
        } catch (error) {
          console.error(`Error processing role ${roleId}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      setSaveStatus("success");

      // Refresh permissions
      const permissionsResponse = await fetch(`${import.meta.env.VITE_API_URL}/permissions`);
      const permissionsData = await permissionsResponse.json();
      setCurrentPermissions(permissionsData);
    } catch (error) {
      console.error("Error saving permissions:", error);
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  // Toggle permissions display
  const togglePermissionsDisplay = () => {
    setShowPermissions(!showPermissions);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
          <main className="flex-1 bg-gray-50 mt-16 p-4 lg:ml-64 flex items-center justify-center">
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-blue-500" role="status"></div>
              <p className="mt-2 text-gray-600">Loading permissions...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
        <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}

            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Manage User</h1>
                <p className="text-gray-600">Set permissions for different user roles</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={togglePermissionsDisplay}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  {showPermissions ? 'Hide Current Permissions' : 'Show Current Permissions'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-75 text-sm"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : saveStatus === 'success' ? (
                    'Saved Successfully'
                  ) : saveStatus === 'error' ? (
                    'Error Saving'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>

            {/* Current Permissions Display */}
            {showPermissions && currentPermissions && currentPermissions.length > 0 && (
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPermissions.map((perm, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        {perm.role?.name || `Role ID: ${perm.role}`}
                      </h4>
                      <div className="max-h-60 overflow-y-auto">
                        {Object.entries(perm.permissions).map(([feature, hasAccess]) => (
                          <div key={feature} className="flex items-center justify-between py-1 border-b border-gray-100">
                            <span className="text-sm text-gray-600">{feature}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${hasAccess
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {hasAccess ? 'Yes' : 'No'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(perm.updatedAt || perm.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated Info */}
            {currentPermissions && currentPermissions.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Last updated: {new Date(currentPermissions[0].updatedAt || currentPermissions[0].createdAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Permissions Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-700">User Permission</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="text-left p-4 font-medium text-gray-600 text-sm uppercase tracking-wide">
                        Menu
                      </th>
                      {accessTypes.map(accessType => (
                        <th key={accessType._id} className="p-4 font-medium text-gray-600 text-sm uppercase tracking-wide text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium mb-1`}>
                              {accessType.name}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleSelectAll(accessType._id, true)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Select All
                              </button>
                              <span className="text-gray-400">|</span>
                              <button
                                onClick={() => handleSelectAll(accessType._id, false)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Unselect All
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {menuItems.map((item, itemIndex) => (
                      <tr key={itemIndex} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-700 text-sm">
                          {itemIndex === 0 ? <strong>{item}</strong> : item}
                        </td>
                        {accessTypes.map(accessType => (
                          <td key={accessType._id} className="p-4 text-center">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                checked={permissions[item]?.[accessType._id] || false}
                                onChange={() => handlePermissionChange(item, accessType._id)}
                              />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SetUserPermission;