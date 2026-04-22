import React, { useContext, useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from "../assets/logo.png";

import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';
jsPDF.autoTable = autoTable;

const EngineerReport = () => {
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
            if (!hasPermission("Manage Reports")) {
                return navigate("/UserUnAuthorized/Manage Reports");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [diaries, setDiaries] = useState([]);
    const [taskReports, setTaskReports] = useState({});
    const [combinedReports, setCombinedReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [engineers, setEngineers] = useState([]);
    const [filters, setFilters] = useState({
        dateRange: '',
        engineer: '',
        status: ''
    });
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState('');

    const [detailedPreviewOpen, setDetailedPreviewOpen] = useState(false);
    const [selectedEngineerReport, setSelectedEngineerReport] = useState(null);

    // Fetch diary entries and task reports
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch diary entries
                const diaryResponse = await fetch(`${import.meta.env.VITE_API_URL}/diary/entries`);
                if (!diaryResponse.ok) {
                    throw new Error('Failed to fetch diary entries');
                }
                const diaryData = await diaryResponse.json();

                // Extract unique engineer IDs for filter dropdown
                const uniqueEngineers = [];
                const engineerMap = new Map();

                diaryData.data.forEach(diary => {
                    if (diary.engineer && !engineerMap.has(diary.engineer._id)) {
                        engineerMap.set(diary.engineer._id, true);
                        uniqueEngineers.push(diary.engineer);
                    }
                });

                setEngineers(uniqueEngineers);
                setDiaries(diaryData.data);

                // Fetch task reports for each diary entry
                const taskReportPromises = diaryData.data.map(async (diary) => {
                    try {
                        const taskResponse = await fetch(
                            `${import.meta.env.VITE_API_URL}/taskReport/${diary._id}`
                        );

                        if (taskResponse.ok) {
                            const taskData = await taskResponse.json();
                            return { diaryId: diary._id, taskReport: taskData.data };
                        }
                        return { diaryId: diary._id, taskReport: null };
                    } catch (error) {
                        console.error(`Error fetching task report for diary ${diary._id}:`, error);
                        return { diaryId: diary._id, taskReport: null };
                    }
                });

                const taskReportResults = await Promise.all(taskReportPromises);
                const taskReportMap = {};

                taskReportResults.forEach(result => {
                    if (result.taskReport) {
                        taskReportMap[result.diaryId] = result.taskReport;
                    }
                });

                setTaskReports(taskReportMap);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Combine diary data with task reports
    useEffect(() => {
        const combined = diaries.map(diary => {
            const taskReport = taskReports[diary._id] || {};

            return {
                ...diary,
                customerRating: taskReport.customerRating,
                customerReview: taskReport.customerReview,
                engineerSignature: taskReport.engineerSignature,
                customerSignature: taskReport.customerSignature,
                checklistStatus: taskReport.checklistStatus,
                additionalNotes: taskReport.additionalNotes,
                documents: taskReport.documents || []
            };
        });

        setCombinedReports(combined);
        setFilteredReports(combined);
    }, [diaries, taskReports]);

    // Apply filters
    useEffect(() => {
        let result = [...combinedReports];

        if (filters.dateRange) {
            const [start, end] = filters.dateRange.split(' to ');
            result = result.filter(report => {
                const reportDate = new Date(report.date);
                return (!start || reportDate >= new Date(start)) &&
                    (!end || reportDate <= new Date(end));
            });
        }

        if (filters.engineer) {
            result = result.filter(report =>
                report.engineer && report.engineer._id === filters.engineer
            );
        }

        if (filters.status) {
            result = result.filter(report => report.status === filters.status);
        }

        setFilteredReports(result);
    }, [filters, combinedReports]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            dateRange: '',
            engineer: '',
            status: ''
        });
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // ===== Header =====
        doc.setFillColor(253, 236, 236);
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.addImage(logoPng, "PNG", 15, 8, 60, 24);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(229, 9, 20);
        doc.text("KRISHA FIRE AND SECURITY", pageWidth - 14, 15, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90, 20, 20);
        doc.text("Sun Gravitas, 1110, Char Rasta,", pageWidth - 14, 20, { align: "right" });
        doc.text("near Jivraj Park Bridge, Rajmani Society,", pageWidth - 14, 25, { align: "right" });
        doc.text("Satellite, Shyamal, Ahmedabad, Gujarat 380015", pageWidth - 14, 30, { align: "right" });
        doc.text("Phone: 90999 26117", pageWidth - 14, 35, { align: "right" });

        // ===== Watermark =====
        try {
            doc.saveGraphicsState();
            if (doc.setGState) {
                doc.setGState(new doc.GState({ opacity: 0.1 }));
            }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(60);
            doc.setTextColor(220, 0, 0);
            doc.text("DRAFT", pageWidth / 2, pageHeight / 2, {
                angle: 45,
                align: "center",
            });
            doc.restoreGraphicsState();
        } catch {
            doc.setFontSize(50);
            doc.setTextColor(230, 230, 230);
            doc.text("DRAFT", pageWidth / 2, pageHeight / 2, {
                angle: 45,
                align: "center",
            });
        }

        // ===== Report Metadata =====
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Report Generated: ${new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}`,
            14,
            45
        );
        doc.text(`Total Records: ${filteredReports.length}`, 14, 52);

        // ===== Filters =====
        let filterY = 59;
        if (filters.dateRange) {
            doc.text(`Date Range: ${filters.dateRange}`, 14, filterY);
            filterY += 7;
        }
        if (filters.engineer) {
            const selectedEngineer = engineers.find((e) => e._id === filters.engineer);
            doc.text(
                `Engineer: ${selectedEngineer ? `${selectedEngineer.firstname} ${selectedEngineer.lastname}` : "Unknown"}`,
                14,
                filterY
            );
            filterY += 7;
        }
        if (filters.status) {
            doc.text(
                `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`,
                14,
                filterY
            );
            filterY += 7;
        }

        // ===== Summary Stats =====
        const completedCount = filteredReports.filter((r) => r.status === "completed").length;
        const avgRating =
            filteredReports.filter((r) => r.customerRating).length > 0
                ? (
                    filteredReports.reduce((sum, r) => sum + (r.customerRating || 0), 0) /
                    filteredReports.filter((r) => r.customerRating).length
                ).toFixed(1)
                : "N/A";
        const totalHours = filteredReports
            .reduce((total, r) => {
                if (!r.duration) return total;
                let h = 0,
                    m = 0;
                if (typeof r.duration === "string") {
                    if (r.duration.includes("h")) {
                        const parts = r.duration.split("h ");
                        h = parseInt(parts[0]) || 0;
                        m = parseInt(parts[1]?.replace("m", "")) || 0;
                    } else if (r.duration.includes("m")) {
                        m = parseInt(r.duration.replace("m", "")) || 0;
                    }
                } else if (typeof r.duration === "number") {
                    h = Math.floor(r.duration / 60);
                    m = r.duration % 60;
                }
                return total + h + m / 60;
            }, 0)
            .toFixed(1);

        doc.setFillColor(245, 247, 249);
        doc.rect(14, filterY + 5, pageWidth - 28, 25, "F");
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, filterY + 5, pageWidth - 28, 25, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("SUMMARY STATISTICS", 18, filterY + 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Completed Jobs: ${completedCount}`, 18, filterY + 22);
        doc.text(`Average Rating: ${avgRating}`, 80, filterY + 22);
        doc.text(`Total Hours: ${totalHours}h`, 140, filterY + 22);

        // ===== Data Table =====
        const tableStartY = filterY + 40;
        autoTable(doc, {
            startY: tableStartY,
            head: [["Engineer", "Site", "Date", "Duration", "Status", "Rating", "Notes"]],
            body: filteredReports.map((r) => [
                r.engineer ? `${r.engineer.firstname} ${r.engineer.lastname}` : "N/A",
                r.site ? r.site.site_name : "N/A",
                new Date(r.date).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                }),
                formatDuration(r.duration),
                r.status.charAt(0).toUpperCase() + r.status.slice(1),
                r.customerRating ? `${r.customerRating}/5` : "N/A",
                (r.notes || "").substring(0, 60) + (r.notes?.length > 60 ? "..." : ""),
            ]),
            theme: "striped",
            tableWidth: "auto",
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 10,
                halign: "center",
            },
            bodyStyles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            styles: { cellWidth: "auto" },
            columnStyles: {
                6: { cellWidth: 60 }, // Notes wider, others auto
            },
            margin: { top: 10, left: 14, right: 14 },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${data.pageNumber} | Generated by Engineer Management System | ${new Date().toLocaleDateString()}`,
                    14,
                    pageHeight - 10
                );
            },
        });

        // ===== Extra Summary Page (if multiple pages) =====
        if (doc.internal.getNumberOfPages() > 1) {
            doc.addPage();

            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, pageWidth, 25, "F");
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("REPORT SUMMARY", 14, 16);

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text("Performance Metrics", 14, 40);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const statusCounts = {};
            filteredReports.forEach((r) => {
                statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
            });

            let yPos = 50;
            Object.entries(statusCounts).forEach(([status, count]) => {
                doc.text(
                    `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${(
                        (count / filteredReports.length) *
                        100
                    ).toFixed(1)}%)`,
                    14,
                    yPos
                );
                yPos += 7;
            });

            if (filteredReports.some((r) => r.customerRating)) {
                doc.setFont("helvetica", "bold");
                doc.text("Customer Satisfaction", 14, yPos + 10);
                doc.setFont("helvetica", "normal");

                const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                filteredReports.forEach((r) => {
                    if (r.customerRating) ratingCounts[r.customerRating]++;
                });

                yPos += 20;
                for (let i = 5; i >= 1; i--) {
                    if (ratingCounts[i] > 0) {
                        doc.text(`${i} Star: ${ratingCounts[i]} reviews`, 14, yPos);
                        yPos += 7;
                    }
                }
            }
        }

        return doc;
    };


    const exportToPDF = () => {
        const doc = generatePDF();
        doc.save(`engineer-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const previewPDF = () => {
        const doc = generatePDF();

        // Create a Blob instead of datauristring
        const pdfBlob = doc.output('blob');

        // Create a URL for the Blob
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setPdfDataUrl(pdfUrl);
        setPdfPreviewOpen(true);
    };

    const closePreview = () => {
        setPdfPreviewOpen(false);

        // Revoke the object URL to free up memory
        if (pdfDataUrl) {
            URL.revokeObjectURL(pdfDataUrl);
        }

        setPdfDataUrl('');
    };

    const openDetailedPreview = (report) => {
        setSelectedEngineerReport(report);
        setDetailedPreviewOpen(true);
    };

    const closeDetailedPreview = () => {
        setSelectedEngineerReport(null);
        setDetailedPreviewOpen(false);
    };

    const printDetailedReport = () => {
        const report = selectedEngineerReport;
        if (!report) return;

        const addr = [
            report.site?.address_line_1,
            report.site?.address_line_2,
            report.site?.city,
            report.site?.state,
            report.site?.postcode
        ].filter(Boolean).join(', ');

        const engineerName = report.engineer
            ? `${report.engineer.firstname} ${report.engineer.lastname}`
            : 'Not Assigned';

        const stars = (n) => Array.from({ length: 5 }, (_, i) =>
            `<span style="color:${i < n ? '#f59e0b' : '#e5e7eb'}; font-size:16px;">★</span>`
        ).join('');

        const checklist = report.checklistStatus
            ? Object.entries(report.checklistStatus).map(([k, v]) => `
            <div class="check-item">
                <span class="${v ? 'check-yes' : 'check-no'}">${v ? '✔' : '✘'}</span>
                <span>${k}</span>
            </div>`).join('')
            : '';

        const printWindow = window.open('', '', 'width=960,height=750');
        printWindow.document.write(`
    <html>
    <head>
        <title>Task Report – ${engineerName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1f2937; font-size: 13px; }

            .header { background: #111827; color: white; padding: 20px 28px 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header-left h1 { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
            .header-left p { color: #9ca3af; font-size: 11px; margin-top: 3px; }
            .header-right { text-align: right; }
            .report-badge { background: #dc2626; color: white; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px; display: inline-block; margin-bottom: 4px; }
            .header-right p { color: #9ca3af; font-size: 10px; margin-top: 2px; }
            .accent-bar { height: 4px; background: #dc2626; }

            .page { padding: 20px 28px; }

            .section { margin-bottom: 16px; }
            .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #dc2626; border-left: 3px solid #dc2626; padding: 4px 10px; background: #f9fafb; margin-bottom: 10px; }
            .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .field label { font-size: 10px; color: #6b7280; font-weight: 500; display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
            .field p { font-size: 13px; font-weight: 600; color: #111827; }

            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .status-completed { background: #dcfce7; color: #166534; }
            .status-scheduled { background: #dbeafe; color: #1e40af; }
            .status-accepted { background: #fef9c3; color: #854d0e; }
            .status-on-route { background: #ffedd5; color: #9a3412; }
            .status-on-site { background: #f3e8ff; color: #6b21a8; }
            .status-default { background: #f3f4f6; color: #374151; }

            .notes-box { background: #f9fafb; border-radius: 5px; padding: 10px 14px; font-size: 13px; color: #374151; line-height: 1.6; white-space: pre-wrap; border: 1px solid #e5e7eb; min-height: 48px; }

            .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .check-item { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 3px 0; }
            .check-yes { color: #16a34a; font-weight: 700; font-size: 13px; width: 16px; }
            .check-no { color: #d1d5db; font-weight: 700; font-size: 13px; width: 16px; }

            .sig-img { max-height: 70px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; background: #fff; }

            .footer { background: #111827; color: #6b7280; padding: 10px 28px; font-size: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
            .footer span.brand { color: #dc2626; font-weight: 600; }

            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
            <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
            <p>Ref: RPT-${report._id?.slice(-6).toUpperCase()}</p>
        </div>
    </div>
    <div class="accent-bar"></div>

    <div class="page">

        <div class="section">
            <div class="section-title">Task Information</div>
            <div class="card grid-3">
                <div class="field"><label>Status</label>
                    <p><span class="status-badge status-${report.status?.replace('-', '') || 'default'}">${report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'N/A'}</span></p>
                </div>
                <div class="field"><label>Date</label><p>${report.date ? new Date(report.date).toLocaleDateString('en-IN') : 'N/A'}</p></div>
                <div class="field"><label>Duration</label><p>${report.duration || 'N/A'}</p></div>
                <div class="field"><label>Start Time</label><p>${report.startTime || 'N/A'}</p></div>
                <div class="field"><label>End Time</label><p>${report.endTime || 'N/A'}</p></div>
                <div class="field"><label>Call Ref</label><p>${report.callLog ? '#' + report.callLog.call_number : 'N/A'}</p></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Site &amp; Engineer Details</div>
            <div class="card grid-2">
                <div>
                    <div class="field" style="margin-bottom:10px"><label>Site Name</label><p>${report.site?.site_name || 'N/A'}</p></div>
                    <div class="field" style="margin-bottom:10px"><label>Site Code</label><p>${report.site?.site_code || 'N/A'}</p></div>
                    <div class="field"><label>Address</label><p>${addr || 'N/A'}</p></div>
                </div>
                <div>
                    <div class="field" style="margin-bottom:10px"><label>Assigned Engineer</label><p>${engineerName}</p></div>
                    <div class="field" style="margin-bottom:10px"><label>Contact Person</label><p>${report.site?.contact_name || 'N/A'}</p></div>
                    <div class="field"><label>Contact Number</label><p>${report.site?.contact_no || 'N/A'}</p></div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Work Notes</div>
            <div class="card grid-2">
                <div>
                    <div class="field" style="margin-bottom:6px"><label>Task Notes</label></div>
                    <div class="notes-box">${report.notes || 'No notes provided'}</div>
                </div>
                <div>
                    <div class="field" style="margin-bottom:6px"><label>Additional Notes</label></div>
                    <div class="notes-box">${report.additionalNotes || 'No additional notes'}</div>
                </div>
            </div>
        </div>

        ${checklist ? `
        <div class="section">
            <div class="section-title">Checklist</div>
            <div class="card"><div class="check-grid">${checklist}</div></div>
        </div>` : ''}

        <div class="section">
            <div class="section-title">Customer Feedback</div>
            <div class="card grid-2">
                <div class="field">
                    <label>Rating</label>
                    <div style="margin-top:4px">${stars(report.customerRating || 0)}
                        <span style="font-size:11px;color:#6b7280;margin-left:4px">${report.customerRating || 0}/5</span>
                    </div>
                </div>
                <div class="field"><label>Review</label><p>${report.customerReview || 'No review provided'}</p></div>
            </div>
        </div>

        ${(report.engineerSignature || report.customerSignature) ? `
        <div class="section">
            <div class="section-title">Signatures</div>
            <div class="card grid-2">
                ${report.engineerSignature ? `<div class="field"><label>Engineer Signature</label><br/><img src="${report.engineerSignature}" class="sig-img"/></div>` : ''}
                ${report.customerSignature ? `<div class="field"><label>Customer Signature</label><br/><img src="${report.customerSignature}" class="sig-img"/></div>` : ''}
            </div>
        </div>` : ''}

    </div>

    <div class="footer">
        <span class="brand">Krisha Fire &amp; Security LLP</span>
        <span>Confidential – Internal Use Only</span>
    </div>

    <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>`);
        printWindow.document.close();
    };
    const exportToExcel = () => {
        // Main worksheet with detailed data matching your PDF format
        const mainData = filteredReports.map(report => ({
            'Engineer Name': report.engineer ? `${report.engineer.firstname} ${report.engineer.lastname}` : 'N/A',
            'Site Name': report.site ? report.site.site_name : 'N/A',
            'Date': new Date(report.date).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }),
            'Duration': formatDuration(report.duration),
            'Status': report.status.charAt(0).toUpperCase() + report.status.slice(1),
            'Rating': report.customerRating ? `${report.customerRating}/5` : 'N/A',
            'Notes': (report.notes || '').substring(0, 50) + (report.notes && report.notes.length > 50 ? '...' : ''),
            'Start Time': report.startTime || 'N/A',
            'End Time': report.endTime || 'N/A',
            'Call Number': report.callLog ? `#${report.callLog.call_number}` : 'N/A',
            'Engineer ID': report.engineer ? report.engineer._id : 'N/A',
            'Site Location': report.site ? report.site.location : 'N/A',
            'Site ID': report.site ? report.site._id : 'N/A',
            'Call ID': report.callLog ? report.callLog._id : 'N/A',
            'Customer Review': report.customerReview || 'N/A',
            'Additional Notes': report.additionalNotes || 'N/A',
            'Checklist Status': report.checklistStatus ? 'Completed' : 'Not Completed',
            'Engineer Signature': report.engineerSignature ? 'Yes' : 'No',
            'Customer Signature': report.customerSignature ? 'Yes' : 'No',
            'Documents Attached': report.documents && report.documents.length > 0 ? report.documents.length : 'None'
        }));

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Main data worksheet (Detailed Reports)
        const mainWorksheet = XLSX.utils.json_to_sheet(mainData);

        // Set column widths for optimal viewing
        const columnWidths = [
            { wch: 20 }, // Engineer Name
            { wch: 15 }, // Site Name
            { wch: 12 }, // Date
            { wch: 12 }, // Duration
            { wch: 12 }, // Status
            { wch: 10 }, // Rating
            { wch: 40 }, // Notes
            { wch: 12 }, // Start Time
            { wch: 12 }, // End Time
            { wch: 15 }, // Call Reference
            { wch: 15 }, // Call Number
            { wch: 25 }, // Engineer ID
            { wch: 20 }, // Site Location
            { wch: 25 }, // Site ID
            { wch: 25 }, // Call ID
            { wch: 30 }, // Customer Review
            { wch: 20 }, // Additional Notes
            { wch: 15 }, // Checklist Status
            { wch: 18 }, // Engineer Signature
            { wch: 18 }, // Customer Signature
            { wch: 18 }  // Documents Attached
        ];

        mainWorksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Detailed Reports');

        // Add metadata
        workbook.Props = {
            Title: 'Engineer Activity Report',
            Subject: 'Field Service Analytics',
            Author: 'Engineer Management System',
            CreatedDate: new Date()
        };

        XLSX.writeFile(workbook, `engineer-detailed-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'accepted': return 'bg-yellow-100 text-yellow-800';
            case 'on-route': return 'bg-orange-100 text-orange-800';
            case 'on-site': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';

        // Check if duration is already in the correct format
        if (typeof duration === 'string' && (duration.includes('h') || duration.includes('m'))) {
            return duration;
        }

        // If it's a number (minutes), convert to h m format
        if (typeof duration === 'number') {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        }

        return 'N/A';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading reports...</p>
                        </div>
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
                <main className="flex-1 bg-gray-50 mt-20 sm:mt-24 p-3 sm:p-4 md:p-6 lg:pl-80">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Engineer Reports</h1>
                                <p className="text-gray-600 mt-1">Comprehensive field service analytics and reporting</p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
                                <span className="text-sm text-gray-500 sm:mr-4 self-start sm:self-center">
                                    {filteredReports.length} record{filteredReports.length !== 1 ? 's' : ''} found
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Filters</h2>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800 self-start sm:self-center"
                            >
                                Clear all filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <input
                                    type="text"
                                    name="dateRange"
                                    placeholder="e.g. 2023-06-01 to 2023-06-30"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filters.dateRange}
                                    onChange={handleFilterChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD to YYYY-MM-DD</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                                <select
                                    name="engineer"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filters.engineer}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Engineers</option>
                                    {engineers.map(engineer => (
                                        <option key={engineer._id} value={engineer._id}>
                                            {engineer.firstname} {engineer.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="on-route">On Route</option>
                                    <option value="on-site">On Site</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Export Reports</h2>
                                <p className="text-sm text-gray-600 mt-1">Download filtered data in your preferred format</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                                <button
                                    onClick={previewPDF}
                                    disabled={filteredReports.length === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview PDF
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    disabled={filteredReports.length === 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export PDF
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={filteredReports.length === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Total Reports</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{filteredReports.length}</div>
                            <div className="text-xs text-gray-400 mt-1">All time records</div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Completed</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-green-600">
                                {filteredReports.filter(r => r.status === 'completed').length}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {filteredReports.length > 0
                                    ? `${((filteredReports.filter(r => r.status === 'completed').length / filteredReports.length) * 100).toFixed(1)}% completion rate`
                                    : 'No data'}
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Avg. Rating</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-600">
                                {filteredReports.filter(r => r.customerRating).length > 0
                                    ? (filteredReports.reduce((sum, r) => sum + (r.customerRating || 0), 0) /
                                        filteredReports.filter(r => r.customerRating).length).toFixed(1)
                                    : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {filteredReports.filter(r => r.customerRating).length} ratings
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            <div className="text-sm font-medium text-gray-500">Total Hours</div>
                            <div className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
                                {filteredReports.reduce((total, report) => {
                                    if (!report.duration) return total;

                                    let hours = 0;
                                    let minutes = 0;

                                    if (typeof report.duration === 'string') {
                                        if (report.duration.includes('h')) {
                                            const parts = report.duration.split('h ');
                                            hours = parseInt(parts[0]) || 0;
                                            minutes = parseInt(parts[1]?.replace('m', '')) || 0;
                                        } else if (report.duration.includes('m')) {
                                            minutes = parseInt(report.duration.replace('m', '')) || 0;
                                        }
                                    } else if (typeof report.duration === 'number') {
                                        hours = Math.floor(report.duration / 60);
                                        minutes = report.duration % 60;
                                    }

                                    return total + hours + (minutes / 60);
                                }, 0).toFixed(1)}h
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Billable hours</div>
                        </div>
                    </div>

                    {/* Reports Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Detailed Reports</h2>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="block lg:hidden">
                            {filteredReports.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>No reports found matching your filters</p>
                                    <button
                                        onClick={clearFilters}
                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Clear filters to see all reports
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredReports.map((report) => (
                                        <div key={report._id} className="p-4 sm:p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {report.engineer ? report.engineer.firstname.charAt(0) : 'N'}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {report.engineer ? `${report.engineer.firstname} ${report.engineer.lastname}` : 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {report.site ? report.site.site_name : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Date:</span>
                                                    <div className="font-medium">{new Date(report.date).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Duration:</span>
                                                    <div className="font-medium">{formatDuration(report.duration)}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Time:</span>
                                                    <div className="font-medium">{report.startTime} - {report.endTime}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Rating:</span>
                                                    <div className="font-medium">
                                                        {report.customerRating ? (
                                                            <div className="flex items-center">
                                                                <span className="mr-1">{report.customerRating}</span>
                                                                <svg
                                                                    className="w-4 h-4 text-yellow-500"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>

                                                            </div>
                                                        ) : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {report.notes && (
                                                <div className="mt-3 text-sm">
                                                    <span className="text-gray-500">Notes:</span>
                                                    <p className="text-gray-800 mt-1">{report.notes}</p>
                                                </div>
                                            )}

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button
                                                    onClick={() => openDetailedPreview(report)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Preview Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Engineer
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Site
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rating
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9  12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2  01-2 2z" />
                                                    </svg>
                                                    <p className="text-lg font-medium">No reports found</p>
                                                    <p className="text-sm">Try adjusting your filters or check back later.</p>
                                                    <button
                                                        onClick={clearFilters}
                                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReports.map((report) => (
                                            <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {report.engineer ? report.engineer.firstname.charAt(0) : 'N'}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {report.engineer ? `${report.engineer.firstname} ${report.engineer.lastname}` : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className=" px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {report.site ? report.site.site_name : 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {report.callLog ? `Call Number : #${report.callLog.call_number}` : 'No reference'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {new Date(report.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {report.startTime} - {report.endTime}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatDuration(report.duration)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {report.customerRating ? (
                                                        <div className="flex items-center">
                                                            <span className="text-sm font-medium text-gray-900 mr-1">{report.customerRating}</span>
                                                            <div className="flex">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        className={`w-4 h-4 ${i < report.customerRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 
           1 0 00.95.69h3.462c.969 0 1.371 1.24.588 
           1.81l-2.8 2.034a1 1 0 00-.364 
           1.118l1.07 3.292c.3.921-.755 1.688-1.54 
           1.118l-2.8-2.034a1 1 0 00-1.175 
           0l-2.8 2.034c-.784.57-1.838-.197-1.539-
           1.118l1.07-3.292a1 1 0 00-.364-
           1.118L2.98 8.72c-.783-.57-.38-1.81.588-
           1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>

                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Not rated</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openDetailedPreview(report)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        Preview
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for large datasets */}
                        {filteredReports.length > 50 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className=" text-sm text-gray-700">
                                        Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(50, filteredReports.length)}</span> of{' '}
                                        <span className="font-medium">{filteredReports.length}</span> results
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                            Previous
                                        </button>
                                        <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Performance Insights */}
                    {filteredReports.length > 0 && (
                        <div className="mt-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Insights</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* Status Distribution */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray- 700 mb-3">Status Distribution</h3>
                                    <div className="space-y-2">
                                        {['completed', 'scheduled', 'accepted', 'on-route', 'on-site'].map(status => {
                                            const count = filteredReports.filter(r => r.status === status).length;
                                            const percentage = filteredReports.length > 0 ? (count / filteredReports.length) * 100 : 0;
                                            return count > 0 ? (
                                                <div key={status} className="flex items-center justify-between text-sm">
                                                    <span className="capitalize text-gray-600">{status.replace('-', ' ')}</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                            <div
                                                                className={`h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-')}`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 w-8">{count}</span>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>

                                {/* Top Engineers */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Top Engineers</h3>
                                    <div className="space-y-2">
                                        {engineers.slice(0, 5).map(engineer => {
                                            const engineerReports = filteredReports.filter(r => r.engineer && r.engineer._id === engineer._id);
                                            const avgRating = engineerReports.filter(r => r.customerRating).length > 0
                                                ? (engineerReports.reduce((sum, r) => sum + (r.customerRating || 0), 0) /
                                                    engineerReports.filter(r => r.customerRating).length).toFixed(1)
                                                : 'N/A';

                                            return engineerReports.length > 0 ? (
                                                <div key={engineer._id} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">{engineer.firstname} {engineer.lastname}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-500">{engineerReports.length} jobs</span>
                                                        <span className="font-medium text-gray-900">{avgRating}</span>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
                                    <div className="space-y-2">
                                        {filteredReports
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 5)
                                            .map(report => (
                                                <div key={report._id} className="text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600 truncate">
                                                            {report.engineer ? `${report.engineer.firstname} ${report.engineer.lastname}` : 'Unknown'}
                                                        </span>
                                                        <span className="text-gray-500 text-xs ml-2">
                                                            {new Date(report.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {report.site ? report.site.site_name : 'Unknown site'}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Preview Modal */}
                    {pdfPreviewOpen && (
                        <div className="fixed inset-0 z-50 overflow-auto bg-black/75 flex items-center justify-center p-4">
                            <div className="relative bg-white rounded-lg w-full h-full max-w-6xl max-h-screen flex flex-col">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={exportToPDF}
                                            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={closePreview}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <iframe
                                        src={pdfDataUrl}
                                        className="w-full h-full border-0"
                                        title="PDF Preview"
                                        type="application/pdf"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed Engineer Task Report Preview Modal */}
                    {detailedPreviewOpen && selectedEngineerReport && (
                        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

                                {/* Modal Header */}
                                <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-0.5">Task Report Preview</div>
                                        <div className="font-bold text-base">
                                            {selectedEngineerReport.engineer
                                                ? `${selectedEngineerReport.engineer.firstname} ${selectedEngineerReport.engineer.lastname}`
                                                : 'Unknown Engineer'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {selectedEngineerReport.site?.site_name} &nbsp;·&nbsp; {new Date(selectedEngineerReport.date).toLocaleDateString('en-IN')}
                                        </div>
                                    </div>
                                    <button onClick={closeDetailedPreview} className="text-gray-400 hover:text-white transition-colors p-1 rounded">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="h-1 bg-red-600 flex-shrink-0" />

                                {/* Scrollable Body */}
                                <div className="overflow-y-auto flex-1 p-6 space-y-5 bg-gray-50">

                                    {/* Task Info */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Task Information</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Status', value: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedEngineerReport.status)}`}>{selectedEngineerReport.status?.charAt(0).toUpperCase() + selectedEngineerReport.status?.slice(1)}</span> },
                                                { label: 'Date', value: new Date(selectedEngineerReport.date).toLocaleDateString('en-IN') },
                                                { label: 'Duration', value: formatDuration(selectedEngineerReport.duration) },
                                                { label: 'Start Time', value: selectedEngineerReport.startTime || 'N/A' },
                                                { label: 'End Time', value: selectedEngineerReport.endTime || 'N/A' },
                                                { label: 'Call Ref', value: selectedEngineerReport.callLog ? `#${selectedEngineerReport.callLog.call_number}` : 'N/A' },
                                            ].map(({ label, value }) => (
                                                <div key={label}>
                                                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                                                    <div className="text-sm font-semibold text-gray-800">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Site & Engineer */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Site & Engineer Details</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Site Name', value: selectedEngineerReport.site?.site_name },
                                                    { label: 'Site Code', value: selectedEngineerReport.site?.site_code },
                                                    { label: 'Address', value: [selectedEngineerReport.site?.address_line_1, selectedEngineerReport.site?.address_line_2, selectedEngineerReport.site?.city, selectedEngineerReport.site?.state].filter(Boolean).join(', ') },
                                                ].map(({ label, value }) => (
                                                    <div key={label}>
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                                                        <div className="text-sm font-semibold text-gray-800">{value || 'N/A'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Assigned Engineer', value: selectedEngineerReport.engineer ? `${selectedEngineerReport.engineer.firstname} ${selectedEngineerReport.engineer.lastname}` : 'N/A' },
                                                    { label: 'Contact Person', value: selectedEngineerReport.site?.contact_name },
                                                    { label: 'Contact Number', value: selectedEngineerReport.site?.contact_no },
                                                ].map(({ label, value }) => (
                                                    <div key={label}>
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                                                        <div className="text-sm font-semibold text-gray-800">{value || 'N/A'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Work Notes</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Task Notes</div>
                                                <div className="bg-gray-50 rounded-md border border-gray-200 p-3 text-sm text-gray-700 min-h-[60px]">
                                                    {selectedEngineerReport.notes || 'No notes provided'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Additional Notes</div>
                                                <div className="bg-gray-50 rounded-md border border-gray-200 p-3 text-sm text-gray-700 min-h-[60px]">
                                                    {selectedEngineerReport.additionalNotes || 'No additional notes'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checklist */}
                                    {selectedEngineerReport.checklistStatus && Object.keys(selectedEngineerReport.checklistStatus).length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-red-500 rounded-full" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Checklist</span>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {Object.entries(selectedEngineerReport.checklistStatus).map(([key, val]) => (
                                                    <div key={key} className="flex items-center gap-2 text-sm">
                                                        <span className={`text-base font-bold ${val ? 'text-green-500' : 'text-gray-300'}`}>{val ? '✔' : '✘'}</span>
                                                        <span className="text-gray-700">{key}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Customer Feedback */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Customer Feedback</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Rating</div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <svg key={i} className={`w-5 h-5 ${i <= (selectedEngineerReport.customerRating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                    <span className="text-xs text-gray-400 ml-1">{selectedEngineerReport.customerRating || 0}/5</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Review</div>
                                                <div className="text-sm font-semibold text-gray-800">{selectedEngineerReport.customerReview || 'No review provided'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures */}
                                    {(selectedEngineerReport.engineerSignature || selectedEngineerReport.customerSignature) && (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-red-500 rounded-full" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Signatures</span>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedEngineerReport.engineerSignature && (
                                                    <div>
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Engineer Signature</div>
                                                        <img src={selectedEngineerReport.engineerSignature} alt="Engineer Signature" className="border rounded max-h-24 object-contain bg-white p-2" />
                                                    </div>
                                                )}
                                                {selectedEngineerReport.customerSignature && (
                                                    <div>
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Customer Signature</div>
                                                        <img src={selectedEngineerReport.customerSignature} alt="Customer Signature" className="border rounded max-h-24 object-contain bg-white p-2" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Modal Footer */}
                                {/* Modal Footer */}
                                <div className="border-t border-gray-200 px-6 py-3 bg-white flex justify-between items-center flex-shrink-0">
                                    <span className="text-xs text-gray-400">Krisha Fire & Security LLP · Confidential</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={printDetailedReport}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Print
                                        </button>
                                        <button onClick={closeDetailedPreview} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default EngineerReport;