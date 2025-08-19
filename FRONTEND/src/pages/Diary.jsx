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
  Info,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { AuthContext } from "../Context/AuthContext";

// Move AssignmentModal outside the main component to prevent re-renders
const AssignmentModal = ({ 
  isOpen, 
  onClose, 
  currentAssignment, 
  setCurrentAssignment, 
  engineers, 
  siteName, 
  call_no, 
  timeSlots, 
  hasRequiredParams, 
  hasInitialAssignment, 
  engineer_id, 
  onSave, 
  onDelete 
}) => {
  if (!isOpen) return null;

  // Check if save button should be enabled
  const canSave = () => {
    // For existing assignments, always allow saving
    if (currentAssignment?._id) return true;

    // For new assignments, check if we have required parameters and engineer restrictions
    if (!hasRequiredParams) return false;

    // Check if this is the first assignment and engineer is correct
    if (!hasInitialAssignment && currentAssignment?.engineerId !== engineer_id) return false;

    return true;
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{currentAssignment?._id ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!currentAssignment?._id && !hasRequiredParams && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              <AlertCircle className="inline mr-2" />
              Cannot create new assignments without engineer, call number, and site
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
                  disabled={!currentAssignment?._id && !hasInitialAssignment && engineer_id && currentAssignment?.engineerId === engineer_id}
                >
                  {engineers.map(engineer => (
                    <option
                      key={engineer._id}
                      value={engineer._id}
                      disabled={!currentAssignment?._id && !hasInitialAssignment && engineer._id !== engineer_id}
                    >
                      {engineer.firstname + " " + engineer.lastname}
                      {!currentAssignment?._id && !hasInitialAssignment && engineer._id !== engineer_id && " (assign to initial engineer first)"}
                    </option>
                  ))}
                </select>
              </div>
              {!currentAssignment?._id && !hasInitialAssignment && engineer_id && (
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
                  rows={3}
                  className="pl-10 p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <div>
              {currentAssignment?._id && (
                <button
                  onClick={onDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(currentAssignment)}
                disabled={!canSave()}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!canSave()
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
};

// Move DeleteModal outside the main component
const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Confirm Deletion</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="mb-6">Are you sure you want to delete this assignment?</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Move NotificationComponent outside the main component
const NotificationComponent = ({ notification, onClose }) => {
  if (!notification) return null;

  const bgColor =
    notification.type === "error"
      ? "bg-red-100"
      : notification.type === "info"
        ? "bg-blue-100"
        : "bg-green-100";

  const textColor =
    notification.type === "error"
      ? "text-red-800"
      : notification.type === "info"
        ? "text-blue-800"
        : "text-green-800";

  const icon =
    notification.type === "error" ? (
      <AlertCircle className="h-5 w-5" />
    ) : notification.type === "info" ? (
      <Info className="h-5 w-5" />
    ) : (
      <Check className="h-5 w-5" />
    );

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} ${textColor} px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 z-50`}
    >
      {icon}
      <span>{notification.message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

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
  const [siteName, setSiteName] = useState("");
  const [hasInitialAssignment, setHasInitialAssignment] = useState(false);

  // Check if required parameters are present
  const hasRequiredParams = engineer_id && call_no && site;

  // Helper function to convert time to minutes
  const toMinutes = (t) => {
    const [h, m] = String(t || '0:0').split(':').map(v => parseInt(v, 10));
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };

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

  const fetchDiaryEntries = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      let url = `${import.meta.env.VITE_API_URL}/api/diary/entries?date=${dateStr}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch diary entries');
      }

      const data = await response.json();
      setAssignments(data.data || []);

      if (hasRequiredParams) {
        // Check if initial engineer has assignments (for edit mode restrictions)
        const initialEngineerAssignments = (data.data || []).filter(
          a => a.engineer._id === engineer_id
        );
        setHasInitialAssignment(initialEngineerAssignments.length > 0);
      }
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      showNotification("Error loading diary entries", "error");
    }
  };

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
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
        }
      } catch (e) {
        console.error("Invalid date parameter:", dateParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchEngineers();

        if (hasRequiredParams) {
          await fetchSiteDetails();
        }

        await fetchDiaryEntries();

        if (hasRequiredParams) {
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
    // Check if this slot is already assigned
    const existingAssignment = assignments.find(a => {
      if (a.engineer._id !== engineerId) return false;
      if (format(new Date(a.date), "yyyy-MM-dd") !== format(currentDate, "yyyy-MM-dd")) return false;
      const slotMin = toMinutes(timeSlot);
      const startMin = toMinutes(a.startTime);
      const endMin = toMinutes(a.endTime);
      return slotMin >= startMin && slotMin < endMin;
    });

    if (existingAssignment) {
      setCurrentAssignment({
        ...existingAssignment,
        engineerId: existingAssignment.engineer._id,
        siteId: existingAssignment.site?._id || site,
        call_no: existingAssignment.callLog?.call_number || call_no
      });
      setIsModalOpen(true);
      return;
    }

    // For new assignments, check if we have required parameters
    if (!hasRequiredParams) {
      showNotification("Cannot create new assignments in view-only mode", "info");
      return;
    }

    // Check if this is the first assignment and engineer_id is specified
    if (!hasInitialAssignment && engineerId !== engineer_id) {
      showNotification("First assignment must be for the specified engineer", "error");
      return;
    }

    // Prepare new assignment
    const startHour = parseInt(timeSlot.split(":")[0], 10);
    const defaultEndTime = startHour === 23 ? "23:59" : `${startHour + 1}:00`;
    setCurrentAssignment({
      engineerId,
      siteId: site,
      call_no,
      date: format(currentDate, "yyyy-MM-dd"),
      startTime: timeSlot,
      endTime: defaultEndTime,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (assignment) => {
    setIsLoading(true);
    try {
      const ensureValidEndTime = (start, end) => {
        const [sh, sm] = String(start || '0:0').split(':').map(v => parseInt(v, 10));
        const [eh, em] = String(end || '0:0').split(':').map(v => parseInt(v, 10));
        const startMinutes = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
        const endMinutes = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
        if (endMinutes > startMinutes) return end;
        if ((Number.isFinite(sh) ? sh : 0) === 23) return '23:59';
        return `${(Number.isFinite(sh) ? sh : 0) + 1}:00`;
      };

      const adjustedEndTime = ensureValidEndTime(assignment.startTime, assignment.endTime);
      const assignmentToSend = { ...assignment, endTime: adjustedEndTime };

      // Check for time conflicts
      const conflictCheck = await checkTimeConflict(
        assignmentToSend.engineerId,
        assignmentToSend.date,
        assignmentToSend.startTime,
        assignmentToSend.endTime,
        assignmentToSend._id
      );

      if (conflictCheck.hasConflict) {
        showNotification(`Time conflict with existing assignment`, "error");
        setIsLoading(false);
        return;
      }

      let response, data;

      if (assignment._id) {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${assignment._id}${hasRequiredParams ? `?initialEngineerId=${engineer_id}` : ''}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site: assignmentToSend.siteId,
            callLog: assignmentToSend.call_no,
            engineer: assignmentToSend.engineerId,
            date: assignmentToSend.date,
            startTime: assignmentToSend.startTime,
            endTime: assignmentToSend.endTime,
            notes: assignmentToSend.notes,
            userId: user?._id || localStorage.getItem('userId')
          })
        });
      } else {
        if (!hasRequiredParams) {
          showNotification("Cannot create new assignments in view-only mode", "error");
          setIsLoading(false);
          return;
        }

        response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${user?._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site: assignmentToSend.siteId,
            callLog: assignmentToSend.call_no,
            engineer: assignmentToSend.engineerId,
            date: assignmentToSend.date,
            startTime: assignmentToSend.startTime,
            endTime: assignmentToSend.endTime,
            notes: assignmentToSend.notes,
            userId: user?._id
          })
        });
      }

      data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to save assignment');
      }

      // Refresh assignments
      await fetchDiaryEntries();

      if (hasRequiredParams) {
        const callLogAssignments = await fetchCallLogAssignments();
        const initialAssignments = callLogAssignments.filter(
          a => a.engineer._id === engineer_id
        );
        setHasInitialAssignment(initialAssignments.length > 0);
      }

      showNotification(
        `Assignment ${assignment._id ? "updated" : "created"} successfully`
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving assignment:", error.message);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/diary/entries/${currentAssignment._id}${hasRequiredParams ? `?initialEngineerId=${engineer_id}` : ''}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete assignment');
      }

      await fetchDiaryEntries();

      if (hasRequiredParams) {
        const callLogAssignments = await fetchCallLogAssignments();
        const initialAssignments = callLogAssignments.filter(
          a => a.engineer._id === engineer_id
        );
        setHasInitialAssignment(initialAssignments.length > 0);
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
    const slotMin = toMinutes(timeSlot);
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');

    return assignments.find(a =>
      a.engineer._id === engineerId &&
      format(new Date(a.date), 'yyyy-MM-dd') === currentDateStr &&
      slotMin >= toMinutes(a.startTime) &&
      slotMin < toMinutes(a.endTime)
    );
  };

  const getDateDisplay = () => {
    if (isToday(currentDate)) return 'Today';
    if (isTomorrow(currentDate)) return 'Tomorrow';
    if (isYesterday(currentDate)) return 'Yesterday';
    return format(currentDate, 'EEEE, MMM d, yyyy');
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
                      {engineer_id ? engineers.find(e => e._id === engineer_id)?.firstname + " " + engineers.find(e => e._id === engineer_id)?.lastname || "Not specified" : "Viewing all engineers"}
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
              {!hasRequiredParams ? (
                <div className="mt-3 p-2 bg-blue-100 text-blue-800 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>View-only mode: Can edit/delete existing assignments</span>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-md flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  <span>Edit mode: You can create, edit, and delete assignments</span>
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
                        {engineers.map((engineer) => {
                          const engineerAssignments = assignments.filter(a =>
                            a.engineer._id === engineer._id &&
                            format(new Date(a.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                          );

                          return (
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
                                const assignment = engineerAssignments.find(a => {
                                  const slotMin = toMinutes(timeSlot);
                                  const startMin = toMinutes(a.startTime);
                                  const endMin = toMinutes(a.endTime);
                                  return slotMin >= startMin && slotMin < endMin;
                                });

                                const isFirstHour = assignment && timeSlot === assignment.startTime;

                                return (
                                  <td
                                    key={`${engineer._id}-${timeSlot}`}
                                    onClick={() => handleSlotClick(engineer._id, timeSlot)}
                                    className={`relative px-3 py-4 text-sm cursor-pointer 
                                      ${assignment ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                                  >
                                    {assignment && isFirstHour && (
                                      <div className="absolute inset-0 flex items-center justify-center p-1">
                                        <div className="text-xs text-center">
                                          <div className="font-medium">{assignment.site?.site_name || siteName}</div>
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          <AssignmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentAssignment={currentAssignment}
            setCurrentAssignment={setCurrentAssignment}
            engineers={engineers}
            siteName={siteName}
            call_no={call_no}
            timeSlots={timeSlots}
            hasRequiredParams={hasRequiredParams}
            hasInitialAssignment={hasInitialAssignment}
            engineer_id={engineer_id}
            onSave={handleSaveAssignment}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
          
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteAssignment}
          />
          
          <NotificationComponent
            notification={notification}
            onClose={() => setNotification(null)}
          />
        </main>
      </div>
    </div>
  );
};

export default Diary;