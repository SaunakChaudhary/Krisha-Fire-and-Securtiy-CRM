import React, { useState } from "react";
import { User, CheckCircle, Clock, AlertCircle, MapPin, ChevronRight, Phone, Mail, Calendar } from "lucide-react";
import EngineerNavbar from "../../components/Engineer/EngineerNAvbar";

const EngineerDashboard = () => {
  // State for tasks
  const [tasks, setTasks] = useState([
    {
      id: 1,
      site: "ABC Corp, Ahmedabad",
      address: "123 Main Street, Ahmedabad, Gujarat",
      job: "Fire Alarm Installation",
      date: "2025-08-15",
      status: "Completed",
      contact: {
        name: "Rajesh Sharma",
        phone: "+91 98765 43210",
        email: "rajesh@abccorp.com"
      },
      description: "Install new fire alarm system across all floors. Test all sensors and ensure connectivity with central monitoring system."
    },
    {
      id: 2,
      site: "XYZ Pvt Ltd, Vadodara",
      address: "456 Industrial Area, Vadodara, Gujarat",
      job: "AMC Preventive Maintenance",
      date: "2025-08-17",
      status: "Pending",
      contact: {
        name: "Priya Patel",
        phone: "+91 87654 32109",
        email: "priya@xyz.com"
      },
      description: "Routine maintenance of existing fire safety equipment as per annual maintenance contract."
    },
    {
      id: 3,
      site: "LMN Industries, Surat",
      address: "789 Export Zone, Surat, Gujarat",
      job: "System Inspection",
      date: "2025-08-19",
      status: "On Route",
      contact: {
        name: "Vikram Mehta",
        phone: "+91 76543 21098",
        email: "vikram@lmnindustries.com"
      },
      description: "Comprehensive inspection of entire fire safety system. Generate report with recommendations."
    },
    {
      id: 4,
      site: "PQR Mall, Rajkot",
      address: "101 City Center, Rajkot, Gujarat",
      job: "Emergency Exit Sign Installation",
      date: "2025-08-20",
      status: "Accepted",
      contact: {
        name: "Sunil Joshi",
        phone: "+91 65432 10987",
        email: "sunil@pqrmall.com"
      },
      description: "Install emergency exit signs on all floors as per new safety regulations."
    }
  ]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("dashboard");

  // Update task status
  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  // View task details
  const viewTaskDetails = (task) => {
    setSelectedTask(task);
    setView("task-detail");
  };

  // Stats calculation
  const completedTasks = tasks.filter(task => task.status === "Completed").length;
  const pendingTasks = tasks.filter(task => task.status === "Pending").length;
  const onRouteTasks = tasks.filter(task => task.status === "On Route").length;
  const acceptedTasks = tasks.filter(task => task.status === "Accepted").length;

  // Status options
  const statusOptions = ["Pending", "Accepted", "On Route", "On Site", "Completed"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <EngineerNavbar view={view} setView={setView} />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-gray-500 text-sm">Completed Tasks</p>
              <p className="text-xl font-bold">{completedTasks}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-xl p-4 flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">Pending Tasks</p>
              <p className="text-xl font-bold">{pendingTasks}</p>
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
            <User className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-gray-500 text-sm">Accepted</p>
              <p className="text-xl font-bold">{acceptedTasks}</p>
            </div>
          </div>
        </div>

        {/* Task History Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Assigned Task History
          </h2>
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
                {tasks.map((task, i) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{task.site}</td>
                    <td className="p-3">{task.job}</td>
                    <td className="p-3">{task.date}</td>
                    <td className="p-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`font-medium px-2 py-1 rounded ${task.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "Pending"
                            ? "bg-blue-100 text-blue-800"
                            : task.status === "On Route"
                              ? "bg-yellow-100 text-yellow-800"
                              : task.status === "Accepted"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {statusOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner text-center py-3 text-gray-500 text-sm">
        © 2025 Krisha Fire & Security LLP — Engineer Dashboard
      </footer>
    </div>
  );
};

export default EngineerDashboard;