import React, { useState, useEffect, useContext } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  format,
  addDays,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Notebook,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { AuthContext } from "../Context/AuthContext";

const Diary = () => {
  const { user } = useContext(AuthContext);

  // URL parameters
  const { engineer_id, call_no } = useParams();
  const [searchParams] = useSearchParams();
  const site = searchParams.get("site");

  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots] = useState(Array.from({ length: 24 }, (_, i) => `${i}:00`));
  const [engineers, setEngineers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [hasInitialAssignment, setHasInitialAssignment] = useState(false);
  const [notesInputFocused, setNotesInputFocused] = useState(false);

  // Check if required parameters are present
  const hasRequiredParams = engineer_id && call_no && site;

  const fetchEngineers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`);
      if (!response.ok) {
        throw new Error('Failed to fetch engineers');
      }
      const data = await response.json();
      const filteredEngineers = data.users.filter(
        user => user.accesstype_id?.name === "Engineer"
      );
      setEngineers(filteredEngineers);
    } catch (error) {
      console.error("Error fetching engineers:", error);
      showNotification(error.message, "error");
    }
  };

  // Fetch site details
  const fetchSiteDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sites/${site}`);
      if (!response.ok) {
        throw new Error('Failed to fetch site data');
      }
      const data = await response.json();
      setSiteName(data.site_name);
    } catch (error) {
      console.error("Error fetching site data:", error);
      showNotification(error.message, "error");
    }
  };

  // Fetch diary entries for current date
  const fetchDiaryEntries = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/diary/entries?date=${dateStr}&engineerId=${engineer_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch diary entries');
      }
      
      const data = await response.json();
      setAssignments(data.data || []);
      
      // Check if initial engineer has assignments
      const initialEngineerAssignments = (data.data || []).filter(
        a => a.engineer._id === engineer_id && a.callLog?.callNumber === call_no
      );
      setHasInitialAssignment(initialEngineerAssignments.length > 0);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      showNotification("Error loading diary entries", "error");
    }
  };

  // Check for time conflicts
  const checkTimeConflict = async (engineerId, date, startTime, endTime, excludeId = null) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/diary/check-conflict?engineer=${engineerId}&date=${date}&startTime=${startTime}&endTime=${endTime}`;
      if (excludeId) {
        url += `&excludeId=${excludeId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to check time conflict');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking time conflict:", error);
      return { hasConflict: false };
    }
  };

  // Fetch assignments for call log
  const fetchCallLogAssignments = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/diary/call-log/${call_no}/assignments`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch call log assignments');
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching call log assignments:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchEngineers();
        
        if (hasRequiredParams) {
          await fetchSiteDetails();
          await fetchDiaryEntries();
          
          // Also fetch all assignments for this call log to check initial assignment
          const callLogAssignments = await fetchCallLogAssignments();
          const initialAssignments = callLogAssignments.filter(
            a => a.engineer._id === engineer_id
          );
          setHasInitialAssignment(initialAssignments.length > 0);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showNotification("Error loading data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentDate, engineer_id, call_no, site]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handlePreviousDay = () => handleDateChange(addDays(currentDate, -1));
  const handleNextDay = () => handleDateChange(addDays(currentDate, 1));
  const handleToday = () => handleDateChange(new Date());

  const handleSlotClick = async (engineerId, timeSlot) => {
    if (!hasRequiredParams) {
      showNotification("Missing required parameters (engineer, call number, or site)", "error");
      return;
    }

    // Check if this is the first assignment and engineer_id is specified
    if (!hasInitialAssignment && engineerId !== engineer_id) {
      showNotification("First assignment must be for the specified engineer", "error");
      return;
    }

    // Check if this slot is already assigned
    const existingAssignment = assignments.find(
      (a) =>
        a.engineer._id === engineerId &&
        a.date === format(currentDate, "yyyy-MM-dd") &&
        timeSlot >= a.startTime &&
        timeSlot < a.endTime
    );

    if (existingAssignment) {
      setCurrentAssignment({
        ...existingAssignment,
        engineerId: existingAssignment.engineer._id,
        siteId: existingAssignment.site?._id || site,
        call_no: existingAssignment.callLog?.callNumber || call_no
      });
      setIsModalOpen(true);
      return;
    }

    // Prepare new assignment
    setCurrentAssignment({
      engineerId,
      siteId: site,
      call_no,
      date: format(currentDate, "yyyy-MM-dd"),
      startTime: timeSlot,
      endTime: `${parseInt(timeSlot.split(":")[0]) + 1}:00`,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (assignment) => {
    if (!hasRequiredParams) {
      showNotification("Missing required parameters", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Check for time conflicts
      const conflictCheck = await checkTimeConflict(
        assignment.engineerId,
        assignment.date,
        assignment.startTime,
        assignment.endTime,
        assignment._id
      );

      if (conflictCheck.hasConflict) {
        showNotification(`Time conflict with existing assignment`, "error");
        return;
      }

      let response, data;
      
      if (assignment._id) {
        // Update existing assignment
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${assignment._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site: assignment.siteId,
            callLog: assignment.call_no,
            engineer: assignment.engineerId,
            date: assignment.date,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            notes: assignment.notes,
            userId: localStorage.getItem('userId') // Assuming you store user ID in localStorage
          })
        });
      } else {
        // Create new assignment
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${user._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site: assignment.siteId,
            callLog: assignment.call_no,
            engineer: assignment.engineerId,
            date: assignment.date,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            notes: assignment.notes,
            userId: localStorage.getItem('userId'),
            initialEngineerId: engineer_id
          })
        });
      }

      data = await response.json();

      console.log(data)
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Refresh assignments
      await fetchDiaryEntries();
      
      if (!assignment._id && assignment.engineerId === engineer_id) {
        setHasInitialAssignment(true);
      }

      showNotification(
        `Assignment ${assignment._id ? "updated" : "created"} successfully`
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving assignment:", error);
      showNotification(error.message || "Error saving assignment", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!currentAssignment?._id) {
      showNotification("No assignment selected for deletion", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${currentAssignment._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initialEngineerId: engineer_id,
          userId: localStorage.getItem('userId')
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete assignment');
      }

      // Refresh assignments
      await fetchDiaryEntries();

      // Check if we're deleting the initial assignment
      if (currentAssignment.engineerId === engineer_id) {
        const callLogAssignments = await fetchCallLogAssignments();
        const remainingInitialAssignments = callLogAssignments.filter(
          a => a.engineer._id === engineer_id
        );
        setHasInitialAssignment(remainingInitialAssignments.length > 0);
      }

      showNotification('Assignment deleted successfully');
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showNotification(error.message || 'Error deleting assignment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getAssignmentForSlot = (engineerId, timeSlot) => {
    return assignments.find(a =>
      a.engineer._id === engineerId &&
      a.date === format(currentDate, 'yyyy-MM-dd') &&
      timeSlot >= a.startTime &&
      timeSlot < a.endTime
    );
  };

  const getDateDisplay = () => {
    if (isToday(currentDate)) return 'Today';
    if (isTomorrow(currentDate)) return 'Tomorrow';
    if (isYesterday(currentDate)) return 'Yesterday';
    return format(currentDate, 'EEEE, MMM d, yyyy');
  };

  // Modal component
  const AssignmentModal = () => (
    <div className={`fixed inset-0 bg-gray-600/50 flex items-center justify-center p-4 z-50 ${isModalOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{currentAssignment?._id ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!hasRequiredParams && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              <AlertCircle className="inline mr-2" />
              Cannot create/edit assignments without engineer, call number, and site
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={currentAssignment?.engineerId || ''}
                  onChange={(e) => setCurrentAssignment({ ...currentAssignment, engineerId: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  disabled={!hasInitialAssignment && engineer_id && currentAssignment?.engineerId === engineer_id}
                >
                  {engineers.map(engineer => (
                    <option
                      key={engineer._id}
                      value={engineer._id}
                      disabled={!hasInitialAssignment && engineer._id !== engineer_id}
                    >
                      {engineer.firstname + " " + engineer.lastname}
                      {!hasInitialAssignment && engineer._id !== engineer_id && " (assign to initial engineer first)"}
                    </option>
                  ))}
                </select>
              </div>
              {!hasInitialAssignment && engineer_id && (
                <p className="mt-1 text-sm text-gray-500">
                  First assignment must be for the specified engineer
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={siteName || ''}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm py-2 bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Number</label>
              <input
                type="text"
                value={call_no || ''}
                className="w-full rounded-md border-gray-300 shadow-sm py-2 bg-gray-100"
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={currentAssignment?.startTime || ''}
                    onChange={(e) => setCurrentAssignment({ ...currentAssignment, startTime: e.target.value })}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={currentAssignment?.endTime || ''}
                    onChange={(e) => setCurrentAssignment({ ...currentAssignment, endTime: e.target.value })}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <div className="relative">
                <Notebook className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={currentAssignment?.notes || ''}
                  onChange={(e) => setCurrentAssignment({ ...currentAssignment, notes: e.target.value })}
                  onFocus={() => setNotesInputFocused(true)}
                  onBlur={() => setNotesInputFocused(false)}
                  rows={3}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <div>
              {currentAssignment?._id && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveAssignment(currentAssignment)}
                disabled={!hasRequiredParams || (!hasInitialAssignment && currentAssignment?.engineerId !== engineer_id)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !hasRequiredParams || (!hasInitialAssignment && currentAssignment?.engineerId !== engineer_id) 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Delete Confirmation Modal
  const DeleteModal = () => (
    <div className={`fixed inset-0 bg-gray-600/50 flex items-center justify-center p-4 z-50 ${isDeleteModalOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Confirm Deletion</h3>
            <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="mb-6">Are you sure you want to delete this assignment?</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAssignment}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Notification component
  const NotificationComponent = () => {
    if (!notification) return null;

    const bgColor = notification.type === 'error' ? 'bg-red-100' : 'bg-green-100';
    const textColor = notification.type === 'error' ? 'text-red-800' : 'text-green-800';
    const icon = notification.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Check className="h-5 w-5" />;

    return (
      <div className={`fixed bottom-4 right-4 ${bgColor} ${textColor} px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 z-50`}>
        {icon}
        <span>{notification.message}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 print:bg-white">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(false)}
        />
        <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-4 lg:pl-72 xl:pl-80 print:p-0 print:pl-0">
          <div className="max-w-6xl mx-auto print:max-w-none">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 print:hidden">
              <h1 className="text-2xl font-bold text-gray-800">
                Diary Management
              </h1>
              <div className="flex items-center space-x-4 mt-2 md:mt-0">
                <div className="text-lg font-medium text-gray-700">
                  {getDateDisplay()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousDay}
                    className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-2 text-sm rounded-md bg-white border border-gray-300 hover:bg-gray-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextDay}
                    className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100"
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      value={format(currentDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        handleDateChange(parseISO(e.target.value))
                      }
                      className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Parameter Display */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Engineer</label>
                  <div className="mt-1 flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">
                      {engineer_id ? engineers.find(e => e._id === engineer_id)?.firstname + " " + engineers.find(e => e._id === engineer_id)?.lastname || "Not specified" : "Not specified"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Call Number</label>
                  <div className="mt-1">
                    <span className="font-medium">{call_no || "Not specified"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site</label>
                  <div className="mt-1 flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">{siteName || "Not specified"}</span>
                  </div>
                </div>
              </div>
              {!hasRequiredParams && (
                <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>View-only mode: Cannot assign tasks without engineer, call number, and site</span>
                </div>
              )}
            </div>

            {/* Schedule Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="animate-spin h-12 w-12 text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg print:shadow-none print:ring-0">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 sticky left-0 bg-gray-50 z-10">
                            Engineer
                          </th>
                          {timeSlots.map((timeSlot) => (
                            <th
                              key={timeSlot}
                              scope="col"
                              className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                            >
                              {timeSlot}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {engineers.map((engineer) => (
                          <tr key={engineer._id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 sticky left-0 bg-white z-10">
                              <div className="font-medium">
                                {engineer.firstname + " " + engineer.lastname}
                                {engineer._id === engineer_id && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Initial
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs">{engineer.accesstype_id?.name || "Engineer"}</div>
                            </td>
                            {timeSlots.map((timeSlot) => {
                              const assignment = getAssignmentForSlot(engineer._id, timeSlot);
                              const isFirstHour = timeSlot === assignment?.startTime;

                              return (
                                <td
                                  key={`${engineer._id}-${timeSlot}`}
                                  onClick={() => hasRequiredParams && handleSlotClick(engineer._id, timeSlot)}
                                  className={`relative px-3 py-4 text-sm ${hasRequiredParams ? 'cursor-pointer' : 'cursor-default'} 
                                    ${assignment ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                                  title={!hasRequiredParams ? "View-only mode" : ""}
                                >
                                  {assignment && isFirstHour && (
                                    <div className="absolute inset-0 flex items-center justify-center p-1">
                                      <div className="text-xs text-center">
                                        <div className="font-medium">{assignment.site?.name || siteName}</div>
                                        <div>{assignment.startTime}-{assignment.endTime}</div>
                                        {assignment.notes && (
                                          <div className="truncate text-gray-500">{assignment.notes}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          <AssignmentModal />
          <DeleteModal />
          <NotificationComponent />
        </main>
      </div>
    </div>
  );
};

export default Diary;