import React, { useContext, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Calendar, Clock, User, Mail, Phone, AlertCircle, HardHat,
    Clipboard, MapPin, Info, FileText, CheckCircle, XCircle,
    Star, CheckSquare, Square, Download, File, Image, FileType
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from "../Context/AuthContext";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const ViewCalls = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [call, setCall] = useState(null);
    const [taskReports, setTaskReports] = useState([]);
    const [editingReport, setEditingReport] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [taskReportsLoading, setTaskReportsLoading] = useState(false);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'reports', 'documents'
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { id } = useParams();

    // Get access type ID from user object
    const getAccessTypeId = () => {
        if (!user) return null;
        if (user.user && user.user.accesstype_id) return user.user.accesstype_id;
        if (user.accesstype_id && user.accesstype_id._id) return user.accesstype_id._id;
        if (user.accesstype_id && typeof user.accesstype_id === 'string') return user.accesstype_id;
        return null;
    };

    const fetchPermissions = async () => {
        const accessTypeId = getAccessTypeId();
        if (!accessTypeId) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/permissions/${accessTypeId}`);
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
            if (!hasPermission("Manage Call")) {
                return navigate("/UserUnAuthorized/Manage Calls");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const fetchCallData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/calls/${id}`);
            if (!response.ok) throw new Error('Failed to fetch call details');
            const data = await response.json();
            setCall(data.data);
        } catch (error) {
            console.error('Error fetching call details:', error);
            toast.error(error.message || 'Failed to load call details');
        } finally {
            setLoading(false);
        }
    }

    const fetchTaskId = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/diary/entries`);
            const data = await res.json();
            const entry = data.data.find(entry => entry.callLog._id === id);
            if (entry) {
                setTaskId(entry._id);
                setStatus(entry.status);
            }
        } catch (error) {
            console.error('Error fetching task ID:', error);
        }
    }

    const fetchTaskReports = async () => {
        if (!taskId) return;
        try {
            setTaskReportsLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/taskReport/${taskId}`);
            const data = await response.json();
            setTaskReports(data.data ? [data.data] : []);
            setDocuments(data.data?.documents || []);
        } catch (error) {
            console.error('Error fetching task reports:', error);
            toast.error(error.message || 'Failed to load task reports');
        } finally {
            setTaskReportsLoading(false);
        }
    }
    const handleEditClick = (report) => {
        setEditingReport({
            ...report,
            checklistStatus: report.checklistStatus || {}
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateReport = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/taskReport/${taskId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...editingReport,
                        taskId: taskId
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                toast.success("Report updated successfully");
                setEditingReport(null);
                fetchTaskReports();
            } else {
                toast.error("Update failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating report");
        }
    };

    const handleChecklistChange = (key) => {
        setEditingReport(prev => {
            const updatedChecklist = { ...prev.checklistStatus };

            if (updatedChecklist[key]) {
                delete updatedChecklist[key];
            } else {
                updatedChecklist[key] = true;
            }

            return {
                ...prev,
                checklistStatus: updatedChecklist
            };
        });
    };
    useEffect(() => {
        fetchTaskId();
        fetchCallData();
    }, [id]);

    useEffect(() => {
        if (taskId) {
            fetchTaskReports();
        }
    }, [taskId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            );
        }
        return stars;
    };

    const renderChecklistStatus = (checklistStatus) => {
        if (!checklistStatus) return null;
        return Object.entries(checklistStatus).map(([key, value]) => (
            <div key={key} className="flex items-center mb-2">
                {value ? (
                    <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                    <Square className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm">{key}</span>
            </div>
        ));
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
        return <FileType className="h-6 w-6 text-gray-500" />;
    };

    const handleDownload = async (documentId, fileName) => {
        try {
            // You'll need to create this API endpoint on your backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/taskReport/${taskId}/documents/${documentId}/download`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Download started');
            } else {
                toast.error('Failed to download document');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        }
    };


    const handleDownloadReportPDF = (report) => {
        const pdf = new jsPDF({ unit: "mm", format: "a4" });
        const pageW = 210;
        const pageH = 297;
        const margin = 14;
        const col2 = 110;
        let y = 0;

        // ── HEADER BAND ──────────────────────────────────────────────────
        pdf.setFillColor(30, 30, 30);
        pdf.rect(0, 0, pageW, 32, "F");

        pdf.setFillColor(220, 38, 38);
        pdf.rect(0, 28, pageW, 4, "F");

        pdf.setFontSize(17);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("KRISHA FIRE & SECURITY LLP", margin, 13);

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(180, 180, 180);
        pdf.text("Fire Protection | Security Systems | AMC Services", margin, 20);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(220, 38, 38);
        pdf.text("TASK COMPLETION REPORT", pageW - margin, 13, { align: "right" });

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageW - margin, 20, { align: "right" });
        pdf.text(`Ref: RPT-${report._id?.slice(-6).toUpperCase()}`, pageW - margin, 25, { align: "right" });

        y = 42;

        // ── HELPER: section header ────────────────────────────────────────
        const sectionHeader = (title) => {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(margin, y - 1, pageW - margin * 2, 8, "F");
            pdf.setDrawColor(220, 38, 38);
            pdf.setLineWidth(0.6);
            pdf.line(margin, y - 1, margin, y + 7);
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 30, 30);
            pdf.text(title.toUpperCase(), margin + 4, y + 5);
            pdf.setLineWidth(0.2);
            pdf.setDrawColor(220, 220, 220);
            y += 11;
        };

        // ── HELPER: key-value row ─────────────────────────────────────────
        const kv = (label, value, x, currentY) => {
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(120, 120, 120);
            pdf.text(label, x, currentY);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 30, 30);
            const val = String(value || "N/A");
            const split = pdf.splitTextToSize(val, 80);
            pdf.text(split, x, currentY + 4.5);
            return currentY + 4.5 + split.length * 4.5;
        };

        // ── HELPER: card box ──────────────────────────────────────────────
        const startCard = () => {
            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.3);
            return y;
        };
        const endCard = (startY) => {
            pdf.roundedRect(margin, startY - 3, pageW - margin * 2, y - startY + 5, 2, 2, "S");
            y += 6;
        };

        // ── SECTION 1: TASK INFO ──────────────────────────────────────────
        sectionHeader("Task Information");
        const s1 = startCard();
        const r1left = [
            { label: "Task Status", value: status || report.status },
            { label: "Start Time", value: report.taskDetails?.startTime },
        ];
        const r1right = [
            { label: "Task Date", value: report.taskDetails?.date ? new Date(report.taskDetails.date).toLocaleDateString("en-IN") : "N/A" },
            { label: "End Time", value: report.taskDetails?.endTime },
        ];
        let leftY = y, rightY = y;
        r1left.forEach(item => { leftY = kv(item.label, item.value, margin + 2, leftY) + 3; });
        r1right.forEach(item => { rightY = kv(item.label, item.value, col2, rightY) + 3; });
        y = Math.max(leftY, rightY);
        kv("Duration", report.taskDetails?.duration, margin + 2, y);
        y += 10;
        endCard(s1);

        // ── SECTION 2: SITE & ENGINEER ────────────────────────────────────
        sectionHeader("Site & Engineer Details");
        const s2 = startCard();
        let ly2 = y, ry2 = y;
        ly2 = kv("Site Name", call?.site_id?.site_name, margin + 2, ly2) + 3;
        ly2 = kv("Site Code", call?.site_id?.site_code, margin + 2, ly2) + 3;
        const addr = [
            call?.site_id?.address_line_1,
            call?.site_id?.address_line_2,
            call?.site_id?.city,
            call?.site_id?.state,
            call?.site_id?.postcode
        ].filter(Boolean).join(", ");
        ly2 = kv("Address", addr, margin + 2, ly2) + 3;

        ry2 = kv("Assigned Engineer", call?.engineer_id ? `${call.engineer_id.firstname} ${call.engineer_id.lastname}` : "N/A", col2, ry2) + 3;
        ry2 = kv("Contact Person", call?.site_id?.contact_name, col2, ry2) + 3;
        ry2 = kv("Contact Number", call?.site_id?.contact_no, col2, ry2) + 3;
        y = Math.max(ly2, ry2) + 2;
        endCard(s2);

        // ── SECTION 3: NOTES ──────────────────────────────────────────────
        sectionHeader("Work Notes");
        const s3 = startCard();
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(120, 120, 120);
        pdf.text("Task Notes", margin + 2, y);
        y += 4.5;
        pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(40, 40, 40);
        const notes = pdf.splitTextToSize(report.taskDetails?.notes || "No notes provided", pageW - margin * 2 - 8);
        pdf.text(notes, margin + 2, y);
        y += notes.length * 4.5 + 5;

        pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(120, 120, 120);
        pdf.text("Additional Notes", margin + 2, y);
        y += 4.5;
        pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(40, 40, 40);
        const addNotes = pdf.splitTextToSize(report.additionalNotes || "No additional notes", pageW - margin * 2 - 8);
        pdf.text(addNotes, margin + 2, y);
        y += addNotes.length * 4.5 + 4;
        endCard(s3);

        // ── SECTION 4: CHECKLIST ──────────────────────────────────────────
        if (report.checklistStatus && Object.keys(report.checklistStatus).length > 0) {
            sectionHeader("Checklist");
            const s4 = startCard();
            const items = Object.entries(report.checklistStatus);
            const half = Math.ceil(items.length / 2);
            let cl = y, cr = y;
            items.slice(0, half).forEach(([key, val]) => {
                pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
                pdf.setTextColor(val ? 22 : 150, val ? 163 : 150, val ? 74 : 150);
                pdf.text(val ? "✔" : "✘", margin + 2, cl);
                pdf.setTextColor(40, 40, 40);
                pdf.text(key, margin + 8, cl);
                cl += 6;
            });
            items.slice(half).forEach(([key, val]) => {
                pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
                pdf.setTextColor(val ? 22 : 150, val ? 163 : 150, val ? 74 : 150);
                pdf.text(val ? "✔" : "✘", col2, cr);
                pdf.setTextColor(40, 40, 40);
                pdf.text(key, col2 + 6, cr);
                cr += 6;
            });
            y = Math.max(cl, cr) + 2;
            endCard(s4);
        }

        // ── SECTION 5: CUSTOMER FEEDBACK ─────────────────────────────────
        sectionHeader("Customer Feedback");
        const s5 = startCard();
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(120, 120, 120);
        pdf.text("Rating", margin + 2, y);
        y += 5;
        const rating = report.customerRating || 0;
        for (let i = 1; i <= 5; i++) {
            pdf.setTextColor(i <= rating ? 234 : 210, i <= rating ? 179 : 210, i <= rating ? 8 : 210);
            pdf.setFontSize(13);
            pdf.text("★", margin + 2 + (i - 1) * 8, y);
        }
        pdf.setFontSize(9); pdf.setTextColor(100, 100, 100);
        pdf.text(`${rating}/5`, margin + 46, y);
        y += 7;
        kv("Review", report.customerReview, margin + 2, y);
        y += 13;
        endCard(s5);

        // ── SIGNATURES ────────────────────────────────────────────────────
        if (report.engineerSignature || report.customerSignature) {
            sectionHeader("Signatures");
            const s6 = startCard();
            if (report.engineerSignature) {
                pdf.setFontSize(8); pdf.setTextColor(120); pdf.text("Engineer Signature", margin + 2, y);
                y += 3;
                try { pdf.addImage(report.engineerSignature, "PNG", margin + 2, y, 55, 22); } catch (e) { }
                y += 26;
            }
            if (report.customerSignature) {
                pdf.setFontSize(8); pdf.setTextColor(120); pdf.text("Customer Signature", col2, y - 26);
                try { pdf.addImage(report.customerSignature, "PNG", col2, y - 23, 55, 22); } catch (e) { }
            }
            endCard(s6);
        }

        // ── FOOTER ────────────────────────────────────────────────────────
        pdf.setFillColor(30, 30, 30);
        pdf.rect(0, pageH - 14, pageW, 14, "F");
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text("Krisha Fire & Security LLP  |  Confidential – Internal Use Only", margin, pageH - 6);
        pdf.setTextColor(220, 38, 38);
        pdf.text(`Page 1 of 1`, pageW - margin, pageH - 6, { align: "right" });

        pdf.save(`Task_Report_${report._id}.pdf`);
    };


    const handlePrintReport = (reportId) => {
        const report = taskReports.find(r => r._id === reportId);
        const addr = [
            call?.site_id?.address_line_1,
            call?.site_id?.address_line_2,
            call?.site_id?.city,
            call?.site_id?.state,
            call?.site_id?.postcode
        ].filter(Boolean).join(", ");

        const engineerName = call?.engineer_id
            ? `${call.engineer_id.firstname} ${call.engineer_id.lastname}`
            : "Not Assigned";

        const stars = (n) => Array.from({ length: 5 }, (_, i) =>
            `<span style="color:${i < n ? '#f59e0b' : '#d1d5db'}; font-size:16px;">★</span>`
        ).join('');

        const checklist = Object.entries(report.checklistStatus || {})
            .map(([k, v]) => `
            <div class="check-item">
                <span class="check-icon ${v ? 'check-yes' : 'check-no'}">${v ? '✔' : '✘'}</span>
                <span>${k}</span>
            </div>`)
            .join('');

        const printWindow = window.open("", "", "width=960,height=750");
        printWindow.document.write(`
    <html>
    <head>
        <title>Task Report – Krisha Fire & Security</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1f2937; font-size: 13px; }

            .header {
                background: #1a1a1a;
                color: white;
                padding: 20px 28px 16px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .header-left h1 { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
            .header-left p { color: #9ca3af; font-size: 11px; margin-top: 3px; }
            .header-right { text-align: right; }
            .report-badge {
                background: #dc2626; color: white;
                font-size: 11px; font-weight: 700;
                padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px;
                display: inline-block; margin-bottom: 4px;
            }
            .header-right p { color: #9ca3af; font-size: 10px; margin-top: 2px; }
            .accent-bar { height: 4px; background: #dc2626; }

            .page { padding: 20px 28px; }

            .section { margin-bottom: 18px; }
            .section-title {
                font-size: 10px; font-weight: 700; letter-spacing: 1px;
                text-transform: uppercase; color: #dc2626;
                border-left: 3px solid #dc2626;
                padding: 4px 10px;
                background: #f9fafb;
                margin-bottom: 10px;
            }
            .card {
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 12px 16px;
            }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .field label { font-size: 10px; color: #6b7280; font-weight: 500; display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
            .field p { font-size: 13px; font-weight: 600; color: #111827; }

            .notes-box {
                background: #f9fafb; border-radius: 5px;
                padding: 10px 14px; font-size: 13px; color: #374151;
                line-height: 1.6; white-space: pre-wrap;
                border: 1px solid #e5e7eb;
            }

            .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .check-item { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; }
            .check-icon { font-weight: 700; font-size: 13px; width: 18px; text-align: center; }
            .check-yes { color: #16a34a; }
            .check-no { color: #9ca3af; }

            .sig-img { max-height: 70px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; background: #fff; }

            .footer {
                background: #1a1a1a; color: #6b7280;
                padding: 10px 28px; font-size: 10px;
                display: flex; justify-content: space-between; align-items: center;
                margin-top: 10px;
            }
            .footer span { color: #dc2626; font-weight: 600; }

            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>

    <div class="header">
        <div class="header-left">
            <h1>KRISHA FIRE &amp; SECURITY LLP</h1>
            <p>Fire Protection | Security Systems | AMC Services</p>
        </div>
        <div class="header-right">
            <div class="report-badge">TASK REPORT</div>
            <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
            <p>Ref: RPT-${report._id?.slice(-6).toUpperCase()}</p>
        </div>
    </div>
    <div class="accent-bar"></div>

    <div class="page">

        <!-- Task Info -->
        <div class="section">
            <div class="section-title">Task Information</div>
            <div class="card grid-3">
                <div class="field"><label>Status</label><p>${status || report.status || "N/A"}</p></div>
                <div class="field"><label>Date</label><p>${report.taskDetails?.date ? new Date(report.taskDetails.date).toLocaleDateString("en-IN") : "N/A"}</p></div>
                <div class="field"><label>Duration</label><p>${report.taskDetails?.duration || "N/A"}</p></div>
                <div class="field"><label>Start Time</label><p>${report.taskDetails?.startTime || "N/A"}</p></div>
                <div class="field"><label>End Time</label><p>${report.taskDetails?.endTime || "N/A"}</p></div>
            </div>
        </div>

        <!-- Site & Engineer -->
        <div class="section">
            <div class="section-title">Site &amp; Engineer Details</div>
            <div class="card grid-2">
                <div>
                    <div class="field" style="margin-bottom:10px"><label>Site Name</label><p>${call?.site_id?.site_name || "N/A"}</p></div>
                    <div class="field" style="margin-bottom:10px"><label>Site Code</label><p>${call?.site_id?.site_code || "N/A"}</p></div>
                    <div class="field"><label>Address</label><p>${addr || "N/A"}</p></div>
                </div>
                <div>
                    <div class="field" style="margin-bottom:10px"><label>Assigned Engineer</label><p>${engineerName}</p></div>
                    <div class="field" style="margin-bottom:10px"><label>Contact Person</label><p>${call?.site_id?.contact_name || "N/A"}</p></div>
                    <div class="field"><label>Contact Number</label><p>${call?.site_id?.contact_no || "N/A"}</p></div>
                </div>
            </div>
        </div>

        <!-- Notes -->
        <div class="section">
            <div class="section-title">Work Notes</div>
            <div class="card" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                    <div class="field" style="margin-bottom:6px"><label>Task Notes</label></div>
                    <div class="notes-box">${report.taskDetails?.notes || "No notes provided"}</div>
                </div>
                <div>
                    <div class="field" style="margin-bottom:6px"><label>Additional Notes</label></div>
                    <div class="notes-box">${report.additionalNotes || "No additional notes"}</div>
                </div>
            </div>
        </div>

        ${checklist ? `
        <!-- Checklist -->
        <div class="section">
            <div class="section-title">Checklist</div>
            <div class="card"><div class="check-grid">${checklist}</div></div>
        </div>` : ""}

        <!-- Feedback -->
        <div class="section">
            <div class="section-title">Customer Feedback</div>
            <div class="card grid-2">
                <div class="field"><label>Rating</label><div style="margin-top:4px">${stars(report.customerRating || 0)} <span style="font-size:11px;color:#6b7280;margin-left:4px">${report.customerRating || 0}/5</span></div></div>
                <div class="field"><label>Review</label><p>${report.customerReview || "No review provided"}</p></div>
            </div>
        </div>

        ${(report.engineerSignature || report.customerSignature) ? `
        <!-- Signatures -->
        <div class="section">
            <div class="section-title">Signatures</div>
            <div class="card grid-2">
                ${report.engineerSignature ? `<div class="field"><label>Engineer Signature</label><br/><img src="${report.engineerSignature}" class="sig-img"/></div>` : ""}
                ${report.customerSignature ? `<div class="field"><label>Customer Signature</label><br/><img src="${report.customerSignature}" class="sig-img"/></div>` : ""}
            </div>
        </div>` : ""}

    </div>

    <div class="footer">
        <span>Krisha Fire &amp; Security LLP</span>
        <span>Confidential – Internal Use Only</span>
    </div>

    <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>`);

        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </main>
                </div>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <p className="text-gray-500">No call details found</p>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="mb-3 sm:mb-0">
                                        <h2 className="text-xl font-bold text-gray-800">Call Details</h2>
                                        <p className="text-sm text-gray-600">Call Number: {call.call_number}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${call.priority === 1
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {call.priority === 1 ? 'High Priority' : 'Normal Priority'}
                                        </div>
                                        <div className="ml-3">
                                            <span
                                                className={`
                                                    inline-block px-2 py-0.5 rounded text-xs font-semibold
                                                    ${call.status === 'open'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : call.status === 'in_progress'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : call.status === 'on_hold'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : call.status === 'resolved'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : call.status === 'closed'
                                                                        ? 'bg-gray-200 text-gray-600'
                                                                        : 'bg-gray-100 text-gray-500'
                                                    }
                                                `}
                                            >
                                                {{
                                                    open: 'Open',
                                                    in_progress: 'In Progress',
                                                    on_hold: 'On Hold',
                                                    resolved: 'Resolved',
                                                    closed: 'Closed'
                                                }[call.status] || call.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px overflow-x-auto whitespace-nowrap">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'details'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Call Details
                                    </button>
                                    {taskId && (
                                        <button
                                            onClick={() => setActiveTab('reports')}
                                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'reports'
                                                ? 'border-red-500 text-red-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            Task Reports
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'documents'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Documents ({documents?.length})
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            {/* Call Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <Clipboard className="h-5 w-5 text-gray-500 mr-2" />
                                                    Call Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Call Type</p>
                                                            <p className="text-sm font-medium">{call.call_type.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Call Reason</p>
                                                            <p className="text-sm font-medium">{call.call_reason.name}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Remarks</p>
                                                        <p className="text-sm font-medium">{call.remarks || 'No remarks'}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Chargable</p>
                                                            <p className="text-sm font-medium">
                                                                {call.chargable ? (
                                                                    <span className="inline-flex items-center text-green-600">
                                                                        <CheckCircle className="h-4 w-4 mr-1" /> Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-red-600">
                                                                        <XCircle className="h-4 w-4 mr-1" /> No
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Invoiced</p>
                                                            <p className="text-sm font-medium">
                                                                {call.invoiced ? (
                                                                    <span className="inline-flex items-center text-green-600">
                                                                        <CheckCircle className="h-4 w-4 mr-1" /> Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-red-600">
                                                                        <XCircle className="h-4 w-4 mr-1" /> No
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dates */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                                                    Important Dates
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Created At</p>
                                                            <p className="text-sm font-medium">{formatDate(call.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Logged Date</p>
                                                            <p className="text-sm font-medium">{formatDate(call.logged_date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Assign Date</p>
                                                            <p className="text-sm font-medium">{formatDate(call.assign_date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Deadline</p>
                                                            <p className="text-sm font-medium">{formatDate(call.deadline)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Info className="h-4 w-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Next Action</p>
                                                            <p className="text-sm font-medium">{formatDate(call.next_action)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Caller Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <User className="h-5 w-5 text-gray-500 mr-2" />
                                                    Caller Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Name</p>
                                                        <p className="text-sm font-medium">{call.caller_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Email</p>
                                                        <p className="text-sm font-medium">{call.caller_email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Caller Number</p>
                                                        <p className="text-sm font-medium">{call.caller_number}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            {/* Site Information */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                                                    Site Information
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Name</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Code</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_code}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Address</p>
                                                        <p className="text-sm font-medium">
                                                            {call.site_id.address_line_1}, {call.site_id.address_line_2},
                                                            {call.site_id.address_line_3 && `, ${call.site_id.address_line_3}`}
                                                            {call.site_id.address_line_4 && `, ${call.site_id.address_line_4}`}
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {call.site_id.city}, {call.site_id.state}, {call.site_id.postcode}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Contact Person</p>
                                                            <p className="text-sm font-medium">{call.site_id.contact_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Contact Number</p>
                                                            <p className="text-sm font-medium">{call.site_id.contact_no}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Site Remarks</p>
                                                        <p className="text-sm font-medium">{call.site_id.site_remarks || 'No remarks'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personnel */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                                                    <User className="h-5 w-5 text-gray-500 mr-2" />
                                                    Personnel
                                                </h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Logged By</p>
                                                        <p className="text-sm font-medium">
                                                            {call.logged_by.firstname} {call.logged_by.lastname} ({call.logged_by.username})
                                                        </p>
                                                    </div>
                                                    {call.engineer_id && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Assigned Engineer</p>
                                                            <p className="text-sm font-medium">
                                                                {call.engineer_id.firstname} {call.engineer_id.lastname} ({call.engineer_id.username})
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && taskId && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <h3 className="flex items-center text-lg font-medium text-gray-800 mb-6">
                                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                                        Task Reports
                                    </h3>

                                    {taskReportsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : taskReports.length > 0 ? (
                                        <div className="space-y-6">
                                            {taskReports.map((report, index) => (
                                                <div
                                                    key={index}
                                                    id={`report-${report._id}`}
                                                    className="border rounded-lg p-5 bg-gray-50"
                                                >
                                                    <h4 className="font-medium text-gray-700 mb-4 text-lg flex justify-between items-center">
                                                        Task Report #{index + 1}

                                                        <div className="flex gap-2">
                                                            {/* <button
                                                                onClick={() => handleDownloadReportPDF(report)}
                                                                className="bg-red-600 text-white text-xs px-3 py-1 rounded"
                                                            >
                                                                PDF
                                                            </button> */}

                                                            <button
                                                                onClick={() => handlePrintReport(report._id)}
                                                                className="bg-gray-700 text-white text-xs px-3 py-1 rounded"
                                                            >
                                                                Print
                                                            </button>

                                                            <button
                                                                onClick={() => handleEditClick(report)}
                                                                className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Task Status</p>
                                                            <p className="text-sm font-medium capitalize">{status}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Task Date</p>
                                                            <p className="text-sm font-medium">{formatDate(report.taskDetails?.date)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Start Time</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.startTime || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">End Time</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.endTime || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Duration</p>
                                                            <p className="text-sm font-medium">{report.taskDetails?.duration || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Notes</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">
                                                            {report.taskDetails?.notes || 'No notes provided'}
                                                        </p>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Additional Notes</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">
                                                            {report.additionalNotes || 'No additional notes'}
                                                        </p>
                                                    </div>

                                                    {report.checklistStatus && (
                                                        <div className="mb-4">
                                                            <p className="text-xs text-gray-500 mb-2">Checklist Status</p>
                                                            <div className="bg-white p-3 rounded border grid grid-cols-1 gap-2">
                                                                {Object.entries(report.checklistStatus).map(([key, value]) => (
                                                                    <div key={key} className="flex items-center">

                                                                        {
                                                                            value ? (
                                                                                <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                                                                            ) : (
                                                                                <Square className="h-4 w-4 text-gray-400 mr-2" />
                                                                            )
                                                                        }

                                                                        <span className="text-sm">{key}</span>
                                                                    </div>
                                                                ))}

                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Customer Rating</p>
                                                        <div className="flex items-center mt-1 bg-white p-3 rounded border">
                                                            {renderStars(report.customerRating || 0)}
                                                            <span className="ml-2 text-sm text-gray-600">
                                                                ({report.customerRating || 0}/5)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Customer Review</p>
                                                        <p className="text-sm font-medium bg-white p-3 rounded border">{report.customerReview || 'No review provided'}</p>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Submitted At</p>
                                                        <p className="text-sm font-medium">{formatDate(report.submittedAt)}</p>
                                                    </div>

                                                    {(report.engineerSignature || report.customerSignature) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                            {report.engineerSignature && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 mb-2">Engineer Signature</p>
                                                                    <img
                                                                        src={report.engineerSignature}
                                                                        alt="Engineer Signature"
                                                                        className="border rounded max-h-40 object-contain bg-white p-2"
                                                                    />
                                                                </div>
                                                            )}
                                                            {report.customerSignature && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 mb-2">Customer Signature</p>
                                                                    <img
                                                                        src={report.customerSignature}
                                                                        alt="Customer Signature"
                                                                        className="border rounded max-h-40 object-contain bg-white p-2"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No task reports available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <h3 className="flex items-center text-lg font-medium text-gray-800 mb-6">
                                        <File className="h-5 w-5 text-gray-500 mr-2" />
                                        Documents ({documents?.length})
                                    </h3>

                                    {documentsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : documents?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {documents.map((doc) => (
                                                <div key={doc._id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start mb-3">
                                                        {getFileIcon(doc.filename)}
                                                        <div className="ml-3 flex-1">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                                                            <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{doc.uploadedBy?.firstname} {doc.uploadedBy?.lastname}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownload(doc._id, doc.filename)}
                                                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-md py-2 px-3 text-sm hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <File className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">No documents available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {isEditModalOpen && editingReport && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                            <div className="bg-white max-h-[90vh] overflow-y-auto w-full max-w-2xl rounded-lg p-4 sm:p-6">

                                {/* Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Edit Task Report</h2>
                                    <button onClick={() => setIsEditModalOpen(false)}>✕</button>
                                </div>

                                {/* Checklist */}
                                <div className="mb-6">
                                    <h3 className="text-md font-medium mb-3">Checklist</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {call.call_type.associatedDocketTypes.map((item) => {
                                            const key = item.name;

                                            return (
                                                <label key={key} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingReport.checklistStatus?.[key] || false}
                                                        onChange={() => handleChecklistChange(key)}
                                                        className="mr-2"
                                                    />
                                                    <span>{key}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        value={editingReport.additionalNotes || ""}
                                        onChange={(e) =>
                                            setEditingReport({
                                                ...editingReport,
                                                additionalNotes: e.target.value
                                            })
                                        }
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 border rounded"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleUpdateReport}
                                        className="px-4 py-2 bg-green-600 text-white rounded"
                                    >
                                        Save Changes
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ViewCalls;