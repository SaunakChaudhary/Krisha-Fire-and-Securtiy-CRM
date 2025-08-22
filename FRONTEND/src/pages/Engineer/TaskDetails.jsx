import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from 'react-signature-canvas';
import {
  MapPin,
  Calendar,
  Clock,
  FileText,
  User,
  ArrowLeft,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  Navigation,
  HardDrive,
  FileCheck,
  ClipboardCheck,
  FolderOpen,
  Star,
  PenTool,
  ClipboardList,
  FileSignature,
  Trash2,
  Download
} from "lucide-react";
import EngineerNavbar from "../../components/Engineer/EngineerNavbar";
import { AuthContext } from "../../Context/AuthContext";

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [customerRating, setCustomerRating] = useState(0);
  const [customerReview, setCustomerReview] = useState("");
  const [showEngineerSignaturePad, setShowEngineerSignaturePad] = useState(false);
  const [showCustomerSignaturePad, setShowCustomerSignaturePad] = useState(false);

  // Refs for signature pads
  const engineerSigPadRef = useRef();
  const customerSigPadRef = useRef();

  // Dummy documents for engineer cabinet
  const engineerDocuments = [
    { name: "Installation Manual.pdf", type: "PDF", size: "2.4 MB" },
    { name: "Technical Specifications.docx", type: "DOC", size: "1.1 MB" },
    { name: "Wiring Diagram.png", type: "IMAGE", size: "850 KB" },
    { name: "Safety Guidelines.pdf", type: "PDF", size: "3.2 MB" },
    { name: "Troubleshooting Guide.pdf", type: "PDF", size: "1.8 MB" }
  ];

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/diary/entries`
        );

        const data = await res.json();
        if (data.success) {
          const userTask = data.data.find(
            (entry) => entry._id.toString() === taskId.toString()
          );

          console.log(userTask)
          // Verify this task belongs to the logged-in user
          if (userTask && userTask.engineer?._id.toString() !== user.user._id.toString()) {
            setError("You don't have permission to view this task");
            setLoading(false);
            return;
          }

          setTask(userTask);
        } else {
          setError("Task not found");
        }
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, user]);

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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case "on-route":
        return <Navigation className="h-5 w-5 text-yellow-500" />;
      case "on-site":
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Save engineer signature
  const saveEngineerSignature = () => {
    if (engineerSigPadRef.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    const signatureData = engineerSigPadRef.current.toDataURL();
    localStorage.setItem(`engineerSignature_${taskId}`, signatureData);
    setShowEngineerSignaturePad(false);
  };

  // Clear engineer signature
  const clearEngineerSignature = () => {
    engineerSigPadRef.current.clear();
  };

  // Save customer signature
  const saveCustomerSignature = () => {
    if (customerSigPadRef.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    const signatureData = customerSigPadRef.current.toDataURL();
    localStorage.setItem(`customerSignature_${taskId}`, signatureData);
    setShowCustomerSignaturePad(false);
  };

  // Clear customer signature
  const clearCustomerSignature = () => {
    customerSigPadRef.current.clear();
  };

  // Get saved signatures
  const getEngineerSignature = () => {
    return localStorage.getItem(`engineerSignature_${taskId}`);
  };

  const getCustomerSignature = () => {
    return localStorage.getItem(`customerSignature_${taskId}`);
  };

  const handleSubmitReport = () => {
    // Handle form submission here
    alert("Report submitted successfully!");
    // You would typically make an API call here to save the data
  };

  // Tab navigation component
  const TabButton = ({ id, icon, label, isActive }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${isActive
        ? "border-red-500 text-red-600 bg-white"
        : "border-transparent text-gray-500 hover:text-red-700 hover:border-red-300"
        }`}
    >
      {icon}
      <span className="ml-2 font-medium">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <EngineerNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <EngineerNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">{error || "Task not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const engineerSignature = getEngineerSignature();
  const customerSignature = getCustomerSignature();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <EngineerNavbar />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>

          {/* Task Header */}
          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Call #{task.callLog?.call_number}
              </h1>
              <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {getStatusIcon(task.status)}
                <span className="ml-2 font-medium">{mapStatusToUI(task.status)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>{task.startTime} - {task.endTime} ({task.duration})</span>
              </div>
            </div>

            <div className="flex items-center text-gray-600 mb-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Priority: {task.callLog?.priority}/100</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-gray-100 p-2 rounded-t-lg flex gap-2 overflow-auto">
            <TabButton
              id="overview"
              icon={<ClipboardList className="h-4 w-4" />}
              label="Overview"
              isActive={activeTab === "overview"}
            />
            <TabButton
              id="site"
              icon={<MapPin className="h-4 w-4" />}
              label="Site Details"
              isActive={activeTab === "site"}
            />
            <TabButton
              id="system"
              icon={<HardDrive className="h-4 w-4" />}
              label="System Info"
              isActive={activeTab === "system"}
            />
            <TabButton
              id="call"
              icon={<Phone className="h-4 w-4" />}
              label="Call Info"
              isActive={activeTab === "call"}
            />
            <TabButton
              id="checklist"
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Checklist"
              isActive={activeTab === "checklist"}
            />
            <TabButton
              id="documents"
              icon={<FolderOpen className="h-4 w-4" />}
              label="Documents"
              isActive={activeTab === "documents"}
            />
            <TabButton
              id="completion"
              icon={<FileSignature className="h-4 w-4" />}
              label="Completion"
              isActive={activeTab === "completion"}
            />
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-b-xl p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">Site Information</h3>
                      <div className="text-gray-600">
                        <p className="font-semibold">{task.site?.site_name}</p>
                        <p>{task.site?.address_line_1}</p>
                        {task.site?.address_line_2 && <p>{task.site.address_line_2}</p>}
                        <p>{task.site?.city}, {task.site?.state} {task.site?.postcode}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">Contact Information</h3>
                      <div className="text-gray-600">
                        <p>{task.site?.title} {task.site?.contact_name}</p>
                        <p>{task.site?.position}</p>
                        <p>Phone: {task.site?.contact_no}</p>
                        <p>Email: {task.site?.contact_email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Call Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Call Number: {task.callLog?.call_number}</p>
                        <p>Priority: {task.callLog?.priority}/100</p>
                        <p>Logged Date: {new Date(task.callLog?.logged_date).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Caller: {task.callLog?.caller_name}</p>
                        <p>Phone: {task.callLog?.caller_number}</p>
                        <p>Email: {task.callLog?.caller_email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {task.notes && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                    <p className="text-gray-600">{task.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Site Details Tab */}
            {activeTab === "site" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Site Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p className="font-semibold">{task.site?.site_name}</p>
                        <p>Site Code: {task.site?.site_code}</p>
                        <p>Premises Type: {task.site?.premises_type}</p>
                        <p>Status: {task.site?.status}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">Address</h3>
                      <div className="text-gray-600">
                        <p>{task.site?.address_line_1}</p>
                        {task.site?.address_line_2 && <p>{task.site.address_line_2}</p>}
                        {task.site?.address_line_3 && <p>{task.site.address_line_3}</p>}
                        <p>{task.site?.city}, {task.site?.state} {task.site?.postcode}</p>
                        <p>{task.site?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>{task.site?.title} {task.site?.contact_name}</p>
                        <p>{task.site?.position}</p>
                        <p>Phone: {task.site?.contact_no}</p>
                        <p>Email: {task.site?.contact_email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">Additional Information</h3>
                      <div className="text-gray-600">
                        {task.site?.route && <p>Route: {task.site.route}</p>}
                        {task.site?.area && <p>Area: {task.site.area}</p>}
                        {task.site?.sales_person && <p>Sales Person: {task.site.sales_person}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {(task.site?.admin_remarks || task.site?.site_remarks) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Remarks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {task.site?.admin_remarks && (
                        <div>
                          <h3 className="font-medium text-gray-700">Admin Remarks</h3>
                          <p className="text-gray-600">{task.site.admin_remarks}</p>
                        </div>
                      )}

                      {task.site?.site_remarks && (
                        <div>
                          <h3 className="font-medium text-gray-700">Site Remarks</h3>
                          <p className="text-gray-600">{task.site.site_remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Information Tab */}
            {activeTab === "system" && task.callLog?.site_system && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>

                  {/* Find the specific system from site_systems that matches the callLog's site_system */}
                  {(() => {
                    const systemId = task.callLog.site_system;
                    const system = task.site?.site_systems?.find(sys =>
                      sys.system_id._id === systemId || sys._id === systemId
                    );

                    return system ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">System Details</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">System Name:</span>
                                  <span className="font-medium">{system.system_id.systemName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">System Code:</span>
                                  <span className="font-medium">{system.system_id.systemCode}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {system.status}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Installation Date:</span>
                                  <span>{new Date(system.date_of_install).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Warranty Until:</span>
                                  <span>{new Date(system.warranty_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Rented:</span>
                                  <span>{system.rented ? "Yes" : "No"}</span>
                                </div>
                                {system.installed_by && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Installed By:</span>
                                    <span>{system.installed_by.firstname} {system.installed_by.lastname}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">System Description</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-600">
                                {system.system_id.description || "No description available for this system."}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">Additional Information</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Category:</span>
                                  <span>{system.system_id.productFilterGroup}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Alarm Type:</span>
                                  <span>{system.system_id.alarmReportingCategory}</span>
                                </div>
                                {system.date_of_sale && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Date of Sale:</span>
                                    <span>{new Date(system.date_of_sale).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {system.takeover_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Takeover Date:</span>
                                    <span>{new Date(system.takeover_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                          <p className="text-yellow-700">System information not found for this call.</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Show all systems at the site as additional information */}
                {task.site?.site_systems && task.site.site_systems.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">All Systems at This Site</h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-left text-gray-600">
                            <th className="p-3">System Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Installation Date</th>
                            <th className="p-3">Warranty Until</th>
                            <th className="p-3">Rented</th>
                          </tr>
                        </thead>
                        <tbody>
                          {task.site.site_systems.map((system, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">{system.system_id.systemName}</td>
                              <td className="p-3">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  {system.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {system.date_of_install ? new Date(system.date_of_install).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="p-3">
                                {system.warranty_date ? new Date(system.warranty_date).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="p-3">
                                {system.rented ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Call Information Tab */}
            {activeTab === "call" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Call Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Call Number: {task.callLog?.call_number}</p>
                        <p>Status: {task.callLog?.status}</p>
                        <p>Priority: {task.callLog?.priority}/100</p>
                        <p>Logged Date: {new Date(task.callLog?.logged_date).toLocaleString()}</p>
                        <p>Deadline: {new Date(task.callLog?.deadline).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Next Action: {new Date(task.callLog?.next_action).toLocaleString()}</p>
                        <p>Assign Date: {new Date(task.callLog?.assign_date).toLocaleString()}</p>
                        <p>Logged By: {task.callLog?.logged_by?.firstname}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Caller Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Name: {task.callLog?.caller_name}</p>
                        <p>Phone: {task.callLog?.caller_number}</p>
                        <p>Email: {task.callLog?.caller_email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Billing Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Chargeable: {task.callLog?.chargable ? "Yes" : "No"}</p>
                        <p>Invoiced: {task.callLog?.invoiced ? "Yes" : "No"}</p>
                        <p>Bill on Maintenance: {task.callLog?.bill_on_maintenance ? "Yes" : "No"}</p>
                        {task.callLog?.invoice_value && (
                          <p>Invoice Value: ${task.callLog.invoice_value}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {task.callLog?.invoice_no && (
                        <div className="text-gray-600">
                          <p>Invoice Number: {task.callLog.invoice_no}</p>
                          {task.callLog?.invoice_date && (
                            <p>Invoice Date: {new Date(task.callLog.invoice_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {task.callLog?.remarks && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Remarks</h2>
                    <p className="text-gray-600">{task.callLog.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* Checklist Tab */}
            {activeTab === "checklist" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Checklist</h2>

                <div className="space-y-4">
                  {task.callLog.call_type.associatedDocketTypes.map((question, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`check-${index}`}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`check-${index}`} className="ml-2 text-gray-700">
                        {question.name}
                      </label>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label htmlFor="additional-notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      id="additional-notes"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any additional notes or observations here..."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Engineer Cabinet</h2>

                <div className="space-y-3">
                  {engineerDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileCheck className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <p className="font-medium text-gray-700">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Tab */}
            {activeTab === "completion" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Signatures</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Engineer Signature */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Engineer Signature</h3>
                      {showEngineerSignaturePad ? (
                        <div className="border border-gray-300 rounded-md p-4">
                          <div className="border border-dashed border-gray-300 rounded-md mb-3">
                            <SignatureCanvas
                              ref={engineerSigPadRef}
                              penColor="black"
                              canvasProps={{
                                width: 400,
                                height: 150,
                                className: "sigCanvas w-full"
                              }}
                            />
                          </div>
                          <div className="flex justify-between">
                            <button
                              onClick={clearEngineerSignature}
                              className="flex items-center text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Clear
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowEngineerSignaturePad(false)}
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEngineerSignature}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-md p-4 h-40 flex flex-col items-center justify-center">
                          {engineerSignature ? (
                            <>
                              <img src={engineerSignature} alt="Engineer Signature" className="max-h-24 max-w-full mb-2" />
                              <button
                                onClick={() => setShowEngineerSignaturePad(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Resign
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowEngineerSignaturePad(true)}
                              className="text-blue-600 hover:text-blue-800 flex flex-col items-center"
                            >
                              <PenTool className="h-8 w-8 mb-1" />
                              <span>Add Signature</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Customer Signature */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Customer Signature</h3>
                      {showCustomerSignaturePad ? (
                        <div className="border border-gray-300 rounded-md p-4">
                          <div className="border border-dashed border-gray-300 rounded-md mb-3">
                            <SignatureCanvas
                              ref={customerSigPadRef}
                              penColor="black"
                              canvasProps={{
                                width: 400,
                                height: 150,
                                className: "sigCanvas w-full"
                              }}
                            />
                          </div>
                          <div className="flex justify-between">
                            <button
                              onClick={clearCustomerSignature}
                              className="flex items-center text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Clear
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowCustomerSignaturePad(false)}
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveCustomerSignature}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-md p-4 h-40 flex flex-col items-center justify-center">
                          {customerSignature ? (
                            <>
                              <img src={customerSignature} alt="Customer Signature" className="max-h-24 max-w-full mb-2" />
                              <button
                                onClick={() => setShowCustomerSignaturePad(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Resign
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowCustomerSignaturePad(true)}
                              className="text-blue-600 hover:text-blue-800 flex flex-col items-center"
                            >
                              <PenTool className="h-8 w-8 mb-1" />
                              <span>Request Signature</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Feedback</h2>

                  {/* Customer Rating */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Rating</h3>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setCustomerRating(star)}
                          className="text-2xl focus:outline-none"
                        >
                          {star <= customerRating ? (
                            <Star className="h-8 w-8 text-yellow-400 fill-current" />
                          ) : (
                            <Star className="h-8 w-8 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Review */}
                  <div>
                    <label htmlFor="customer-review" className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      id="customer-review"
                      rows="3"
                      value={customerReview}
                      onChange={(e) => setCustomerReview(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please share your feedback about our service..."
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSubmitReport}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white shadow-inner text-center py-3 text-gray-500 text-sm">
        © 2025 Krisha Fire & Security LLP — Engineer Dashboard
      </footer>
    </div>
  );
};

export default TaskDetails;