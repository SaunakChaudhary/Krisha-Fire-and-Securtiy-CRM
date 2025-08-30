import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EngineerReport = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [engineers, setEngineers] = useState([]);
    const [selectedEngineers, setSelectedEngineers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [reportType, setReportType] = useState('summary');
    const [includeContact, setIncludeContact] = useState(true);
    const [includeAssignedSites, setIncludeAssignedSites] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Fetch engineers from API
    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`);
                if (!response.ok) throw new Error('Failed to fetch engineers');
                const data = await response.json();
                setEngineers(data.users);
            } catch (error) {
                console.error("Error fetching engineers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEngineers();
    }, []);

    // Toggle individual engineer selection
    const toggleEngineerSelection = (engineerId) => {
        if (selectedEngineers.includes(engineerId)) {
            setSelectedEngineers(selectedEngineers.filter(id => id !== engineerId));
        } else {
            setSelectedEngineers([...selectedEngineers, engineerId]);
        }
    };

    // Select all engineers from dropdown
    const selectAllEngineers = () => {
        setSelectedEngineers(engineers.map(engineer => engineer._id));
        setSelectAll(true);
        setDropdownOpen(false);
    };

    // Clear all engineer selections
    const clearAllEngineers = () => {
        setSelectedEngineers([]);
        setSelectAll(false);
        setDropdownOpen(false);
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Prepare data for preview and export
    const prepareData = () => {
        if (selectedEngineers.length === 0) return null;

        const selectedEngineerData = engineers.filter(e => selectedEngineers.includes(e._id));

        // Prepare data for all selected engineers
        const allEngineersData = selectedEngineerData.map(engineer => {
            // Prepare engineer information
            const engineerInfo = {
                'Engineer Name': engineer.name || 'N/A',
                'Employee ID': engineer.employee_id || 'N/A',
                'Designation': engineer.designation || 'N/A',
                'Department': engineer.department || 'N/A',
                'Email': includeContact ? engineer.email || 'N/A' : 'Excluded',
                'Phone': includeContact ? engineer.phone || 'N/A' : 'Excluded',
                'Status': engineer.status || 'N/A',
                'Date of Joining': engineer.date_of_joining ? new Date(engineer.date_of_joining).toLocaleDateString() : 'N/A',
                'Experience': engineer.experience ? `${engineer.experience} years` : 'N/A',
                'Specialization': engineer.specialization || 'N/A'
            };

            // Prepare assigned sites data if included
            let assignedSitesData = [];
            if (includeAssignedSites && engineer.assigned_sites && engineer.assigned_sites.length > 0) {
                assignedSitesData = engineer.assigned_sites.map(site => ({
                    'Engineer Name': engineer.name || 'N/A',
                    'Employee ID': engineer.employee_id || 'N/A',
                    'Site Name': site.site_name || 'N/A',
                    'Site Code': site.site_code || 'N/A',
                    'Assignment Date': site.assignment_date ? new Date(site.assignment_date).toLocaleDateString() : 'N/A',
                    'Status': site.status || 'N/A',
                    'Last Visit': site.last_visit_date ? new Date(site.last_visit_date).toLocaleDateString() : 'N/A'
                }));
            }

            return {
                engineerInfo,
                assignedSitesData,
                engineer
            };
        });

        // Combine all assigned sites data
        const allAssignedSitesData = allEngineersData.flatMap(engineerData => engineerData.assignedSitesData);

        return {
            allEngineersData,
            allAssignedSitesData,
            selectedEngineerData
        };
    };

    // Generate preview
    const generatePreview = () => {
        if (selectedEngineers.length === 0) {
            alert('Please select at least one engineer first');
            return;
        }

        const data = prepareData();
        if (!data) return;

        setPreviewData(data);
        setShowPreview(true);
    };

    // Generate PDF report for all selected engineers
    const generatePDF = () => {
        if (!previewData) return;

        const { allEngineersData, allAssignedSitesData } = previewData;
        const doc = new jsPDF();

        // Set document properties
        doc.setProperties({
            title: `Engineers Report - ${allEngineersData.length} Engineers`,
            subject: 'Engineers Report',
            author: 'Krisha Fire and Security',
            keywords: 'engineers, report, summary',
            creator: 'Krisha Fire and Security'
        });

        // Add header to each page
        const addHeader = (doc, pageNumber, totalPages) => {
            // Save current state
            doc.saveGraphicsState();

            // Add blue header background
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 0, 210, 30, 'F');

            // Add company name
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('KRISHA FIRE AND SECURITY', 105, 12, { align: 'center' });

            // Add company address
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            doc.text('Sun Gravitas, 1110, Char Rasta, near Jivraj Park Bridge, Rajmani Society, Satellite, Shyamal, Ahmedabad, Gujarat 380015', 105, 18, { align: 'center' });

            // Add company phone
            doc.text('Phone: 090999 26117', 105, 24, { align: 'center' });

            // Add report title
            doc.setFillColor(249, 250, 251);
            doc.rect(0, 30, 210, 15, 'F');

            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text('ENGINEER MANAGEMENT REPORT', 105, 38, { align: 'center' });

            // Add report details
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 45);
            doc.text(`Total Engineers: ${allEngineersData.length}`, 180, 45, { align: 'right' });

            // Add separator line
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.5);
            doc.line(15, 48, 195, 48);

            // Restore state
            doc.restoreGraphicsState();
        };

        let yPosition = 55;
        const pageHeight = doc.internal.pageSize.height;
        const totalPages = Math.ceil(allEngineersData.length / 2) + (includeAssignedSites && allAssignedSitesData.length > 0 ? 1 : 0);
        let currentPage = 1;

        // Add header to first page
        addHeader(doc, currentPage, totalPages);

        // Generate a report for each engineer
        allEngineersData.forEach((engineerData, index) => {
            const { engineerInfo, engineer } = engineerData;

            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                currentPage++;
                addHeader(doc, currentPage, totalPages);
                yPosition = 55;
            }

            // Engineer Information Section
            doc.setFontSize(12);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(`ENGINEER INFORMATION: ${engineer.name || 'N/A'}`, 15, yPosition);

            // Add colored underline
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.line(15, yPosition + 2, 70, yPosition + 2);

            yPosition += 10;

            // Create a table for engineer information
            const engineerInfoRows = [];
            Object.entries(engineerInfo).forEach(([key, value]) => {
                // Skip excluded fields
                if (value === 'Excluded') return;

                engineerInfoRows.push([
                    { content: key, styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
                    { content: value, styles: { textColor: [75, 85, 99] } }
                ]);
            });

            // Generate table using autoTable
            autoTable(doc, {
                startY: yPosition,
                body: engineerInfoRows,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    lineColor: [209, 213, 219],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                margin: { left: 15, right: 15 },
                tableWidth: 'wrap'
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Assigned Sites if selected and available
            if (includeAssignedSites && engineer.assigned_sites && engineer.assigned_sites.length > 0) {
                // Check if we need a new page
                if (yPosition > pageHeight - 100) {
                    doc.addPage();
                    currentPage++;
                    addHeader(doc, currentPage, totalPages);
                    yPosition = 55;
                }

                doc.setFontSize(12);
                doc.setTextColor(31, 41, 55);
                doc.setFont('helvetica', 'bold');
                doc.text('ASSIGNED SITES', 15, yPosition);

                // Add colored underline
                doc.setDrawColor(59, 130, 246);
                doc.setLineWidth(0.5);
                doc.line(15, yPosition + 2, 50, yPosition + 2);

                yPosition += 10;

                // Prepare table data
                const tableData = engineer.assigned_sites.map(site => [
                    site.site_name || 'N/A',
                    site.site_code || 'N/A',
                    site.assignment_date ? new Date(site.assignment_date).toLocaleDateString() : 'N/A',
                    site.status || 'N/A',
                    site.last_visit_date ? new Date(site.last_visit_date).toLocaleDateString() : 'N/A'
                ]);

                // Generate table using autoTable
                autoTable(doc, {
                    startY: yPosition,
                    head: [['Site Name', 'Site Code', 'Assignment Date', 'Status', 'Last Visit']],
                    body: tableData,
                    theme: 'grid',
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        lineColor: [209, 213, 219],
                        lineWidth: 0.3
                    },
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [249, 250, 251]
                    },
                    margin: { left: 15, right: 15 }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // Add a separator between engineers
            if (index < allEngineersData.length - 1) {
                doc.setDrawColor(209, 213, 219);
                doc.setLineWidth(0.5);
                doc.line(15, yPosition, 195, yPosition);
                yPosition += 10;
            }
        });

        // Add a summary page with all assigned sites if applicable
        if (includeAssignedSites && allAssignedSitesData.length > 0) {
            doc.addPage();
            currentPage++;
            addHeader(doc, currentPage, totalPages);
            yPosition = 55;

            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text('ALL ASSIGNED SITES SUMMARY', 105, yPosition, { align: 'center' });

            // Add colored underline
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.line(75, yPosition + 2, 135, yPosition + 2);

            yPosition += 15;

            // Prepare table data for all assigned sites
            const tableData = allAssignedSitesData.map(site => [
                site['Engineer Name'],
                site['Employee ID'],
                site['Site Name'],
                site['Site Code'],
                site['Assignment Date'],
                site['Status'],
                site['Last Visit']
            ]);

            // Generate table using autoTable
            autoTable(doc, {
                startY: yPosition,
                head: [['Engineer Name', 'Employee ID', 'Site Name', 'Site Code', 'Assignment Date', 'Status', 'Last Visit']],
                body: tableData,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineColor: [209, 213, 219],
                    lineWidth: 0.2
                },
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                margin: { left: 15, right: 15 }
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);

            // Footer line
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.3);
            doc.line(15, pageHeight - 20, 195, pageHeight - 20);

            // Footer text
            doc.text(`Page ${i} of ${pageCount}`, 195, pageHeight - 15, { align: 'right' });
            doc.text(`Confidential - © ${new Date().getFullYear()} Krisha Fire and Security`, 15, pageHeight - 15);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
        }

        // Save the PDF
        doc.save(`Krisha_Engineers_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Generate Excel report for all selected engineers
    const generateExcel = () => {
        if (!previewData) return;

        const { allEngineersData, allAssignedSitesData } = previewData;

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Add engineer information sheet
        const engineerInfoData = allEngineersData.map(engineerData => engineerData.engineerInfo);
        const engineerInfoWS = XLSX.utils.json_to_sheet(engineerInfoData);
        XLSX.utils.book_append_sheet(wb, engineerInfoWS, 'Engineers Information');

        // Add assigned sites sheet if data exists
        if (allAssignedSitesData.length > 0) {
            const assignedSitesWS = XLSX.utils.json_to_sheet(allAssignedSitesData);
            XLSX.utils.book_append_sheet(wb, assignedSitesWS, 'All Assigned Sites');
        }

        // Generate Excel file and download
        XLSX.writeFile(wb, `Krisha_Engineers_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 p-4 lg:ml-64">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Engineer Reports</h1>
                            <p className="text-gray-600">Generate and download detailed engineer reports in PDF and Excel formats</p>
                        </div>

                        {/* Report Configuration Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Configuration</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Engineer Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Engineers *
                                    </label>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={toggleDropdown}
                                            className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex justify-between items-center"
                                        >
                                            <span>
                                                {selectedEngineers.length === 0
                                                    ? 'Select engineers'
                                                    : selectedEngineers.length === engineers.length
                                                        ? 'All Engineers Selected'
                                                        : `${selectedEngineers.length} engineer(s) selected`
                                                }
                                            </span>
                                            <svg className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {dropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={selectAllEngineers}
                                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                                    >
                                                        Select All Engineers
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={clearAllEngineers}
                                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {engineers.map(engineer => (
                                                        <label key={engineer._id} className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEngineers.includes(engineer._id)}
                                                                onChange={() => toggleEngineerSelection(engineer._id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">
                                                                {engineer.name} ({engineer.employee_id})
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="mt-2 text-sm text-gray-500">
                                        {selectedEngineers.length} engineer(s) selected
                                    </p>
                                </div>

                                {/* Report Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Report Type
                                    </label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="summary">Summary Report</option>
                                        <option value="detailed">Detailed Report</option>
                                        <option value="assignments">Assignments Only</option>
                                    </select>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Range (Optional)
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Report Options */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Report Options
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={includeContact}
                                                onChange={(e) => setIncludeContact(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Include Contact Details</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={includeAssignedSites}
                                                onChange={(e) => setIncludeAssignedSites(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Include Assigned Sites</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                                {/* Preview Report Button */}
                                <button
                                    onClick={generatePreview}
                                    disabled={selectedEngineers.length === 0 || loading}
                                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 
           9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    Preview Report
                                </button>

                                {/* Download PDF Button */}
                                <button
                                    onClick={generatePDF}
                                    disabled={!previewData}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 
           8H7a2 2 0 01-2-2V5a2 2 0 
           012-2h5.586a1 1 0 01.707.293L18.707 
           9.707A1 1 0 0119 10.414V19a2 2 0 01-2 2H7z"
                                        />
                                    </svg>
                                    Download PDF
                                </button>

                                {/* Download Excel Button */}
                                <button
                                    onClick={generateExcel}
                                    disabled={!previewData}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 
           8H7a2 2 0 01-2-2V5a2 2 0 
           012-2h5.586a1 1 0 01.707.293L18.707 
           9.707A1 1 0 0119 10.414V19a2 2 0 01-2 2H7z"
                                        />
                                    </svg>
                                    Download Excel
                                </button>
                            </div>


                            {/* Preview Section */}
                            {showPreview && previewData && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                        Report Preview - {previewData.allEngineersData.length} Engineer(s)
                                    </h2>

                                    {/* Engineers Info Table */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">Engineers Information</h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {Object.keys(previewData.allEngineersData[0].engineerInfo).map((key) => (
                                                            <th
                                                                key={key}
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                            >
                                                                {key}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {previewData.allEngineersData.map((engineerData, index) => (
                                                        <tr key={index}>
                                                            {Object.values(engineerData.engineerInfo).map((value, i) => (
                                                                <td
                                                                    key={i}
                                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                >
                                                                    {value}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Assigned Sites Info */}
                                    {previewData.allAssignedSitesData.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-700 mb-2">
                                                Assigned Sites Information ({previewData.allAssignedSitesData.length} assignments)
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            {Object.keys(previewData.allAssignedSitesData[0]).map((key) => (
                                                                <th
                                                                    key={key}
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    {key}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {previewData.allAssignedSitesData.map((site, index) => (
                                                            <tr key={index}>
                                                                {Object.values(site).map((value, i) => (
                                                                    <td
                                                                        key={i}
                                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                    >
                                                                        {value}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                                        <button
                                            onClick={generatePDF}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L18.707 9.707A1 1 0 0119 10.414V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            Download PDF
                                        </button>

                                        <button
                                            onClick={generateExcel}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L18.707 9.707A1 1 0 0119 10.414V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            Download Excel
                                        </button>
                                    </div>
                                </div>
                            )}


                            {/* Instructions */}
                            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <h3 className="text-lg font-medium text-blue-800 mb-3">How to generate reports</h3>
                                <ol className="list-decimal list-inside space-y-2 text-blue-700">
                                    <li>Click on the dropdown to select one or more engineers</li>
                                    <li>Use "Select All Engineers" to choose all engineers at once</li>
                                    <li>Choose the report type and date range if needed</li>
                                    <li>Customize the content using the checkboxes</li>
                                    <li>Click "Preview Report" to see your report</li>
                                    <li>Download in PDF or Excel format using the respective buttons</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EngineerReport;