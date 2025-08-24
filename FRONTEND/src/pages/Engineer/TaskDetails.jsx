import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  MapPin,
  Calendar,
  Clock,
  X,
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
  Download,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import EngineerNavbar from "../../components/Engineer/EngineerNavbar";
import { AuthContext } from "../../Context/AuthContext";
import toast from "react-hot-toast";

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [siteHistory, setSiteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [customerRating, setCustomerRating] = useState(0);
  const [customerReview, setCustomerReview] = useState("");
  const [showEngineerSignaturePad, setShowEngineerSignaturePad] =
    useState(false);
  const [showCustomerSignaturePad, setShowCustomerSignaturePad] =
    useState(false);
  const [checklistStatus, setChecklistStatus] = useState({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [viewMode, setViewMode] = useState(false);
  const [engineerSignatureData, setEngineerSignatureData] = useState(null);
  const [customerSignatureData, setCustomerSignatureData] = useState(null);
  const [savingSignature, setSavingSignature] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Refs for signature pads
  const engineerSigPadRef = useRef();
  const customerSigPadRef = useRef();


  // ========== FETCH SITE HISTORY ==========
  const fetchSiteHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/calls`
      );

      const data = await res.json();
      if (res.ok) {
        setSiteHistory(data.data.filter((data) => data.site_id._id === task.callLog.site_id) || []);
      } else {
        toast.error("Failed to load site history");
      }
    } catch (err) {
      console.error("Error fetching site history:", err);
      toast.error("Failed to load site history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (task)
      fetchSiteHistory();
  }, [task]);

  // ========== DOCUMENT UPLOAD FUNCTIONS ==========
  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}/documents`
      );
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setUploadingDocuments(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Documents uploaded successfully!");
        setShowUploadModal(false);
        setSelectedFiles([]);
        fetchDocuments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL
        }/api/taskReport/${taskId}/documents/${documentId}/download`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error("Failed to download document");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL
        }/api/taskReport/${taskId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Document deleted successfully!");
        fetchDocuments();
      } else {
        toast.error("Failed to delete document: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  // ========== COMPLETION FUNCTIONS ==========
  const saveEngineerSignature = async () => {
    if (engineerSigPadRef.current.isEmpty()) {
      toast.error("Please provide a signature first.");
      return;
    }

    try {
      setSavingSignature(true);
      const signatureData = engineerSigPadRef.current.toDataURL();

      // Save signature locally only, not to database
      setEngineerSignatureData(signatureData);
      setShowEngineerSignaturePad(false);
      toast.success("Engineer signature saved!");

    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature. Please try again.");
    } finally {
      setSavingSignature(false);
    }
  };

  const saveCustomerSignature = async () => {
    if (customerSigPadRef.current.isEmpty()) {
      toast.error("Please provide a signature first.");
      return;
    }

    try {
      setSavingSignature(true);
      const signatureData = customerSigPadRef.current.toDataURL();

      // Save signature locally only, not to database
      setCustomerSignatureData(signatureData);
      setShowCustomerSignaturePad(false);
      toast.success("Customer signature saved!");

    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature. Please try again.");
    } finally {
      setSavingSignature(false);
    }
  };

  // ========== REPORT SUBMIT FUNCTION (UPDATED) ==========
  const handleSubmitReport = async () => {
    try {
      setSubmittingReport(true);
      const filteredChecklist = Object.fromEntries(
        Object.entries(checklistStatus).filter(([_, value]) => value === true)
      );
      const reportData = {
        taskId: taskId,
        customerRating: parseInt(customerRating),
        customerReview: customerReview,
        engineerSignature: engineerSignatureData,
        customerSignature: customerSignatureData,
        checklistStatus: filteredChecklist,
        additionalNotes: additionalNotes,
        engineer: user.user._id,
        taskDetails: task
      };

      // Use PUT method for update if report exists, POST for create
      const method = taskReport ? 'PUT' : 'POST';
      const link = taskReport ? `${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}` : `${import.meta.env.VITE_API_URL}/api/taskReport`;
      const response = await fetch(link, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Report submitted successfully!");
        setTaskReport(data.data);
        setViewMode(true);
      } else {
        toast.error("Failed to submit report: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmittingReport(false);
    }
  };


  const clearEngineerSignature = () => {
    engineerSigPadRef.current.clear();
  };

  const clearCustomerSignature = () => {
    customerSigPadRef.current.clear();
  };

  const handleChecklistChange = (questionName) => {
    setChecklistStatus((prev) => {
      const newStatus = { ...prev };
      if (newStatus[questionName]) {
        // If already checked, remove it (uncheck)
        delete newStatus[questionName];
      } else {
        // If not checked, add it with true value
        newStatus[questionName] = true;
      }
      return newStatus;
    });
  };

  // ========== EDIT REPORT FUNCTION ==========
  const handleEditReport = () => {
    setViewMode(false);
    toast.success("You can now edit the report");
  };

  const toggleViewMode = () => {
    if (viewMode) {
      handleEditReport();
    } else {
      setViewMode(true);
    }
  };

  // ========== DATA FETCHING ==========
  useEffect(() => {
    if (taskId) {
      fetchDocuments();
    }
  }, [taskId]);

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

          if (
            userTask &&
            userTask.engineer?._id.toString() !== user.user._id.toString()
          ) {
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

    const fetchTaskReport = async () => {
      try {
        setReportLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/taskReport/${taskId}`
        );

        const data = await res.json();
        if (res.ok) {
          setTaskReport(data.data);
          if (data.data) {
            setCustomerRating(data.data.customerRating || 0);
            setCustomerReview(data.data.customerReview || "");
            setChecklistStatus(data.data.checklistStatus || {});
            setAdditionalNotes(data.data.additionalNotes || "");
            setEngineerSignatureData(data.data.engineerSignature || null);
            setCustomerSignatureData(data.data.customerSignature || null);
            setViewMode(true);
          }
        }
      } catch (err) {
        console.error("Error fetching task report:", err);
      } finally {
        setReportLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
      fetchTaskReport();
    }
  }, [taskId, user]);

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

          {/* Report Status Banner */}
          {taskReport && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">
                  Report submitted on{" "}
                  {new Date(taskReport.submittedAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={toggleViewMode}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                {viewMode ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Edit Report
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    View Report
                  </>
                )}
              </button>
            </div>
          )}

          {/* Task Header */}
          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Call #{task.callLog?.call_number}
              </h1>
              <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {getStatusIcon(task.status)}
                <span className="ml-2 font-medium">
                  {mapStatusToUI(task.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>
                  {task.startTime} - {task.endTime} ({task.duration})
                </span>
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
            <TabButton
              id="history"
              icon={<ClipboardList className="h-4 w-4" />}
              label="History"
              isActive={activeTab === "history"}
            />
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-b-xl p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Task Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">
                        Site Information
                      </h3>
                      <div className="text-gray-600">
                        <p className="font-semibold">{task.site?.site_name}</p>
                        <p>{task.site?.address_line_1}</p>
                        {task.site?.address_line_2 && (
                          <p>{task.site.address_line_2}</p>
                        )}
                        <p>
                          {task.site?.city}, {task.site?.state}{" "}
                          {task.site?.postcode}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">
                        Contact Information
                      </h3>
                      <div className="text-gray-600">
                        <p>
                          {task.site?.title} {task.site?.contact_name}
                        </p>
                        <p>{task.site?.position}</p>
                        <p>Phone: {task.site?.contact_no}</p>
                        <p>Email: {task.site?.contact_email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Call Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Call Number: {task.callLog?.call_number}</p>
                        <p>Priority: {task.callLog?.priority}/100</p>
                        <p>
                          Logged Date:{" "}
                          {new Date(task.callLog?.logged_date).toLocaleString()}
                        </p>
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Notes
                    </h2>
                    <p className="text-gray-600">{task.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Site Details Tab */}
            {activeTab === "site" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Site Information
                  </h2>
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
                        {task.site?.address_line_2 && (
                          <p>{task.site.address_line_2}</p>
                        )}
                        {task.site?.address_line_3 && (
                          <p>{task.site.address_line_3}</p>
                        )}
                        <p>
                          {task.site?.city}, {task.site?.state}{" "}
                          {task.site?.postcode}
                        </p>
                        <p>{task.site?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>
                          {task.site?.title} {task.site?.contact_name}
                        </p>
                        <p>{task.site?.position}</p>
                        <p>Phone: {task.site?.contact_no}</p>
                        <p>Email: {task.site?.contact_email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-700">
                        Additional Information
                      </h3>
                      <div className="text-gray-600">
                        {task.site?.route && <p>Route: {task.site.route}</p>}
                        {task.site?.area && <p>Area: {task.site.area}</p>}
                        {task.site?.sales_person && (
                          <p>Sales Person: {task.site.sales_person}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(task.site?.admin_remarks || task.site?.site_remarks) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Remarks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {task.site?.admin_remarks && (
                        <div>
                          <h3 className="font-medium text-gray-700">
                            Admin Remarks
                          </h3>
                          <p className="text-gray-600">
                            {task.site.admin_remarks}
                          </p>
                        </div>
                      )}

                      {task.site?.site_remarks && (
                        <div>
                          <h3 className="font-medium text-gray-700">
                            Site Remarks
                          </h3>
                          <p className="text-gray-600">
                            {task.site.site_remarks}
                          </p>
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    System Information
                  </h2>

                  {/* Find the specific system from site_systems that matches the callLog's site_system */}
                  {(() => {
                    const systemId = task.callLog.site_system;
                    const system = task.site?.site_systems?.find(
                      (sys) =>
                        sys.system_id._id === systemId || sys._id === systemId
                    );

                    return system ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">
                              System Details
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    System Name:
                                  </span>
                                  <span className="font-medium">
                                    {system.system_id.systemName}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    System Code:
                                  </span>
                                  <span className="font-medium">
                                    {system.system_id.systemCode}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {system.status}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Installation Date:
                                  </span>
                                  <span>
                                    {new Date(
                                      system.date_of_install
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Warranty Until:
                                  </span>
                                  <span>
                                    {new Date(
                                      system.warranty_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Rented:</span>
                                  <span>{system.rented ? "Yes" : "No"}</span>
                                </div>
                                {system.installed_by && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Installed By:
                                    </span>
                                    <span>
                                      {system.installed_by.firstname}{" "}
                                      {system.installed_by.lastname}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">
                              System Description
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-600">
                                {system.system_id.description ||
                                  "No description available for this system."}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-700 mb-2">
                              Additional Information
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Category:
                                  </span>
                                  <span>
                                    {system.system_id.productFilterGroup}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Alarm Type:
                                  </span>
                                  <span>
                                    {system.system_id.alarmReportingCategory}
                                  </span>
                                </div>
                                {system.date_of_sale && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Date of Sale:
                                    </span>
                                    <span>
                                      {new Date(
                                        system.date_of_sale
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {system.takeover_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Takeover Date:
                                    </span>
                                    <span>
                                      {new Date(
                                        system.takeover_date
                                      ).toLocaleDateString()}
                                    </span>
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
                          <p className="text-yellow-700">
                            System information not found for this call.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Show all systems at the site as additional information */}
                {task.site?.site_systems &&
                  task.site.site_systems.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-4">
                        All Systems at This Site
                      </h3>

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
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  {system.system_id.systemName}
                                </td>
                                <td className="p-3">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {system.status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {system.date_of_install
                                    ? new Date(
                                      system.date_of_install
                                    ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td className="p-3">
                                  {system.warranty_date
                                    ? new Date(
                                      system.warranty_date
                                    ).toLocaleDateString()
                                    : "N/A"}
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Call Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>Call Number: {task.callLog?.call_number}</p>
                        <p>Status: {task.callLog?.status}</p>
                        <p>Priority: {task.callLog?.priority}/100</p>
                        <p>
                          Logged Date:{" "}
                          {new Date(task.callLog?.logged_date).toLocaleString()}
                        </p>
                        <p>
                          Deadline:{" "}
                          {new Date(task.callLog?.deadline).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>
                          Next Action:{" "}
                          {new Date(task.callLog?.next_action).toLocaleString()}
                        </p>
                        <p>
                          Assign Date:{" "}
                          {new Date(task.callLog?.assign_date).toLocaleString()}
                        </p>
                        <p>Logged By: {task.callLog?.logged_by?.firstname}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Caller Information
                  </h2>
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Billing Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <p>
                          Chargeable: {task.callLog?.chargable ? "Yes" : "No"}
                        </p>
                        <p>Invoiced: {task.callLog?.invoiced ? "Yes" : "No"}</p>
                        <p>
                          Bill on Maintenance:{" "}
                          {task.callLog?.bill_on_maintenance ? "Yes" : "No"}
                        </p>
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
                            <p>
                              Invoice Date:{" "}
                              {new Date(
                                task.callLog.invoice_date
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {task.callLog?.remarks && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Remarks
                    </h2>
                    <p className="text-gray-600">{task.callLog.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* Checklist Tab */}
            {activeTab === "checklist" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Maintenance Checklist
                </h2>

                <div className="space-y-4">
                  {task.callLog.call_type.associatedDocketTypes.map(
                    (question, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`check-${index}`}
                          checked={checklistStatus[question.name] || false}
                          onChange={() => handleChecklistChange(question.name)}
                          disabled={viewMode}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label
                          htmlFor={`check-${index}`}
                          className="ml-2 text-gray-700"
                        >
                          {question.name}
                        </label>
                      </div>
                    )
                  )}

                  <div className="mt-4">
                    <label
                      htmlFor="additional-notes"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Additional Notes
                    </label>
                    <textarea
                      id="additional-notes"
                      rows="3"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      disabled={viewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Add any additional notes or observations here..."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Engineer Cabinet
                  </h2>
                  {!viewMode && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Documents
                    </button>
                  )}
                </div>

                {documents.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet.</p>
                    {!viewMode && (
                      <p className="text-gray-400 mt-2">
                        Click the upload button to add documents.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <FileCheck className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {doc.originalName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {doc.mimetype.split("/")[1].toUpperCase()} •
                              {(doc.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleDownloadDocument(doc._id, doc.originalName)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Download
                          </button>
                          {!viewMode && (
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload Documents Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Upload Documents
                  </h3>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                    <input
                      type="file"
                      id="document-upload"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Click to select files or drag and drop
                      </p>
                      <p className="text-sm text-gray-400">
                        Maximum 10 files at a time (10MB each)
                      </p>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Selected Files:
                      </h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span className="text-sm text-gray-600 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                setSelectedFiles(
                                  selectedFiles.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFiles([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadDocuments}
                      disabled={
                        uploadingDocuments || selectedFiles.length === 0
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploadingDocuments ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Tab */}
            {activeTab === "completion" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Signatures
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Engineer Signature */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">
                        Engineer Signature
                      </h3>
                      {showEngineerSignaturePad && !viewMode ? (
                        <div className="border border-gray-300 rounded-md p-4">
                          <div className="border border-dashed border-gray-300 rounded-md mb-3">
                            <SignatureCanvas
                              ref={engineerSigPadRef}
                              penColor="black"
                              canvasProps={{
                                width: 400,
                                height: 150,
                                className: "sigCanvas w-full",
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
                                onClick={() =>
                                  setShowEngineerSignaturePad(false)
                                }
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEngineerSignature}
                                disabled={savingSignature}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingSignature ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-md p-4 h-40 flex flex-col items-center justify-center">
                          {engineerSignatureData ? (
                            <>
                              <img
                                src={engineerSignatureData}
                                alt="Engineer Signature"
                                className="max-h-24 max-w-full mb-2"
                              />
                              {!viewMode && (
                                <button
                                  onClick={() =>
                                    setShowEngineerSignaturePad(true)
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Resign
                                </button>
                              )}
                            </>
                          ) : (
                            !viewMode && (
                              <button
                                onClick={() =>
                                  setShowEngineerSignaturePad(true)
                                }
                                className="text-blue-600 hover:text-blue-800 flex flex-col items-center"
                              >
                                <PenTool className="h-8 w-8 mb-1" />
                                <span>Add Signature</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Customer Signature */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">
                        Customer Signature
                      </h3>
                      {showCustomerSignaturePad && !viewMode ? (
                        <div className="border border-gray-300 rounded-md p-4">
                          <div className="border border-dashed border-gray-300 rounded-md mb-3">
                            <SignatureCanvas
                              ref={customerSigPadRef}
                              penColor="black"
                              canvasProps={{
                                width: 400,
                                height: 150,
                                className: "sigCanvas w-full",
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
                                onClick={() =>
                                  setShowCustomerSignaturePad(false)
                                }
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveCustomerSignature}
                                disabled={savingSignature}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingSignature ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-md p-4 h-40 flex flex-col items-center justify-center">
                          {customerSignatureData ? (
                            <>
                              <img
                                src={customerSignatureData}
                                alt="Customer Signature"
                                className="max-h-24 max-w-full mb-2"
                              />
                              {!viewMode && (
                                <button
                                  onClick={() =>
                                    setShowCustomerSignaturePad(true)
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Resign
                                </button>
                              )}
                            </>
                          ) : (
                            !viewMode && (
                              <button
                                onClick={() =>
                                  setShowCustomerSignaturePad(true)
                                }
                                className="text-blue-600 hover:text-blue-800 flex flex-col items-center"
                              >
                                <PenTool className="h-8 w-8 mb-1" />
                                <span>Request Signature</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Customer Feedback
                  </h2>

                  {/* Customer Rating */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Rating</h3>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => !viewMode && setCustomerRating(star)}
                          disabled={viewMode}
                          className="text-2xl focus:outline-none disabled:opacity-50"
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
                    <label
                      htmlFor="customer-review"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Comments
                    </label>
                    <textarea
                      id="customer-review"
                      rows="3"
                      value={customerReview}
                      onChange={(e) => setCustomerReview(e.target.value)}
                      disabled={viewMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Please share your feedback about our service..."
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                {!viewMode && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSubmitReport}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Submit Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Site Call History - {task.site?.site_name}
                </h2>

                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-500">Loading history...</p>
                  </div>
                ) : siteHistory.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No call history found for this site.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-left text-gray-600">
                          <th className="p-3">Call #</th>
                          <th className="p-3">Logged Date</th>
                          <th className="p-3">Call Type</th>
                          <th className="p-3">Engineer</th>
                          <th className="p-3">Caller</th>
                        </tr>
                      </thead>
                      <tbody>
                        {siteHistory.map((call, index) => (
                          <tr
                            key={index}
                            className={`border-b hover:bg-gray-50 ${call._id === task.callLog?._id ? 'bg-blue-50' : ''}`}
                          >
                            <td className="p-3 font-medium">{call.call_number}</td>
                            <td className="p-3">
                              {new Date(call.logged_date).toLocaleDateString()}
                            </td>
                            <td className="p-3">{call.call_type?.name || 'N/A'}</td>
                            <td className="p-3">
                              {call.engineer_id
                                ? `${call.engineer_id.firstname} ${call.engineer_id.lastname}`
                                : 'Not assigned'
                              }
                            </td>
                            <td className="p-3">{call.caller_name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Statistics */}
                {siteHistory.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{siteHistory.length}</div>
                      <div className="text-sm text-blue-800">Total Calls</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {siteHistory.filter(call => call.status === 'completed').length}
                      </div>
                      <div className="text-sm text-green-800">Completed</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {siteHistory.filter(call => call.status !== 'completed').length}
                      </div>
                      <div className="text-sm text-orange-800">Pending</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {Math.round(siteHistory.reduce((sum, call) => sum + call.priority, 0) / siteHistory.length)}
                      </div>
                      <div className="text-sm text-red-800">Avg Priority</div>
                    </div>
                  </div>
                )}
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
