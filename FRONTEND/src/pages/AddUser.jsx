import React, { useState, useEffect, useContext } from 'react';
import { FiUser, FiMail, FiLock, FiTool, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { AuthContext } from "../Context/AuthContext";

const AddUser = () => {
  const { userid } = useParams();
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
      if (!hasPermission("Manage User")) {
        return navigate("/UserUnAuthorized/Manage User");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!userid);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    accesstype_id: '',
    status: 'active',
    isEngineer: false,
  });
  const [engineerData, setEngineerData] = useState({
    eng_code: '',
    skill_level: 'beginner',
    commission: '',
    current_status: 'available',
    over_time: false,
    address_line1: '',
    address_line2: '',
    address_line3: '',
    address_line4: '',
    postcode: '',
    latest_location_date: '',
    latitude: '',
    longitude: '',
  });
  const [accessTypes, setAccessTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingAccessTypes, setLoadingAccessTypes] = useState(true);
  const [loadingUser, setLoadingUser] = useState(isEditMode);

  // Fetch access types and user data (for edit mode)
  useEffect(() => {
    const fetchAccessTypes = async () => {
      try {
        setLoadingAccessTypes(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/access-types/`);
        if (!response.ok) throw new Error('Failed to fetch access types');
        const data = await response.json();
        setAccessTypes(data.filter(dt => dt.status === "active"));
      } catch (error) {
        console.error('Error fetching access types:', error);
        setErrors(prev => ({ ...prev, accessTypes: 'Failed to load access types. Please try again later.' }));
      } finally {
        setLoadingAccessTypes(false);
      }
    };

    const fetchUserData = async () => {
      if (!userid) return;
      try {
        setLoadingUser(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userid}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setFormData({
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          email: data.email || '',
          username: data.username || '',
          password: '', // Password not fetched for security
          accesstype_id: data.accesstype_id || '',
          status: data.status || 'active',
          isEngineer: !!data.isEngineer,
        });
        if (data.isEngineer) {
          const engineerResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/engineer/user/${userid}`);
          if (engineerResponse.ok) {
            const engineer = await engineerResponse.json();
            setEngineerData({
              eng_code: engineer.eng_code || '',
              skill_level: engineer.skill_level || 'beginner',
              commission: engineer.commission || '',
              current_status: engineer.current_status || 'available',
              over_time: engineer.over_time || false,
              address_line1: engineer.address_line1 || '',
              address_line2: engineer.address_line2 || '',
              address_line3: engineer.address_line3 || '',
              address_line4: engineer.address_line4 || '',
              postcode: engineer.postcode || '',
              latest_location_date: engineer.latest_location_date ? new Date(engineer.latest_location_date).toISOString().slice(0, 16) : '',
              latitude: engineer.latitude || '',
              longitude: engineer.longitude || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrors(prev => ({ ...prev, api: 'Failed to load user data. Please try again.' }));
      } finally {
        setLoadingUser(false);
      }
    };

    fetchAccessTypes();
    if (isEditMode) fetchUserData();
  }, [userid]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'accesstype_id') {
      const selectedType = accessTypes.find(type => type._id === value);
      const isEngineer = selectedType?.name.toLowerCase().includes('engineer');
      setFormData({ ...formData, [name]: value, isEngineer });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleEngineerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEngineerData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required';
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isEditMode && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.accesstype_id) newErrors.accesstype_id = 'Access type is required';
    if (formData.isEngineer) {
      if (!engineerData.eng_code.trim()) newErrors.eng_code = 'Engineer code is required';
      if (!engineerData.skill_level) newErrors.skill_level = 'Skill level is required';
      if (engineerData.commission && isNaN(engineerData.commission)) newErrors.commission = 'Commission must be a number';
      if (engineerData.latitude && isNaN(engineerData.latitude)) newErrors.latitude = 'Latitude must be a number';
      if (engineerData.longitude && isNaN(engineerData.longitude)) newErrors.longitude = 'Longitude must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        ...formData,
        ...(formData.isEngineer && { engineerData }),
      };
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/user/${userid}`
        : `${import.meta.env.VITE_API_URL}/api/user/`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || responseData.errors?.join(', ') || 'Failed to save user');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (!isEditMode) {
          setFormData({
            firstname: '', lastname: '', email: '', username: '', password: '',
            accesstype_id: '', status: 'active', isEngineer: false,
          });
          setEngineerData({
            eng_code: '', skill_level: 'beginner', commission: '', current_status: 'available',
            over_time: false, address_line1: '', address_line2: '', address_line3: '',
            address_line4: '', postcode: '', latest_location_date: '', latitude: '', longitude: '',
          });
        }
        if (isEditMode) navigate('/users'); // Redirect to user list after edit
      }, 3000);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} user:`, error);
      setErrors({ ...errors, api: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${userid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to delete user');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/users'); // Redirect to user list after deletion
      }, 2000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrors({ ...errors, api: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
          <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
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
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {isEditMode ? 'Edit User' : 'Add New User'}
              </h1>
              {isEditMode && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <FiTrash2 className="mr-2" />
                  Delete User
                </button>
              )}
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
                <FiCheckCircle className="mr-2" />
                {isEditMode ? 'User updated successfully!' : 'User added successfully!'}
              </div>
            )}

            {errors.api && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      className={`pl-10 w-full border ${errors.firstname ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>}
                </div>

                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      className={`pl-10 w-full border ${errors.lastname ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`pl-10 w-full border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                {!isEditMode && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 w-full border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter password"
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="accesstype_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Access Type <span className="text-red-500">*</span>
                  </label>
                  {loadingAccessTypes ? (
                    <div className="w-full border border-gray-300 rounded-lg py-2 px-3 bg-gray-100 animate-pulse h-10"></div>
                  ) : (
                    <>
                      <select
                        id="accesstype_id"
                        name="accesstype_id"
                        value={formData.accesstype_id}
                        onChange={handleChange}
                        className={`w-full border ${errors.accesstype_id ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        disabled={loadingAccessTypes}
                      >
                        <option value="">Select access type</option>
                        {accessTypes.map((type) => (
                          <option key={type._id} value={type._id}>{type.name}</option>
                        ))}
                      </select>
                      {errors.accesstype_id && <p className="mt-1 text-sm text-red-600">{errors.accesstype_id}</p>}
                      {errors.accessTypes && <p className="mt-1 text-sm text-red-600">{errors.accessTypes}</p>}
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {formData.isEngineer && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FiTool className="mr-2" />
                    Engineer Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="eng_code" className="block text-sm font-medium text-gray-700 mb-1">
                        Engineer Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="eng_code"
                        name="eng_code"
                        value={engineerData.eng_code}
                        onChange={handleEngineerChange}
                        className={`w-full border ${errors.eng_code ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter engineer code"
                      />
                      {errors.eng_code && <p className="mt-1 text-sm text-red-600">{errors.eng_code}</p>}
                    </div>

                    <div>
                      <label htmlFor="skill_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="skill_level"
                        name="skill_level"
                        value={engineerData.skill_level}
                        onChange={handleEngineerChange}
                        className={`w-full border ${errors.skill_level ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      {errors.skill_level && <p className="mt-1 text-sm text-red-600">{errors.skill_level}</p>}
                    </div>

                    <div>
                      <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">
                        Commission
                      </label>
                      <input
                        type="number"
                        id="commission"
                        name="commission"
                        value={engineerData.commission}
                        onChange={handleEngineerChange}
                        step="0.01"
                        className={`w-full border ${errors.commission ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter commission"
                      />
                      {errors.commission && <p className="mt-1 text-sm text-red-600">{errors.commission}</p>}
                    </div>

                    <div>
                      <label htmlFor="current_status" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Status
                      </label>
                      <select
                        id="current_status"
                        name="current_status"
                        value={engineerData.current_status}
                        onChange={handleEngineerChange}
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="over_time"
                        name="over_time"
                        checked={engineerData.over_time}
                        onChange={handleEngineerChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="over_time" className="ml-2 block text-sm text-gray-700">
                        Eligible for Overtime
                      </label>
                    </div>

                    {['address_line1', 'address_line2', 'address_line3', 'address_line4'].map((field, index) => (
                      <div key={field} className="md:col-span-2">
                        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line {index + 1}
                        </label>
                        <input
                          type="text"
                          id={field}
                          name={field}
                          value={engineerData[field]}
                          onChange={handleEngineerChange}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Enter address line ${index + 1}`}
                        />
                      </div>
                    ))}

                    <div>
                      <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                        Post Code
                      </label>
                      <input
                        type="text"
                        id="postcode"
                        name="postcode"
                        value={engineerData.postcode}
                        onChange={handleEngineerChange}
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter post code"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="latest_location_date" className="block text-sm font-medium text-gray-700 mb-1">
                          Latest Location Date
                        </label>
                        <input
                          type="datetime-local"
                          id="latest_location_date"
                          name="latest_location_date"
                          value={engineerData.latest_location_date}
                          onChange={handleEngineerChange}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          id="latitude"
                          name="latitude"
                          value={engineerData.latitude}
                          onChange={handleEngineerChange}
                          step="any"
                          className={`w-full border ${errors.latitude ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Enter latitude"
                        />
                        {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                      </div>
                      <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          id="longitude"
                          name="longitude"
                          value={engineerData.longitude}
                          onChange={handleEngineerChange}
                          step="any"
                          className={`w-full border ${errors.longitude ? 'border-red-300' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Enter longitude"
                        />
                        {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? (formData.isEngineer ? 'Updating Engineer...' : 'Updating User...') : (formData.isEngineer ? 'Adding Engineer...' : 'Adding User...')}
                    </>
                  ) : (
                    isEditMode ? (formData.isEngineer ? 'Update Engineer' : 'Update User') : (formData.isEngineer ? 'Add Engineer' : 'Add User')
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddUser;