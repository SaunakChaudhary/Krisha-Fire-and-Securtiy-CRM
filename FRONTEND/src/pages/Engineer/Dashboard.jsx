import React, { useState, useEffect, useContext } from "react";
import {
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  CalendarX
} from "lucide-react";
import EngineerNavbar from "../../components/Engineer/EngineerNavbar";
import { AuthContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const EngineerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [expiredTasks, setExpiredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Map API status -> UI status
  const mapStatusToUI = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "on-route":
        return "On Route";
      case "on-site":
        return "On Site";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  // Map UI status -> API status
  const mapStatusToAPI = (status) => {
    switch (status) {
      case "Pending":
        return "scheduled";
      case "Accepted":
        return "accepted";
      case "On Route":
        return "on-route";
      case "On Site":
        return "on-site";
      case "Completed":
        return "completed";
      default:
        return "scheduled";
    }
  };

  // Get available status options based on current status
  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "Pending":
        return ["Pending", "Accepted"];
      case "Accepted":
        return ["Accepted", "On Route"];
      case "On Route":
        return ["On Route", "On Site"];
      case "On Site":
        return ["On Site", "Completed"];
      case "Completed":
        return ["Completed"];
      default:
        return ["Pending"];
    }
  };

  // Check if a task has expired
  const isTaskExpired = (taskDate, taskStatus) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    const taskDateObj = new Date(taskDate);
    taskDateObj.setHours(0, 0, 0, 0);
    
    // Task is expired if:
    // 1. The task date is before today AND
    // 2. The status is still "Pending" (not acted upon)
    return taskDateObj < today && taskStatus === "Pending";
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/diary/entries`
        );

        const data = await res.json();
        if (data.success) {
          const userTasks = data.data.filter(
            (entry) =>
              entry.engineer?._id.toString() === user.user._id.toString()
          );

          // Map API response into frontend task format
          const mappedTasks = userTasks.map((entry) => {
            const taskDate = new Date(entry.date);
            const uiStatus = mapStatusToUI(entry.status);
            const expired = isTaskExpired(entry.date, uiStatus);
            
            return {
              id: entry._id,
              site: entry.site?.site_name,
              address: `${entry.site?.address_line_1 || ""}, ${
                entry.site?.city || ""
              }, ${entry.site?.state || ""}, ${entry.site?.postcode || ""}`,
              job: `Call #${entry.callLog?.call_number} (${entry.callLog?.status})`,
              date: taskDate.toLocaleDateString(),
              rawDate: taskDate, // Store the date object for easier comparison
              status: uiStatus, // normalize status
              description: entry.notes,
              duration: entry.duration,
              expired: expired // Flag for expired tasks
            };
          });
          
          setTasks(mappedTasks);
          
          // Separate expired tasks
          const expired = mappedTasks.filter(task => task.expired);
          setExpiredTasks(expired);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.user && user.user._id) {
      fetchTasks();
    }
  }, [user]);

  
  const updateTaskStatus = async (taskId, newStatusUI) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    
    // Don't allow updating expired tasks
    if (taskToUpdate.expired) {
      toast.error("Cannot update status of an expired task");
      return;
    }
    
    const newStatusAPI = mapStatusToAPI(newStatusUI);
    
    // Store the original tasks for potential rollback
    const originalTasks = [...tasks];

    try {
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatusUI } : task
        )
      );

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/diary/entries/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatusAPI }),
        }
      );

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update status");
      }
      
      toast.success("Status updated successfully!");
    } catch (err) {
      console.error("Error updating task status:", err);
      toast.error("Failed to update task status. Please try again.");
      setTasks(originalTasks);
    }
  };

  const viewTaskDetails = (task) => {
    navigate(`/engineer/task/${task.id}`);
  };

  // Filter out expired tasks for normal display
  const activeTasks = tasks.filter(task => !task.expired);
  
  // Stats calculation (only for active tasks)
  const completedTasks = activeTasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = activeTasks.filter((t) => t.status === "Pending").length;
  const onRouteTasks = activeTasks.filter((t) => t.status === "On Route").length;
  const acceptedTasks = activeTasks.filter((t) => t.status === "Accepted").length;
  const onSiteTasks = activeTasks.filter((t) => t.status === "On Site").length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <EngineerNavbar />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">
              No tasks assigned to you.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-gray-500 text-sm">Pending</p>
                  <p className="text-xl font-bold">{pendingTasks}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
                <User className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-gray-500 text-sm">Accepted</p>
                  <p className="text-xl font-bold">{acceptedTasks}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-gray-500 text-sm">On Route</p>
                  <p className="text-xl font-bold">{onRouteTasks}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
                <User className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-gray-500 text-sm">On Site</p>
                  <p className="text-xl font-bold">{onSiteTasks}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <p className="text-xl font-bold">{completedTasks}</p>
                </div>
              </div>
            </div>

            {/* Expired Tasks Section */}
            {expiredTasks.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center mb-4">
                  <CalendarX className="h-6 w-6 text-red-500 mr-2" />
                  <h2 className="text-lg font-semibold text-red-700">
                    Expired Tasks
                  </h2>
                </div>
                <p className="text-red-600 mb-4">
                  The following tasks were not completed by their scheduled date:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-red-100 text-left text-red-700">
                        <th className="p-3">Site</th>
                        <th className="p-3">Job</th>
                        <th className="p-3">Scheduled Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredTasks.map((task) => (
                        <tr key={task.id} className="border-b border-red-200">
                          <td className="p-3">{task.site}</td>
                          <td className="p-3">{task.job}</td>
                          <td className="p-3">{task.date}</td>
                          <td className="p-3">
                            <span className="font-medium px-2 py-1 rounded bg-red-100 text-red-800">
                              Expired
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active Task Table */}
            <div className="bg-white shadow rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Your Active Tasks
              </h2>
              {activeTasks.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">
                  No active tasks assigned to you.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-left text-gray-600">
                        <th className="p-3">Site</th>
                        <th className="p-3">Job</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTasks.map((task) => {
                        const availableOptions = getAvailableStatusOptions(task.status);
                        
                        return (
                          <tr key={task.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{task.site}</td>
                            <td className="p-3">{task.job}</td>
                            <td className="p-3">{task.date}</td>
                            <td className="p-3">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  updateTaskStatus(task.id, e.target.value)
                                }
                                className={`font-medium px-2 py-1 rounded ${
                                  task.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : task.status === "Pending"
                                    ? "bg-blue-100 text-blue-800"
                                    : task.status === "On Route"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : task.status === "Accepted"
                                    ? "bg-purple-100 text-purple-800"
                                    : task.status === "On Site"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {availableOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => viewTaskDetails(task)}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                View Details <ChevronRight className="h-4 w-4 ml-1" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner text-center py-3 text-gray-500 text-sm">
        © 2025 Krisha Fire & Security LLP — Engineer Dashboard
      </footer>
    </div>
  );
};

export default EngineerDashboard;