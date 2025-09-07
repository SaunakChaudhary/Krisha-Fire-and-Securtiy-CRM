import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoPng from '../assets/logo.png';
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from 'react-router-dom';

const SiteReports = () => {
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
            if (!hasPermission("Manage Reports")) {
                return navigate("/UserUnAuthorized/Manage Reports");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sites, setSites] = useState([]);
    const [selectedSites, setSelectedSites] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [reportType, setReportType] = useState('summary');
    const [includeSystems, setIncludeSystems] = useState(true);
    const [includeContact, setIncludeContact] = useState(true);
    const [includeRemarks, setIncludeRemarks] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Fetch sites from API
    useEffect(() => {
        const fetchSites = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sites`);
                if (!response.ok) throw new Error('Failed to fetch sites');
                const data = await response.json();
                setSites(data);
            } catch (error) {
                console.error("Error fetching sites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSites();
    }, []);

    // Toggle individual site selection
    const toggleSiteSelection = (siteId) => {
        if (selectedSites.includes(siteId)) {
            setSelectedSites(selectedSites.filter(id => id !== siteId));
        } else {
            setSelectedSites([...selectedSites, siteId]);
        }
    };

    // Select all sites from dropdown
    const selectAllSites = () => {
        setSelectedSites(sites.map(site => site._id));
        setSelectAll(true);
        setDropdownOpen(false);
    };

    // Clear all site selections
    const clearAllSites = () => {
        setSelectedSites([]);
        setSelectAll(false);
        setDropdownOpen(false);
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Prepare data for export
    const prepareData = () => {
        if (selectedSites.length === 0) return null;

        const selectedSiteData = sites.filter(s => selectedSites.includes(s._id));

        // Prepare data for all selected sites
        const allSitesData = selectedSiteData.map(site => {
            // Prepare site information
            const siteInfo = {
                'Site Name': site.site_name || 'N/A',
                'Site Code': site.site_code || 'N/A',
                'Status': site.status || 'N/A',
                'Premises Type': site.premises_type || 'N/A',
                'Address': `${site.address_line_1 || ''} ${site.address_line_2 || ''}`.trim(),
                'City': site.city || 'N/A',
                'State': site.state || 'N/A',
                'Postcode': site.postcode || 'N/A',
                'Country': site.country || 'N/A',
                'Contact Name': includeContact ? site.contact_name || 'N/A' : 'Excluded',
                'Contact Position': includeContact ? site.position || 'N/A' : 'Excluded',
                'Contact Phone': includeContact ? site.contact_no || 'N/A' : 'Excluded',
                'Contact Email': includeContact ? site.contact_email || 'N/A' : 'Excluded',
                'Admin Remarks': includeRemarks ? site.admin_remarks || 'N/A' : 'Excluded',
                'Site Remarks': includeRemarks ? site.site_remarks || 'N/A' : 'Excluded'
            };

            // Prepare systems data if included
            let systemsData = [];
            if (includeSystems && site.site_systems && site.site_systems.length > 0) {
                systemsData = site.site_systems.map(system => ({
                    'Site Name': site.site_name || 'N/A',
                    'Site Code': site.site_code || 'N/A',
                    'System Name': system.system_id?.system_name || 'N/A',
                    'Status': system.status || 'N/A',
                    'Install Date': system.date_of_install ? new Date(system.date_of_install).toLocaleDateString() : 'N/A',
                    'Warranty Until': system.warranty_date ? new Date(system.warranty_date).toLocaleDateString() : 'N/A',
                    'AMC Until': system.amc_end_date ? new Date(system.amc_end_date).toLocaleDateString() : 'N/A'
                }));
            }

            return {
                siteInfo,
                systemsData,
                site
            };
        });

        // Combine all systems data
        const allSystemsData = allSitesData.flatMap(siteData => siteData.systemsData);

        return {
            allSitesData,
            allSystemsData,
            selectedSiteData
        };
    };

    // Generate PDF report for all selected sites
    const generatePDF = (previewMode = false) => {
        const data = prepareData();
        if (!data) {
            alert('Please select at least one site first');
            return;
        }

        const { allSitesData, allSystemsData } = data;
        const doc = new jsPDF();

        // Set document properties
        doc.setProperties({
            title: `Sites Report - ${allSitesData.length} Sites`,
            subject: 'Sites Report',
            author: 'Krisha Fire and Security',
            keywords: 'sites, report, summary',
            creator: 'Krisha Fire and Security'
        });

        // --- HEADER FUNCTION ---
        const addHeader = (doc, pageNumber, totalPages) => {
            doc.saveGraphicsState();

            // Header background (light red)
            doc.setFillColor(253, 236, 236); // #FDECEC
            doc.rect(0, 0, 210, 40, 'F');

            // Logo
            doc.addImage(logoPng, 'PNG', 15, 8, 60, 24);

            // Company details (right aligned, brand red)
            doc.setFontSize(12);
            doc.setTextColor(229, 9, 20); // #E50914
            doc.setFont('helvetica', 'bold');
            doc.text('KRISHA FIRE AND SECURITY', 200, 15, { align: 'right' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(122, 12, 12); // dark maroon
            doc.text('Sun Gravitas, 1110, Char Rasta,', 200, 20, { align: 'right' });
            doc.text('near Jivraj Park Bridge, Rajmani Society,', 200, 25, { align: 'right' });
            doc.text('Satellite, Shyamal, Ahmedabad, Gujarat 380015', 200, 30, { align: 'right' });
            doc.text('Phone: 90999 26117', 200, 35, { align: 'right' });

            // Report Title Bar (dark maroon background, white text)
            doc.setFillColor(122, 12, 12); // #7A0C0C
            doc.rect(0, 40, 210, 15, 'F');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('SITE MANAGEMENT REPORT', 105, 50, { align: 'center' });

            // Report details
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text(
                `Generated on: ${new Date().toLocaleDateString()} | Total Sites: ${allSitesData.length}`,
                105,
                60,
                { align: 'center' }
            );

            // Separator line
            doc.setDrawColor(229, 9, 20); // red line
            doc.setLineWidth(0.5);
            doc.line(15, 65, 195, 65);

            doc.restoreGraphicsState();
        };

        let yPosition = 75;
        const pageHeight = doc.internal.pageSize.height;
        const totalPages =
            Math.ceil(allSitesData.length / 2) +
            (includeSystems && allSystemsData.length > 0 ? 1 : 0);
        let currentPage = 1;

        addHeader(doc, currentPage, totalPages);

        // --- SITE DATA ---
        allSitesData.forEach((siteData, index) => {
            const { siteInfo, site } = siteData;

            if (yPosition > pageHeight - 100) {
                doc.addPage();
                currentPage++;
                addHeader(doc, currentPage, totalPages);
                yPosition = 75;
            }

            // Site Title
            doc.setFontSize(12);
            doc.setTextColor(122, 12, 12); // dark maroon
            doc.setFont('helvetica', 'bold');
            doc.text(`SITE: ${site.site_name || 'N/A'}`, 15, yPosition);

            // Underline (brand red)
            doc.setDrawColor(229, 9, 20);
            doc.setLineWidth(0.8);
            doc.line(15, yPosition + 2, 80, yPosition + 2);

            yPosition += 12;

            // Site Info Table
            const siteInfoRows = [];
            Object.entries(siteInfo).forEach(([key, value]) => {
                if (value === 'Excluded') return;
                siteInfoRows.push([
                    { content: key, styles: { fontStyle: 'bold', fillColor: [253, 236, 236] } }, // light red background
                    { content: value, styles: { textColor: [31, 41, 55] } }
                ]);
            });

            autoTable(doc, {
                startY: yPosition,
                body: siteInfoRows,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.3,
                    font: 'helvetica',
                    textColor: [31, 41, 55]
                },
                columnStyles: {
                    0: { cellWidth: 60, fillColor: [253, 236, 236] }, // light red
                    1: { cellWidth: 115 }
                },
                headStyles: {
                    fillColor: [229, 9, 20], // red
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [255, 245, 245] // softer light red
                },
                margin: { left: 15, right: 15 },
                tableWidth: 180
            });

            yPosition = doc.lastAutoTable.finalY + 15;

            // Site Systems
            if (includeSystems && site.site_systems && site.site_systems.length > 0) {
                if (yPosition > pageHeight - 120) {
                    doc.addPage();
                    currentPage++;
                    addHeader(doc, currentPage, totalPages);
                    yPosition = 75;
                }

                doc.setFontSize(12);
                doc.setTextColor(122, 12, 12);
                doc.setFont('helvetica', 'bold');
                doc.text('SITE SYSTEMS', 15, yPosition);

                // Underline in red
                doc.setDrawColor(229, 9, 20);
                doc.setLineWidth(0.8);
                doc.line(15, yPosition + 2, 60, yPosition + 2);

                yPosition += 12;

                const tableData = site.site_systems.map(system => [
                    system.system_id?.system_name || 'N/A',
                    system.status || 'N/A',
                    system.date_of_install ? new Date(system.date_of_install).toLocaleDateString() : 'N/A',
                    system.warranty_date ? new Date(system.warranty_date).toLocaleDateString() : 'N/A',
                    system.amc_end_date ? new Date(system.amc_end_date).toLocaleDateString() : 'N/A'
                ]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [['System', 'Status', 'Install Date', 'Warranty Until', 'AMC Until']],
                    body: tableData,
                    theme: 'grid',
                    styles: {
                        fontSize: 9,
                        cellPadding: 4,
                        lineColor: [229, 231, 235],
                        lineWidth: 0.3,
                        font: 'helvetica',
                        textColor: [31, 41, 55]
                    },
                    headStyles: {
                        fillColor: [229, 9, 20],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [255, 245, 245]
                    },
                    margin: { left: 15, right: 15 },
                    tableWidth: 180
                });

                yPosition = doc.lastAutoTable.finalY + 20;
            }

            if (index < allSitesData.length - 1) {
                doc.setDrawColor(229, 231, 235);
                doc.setLineWidth(0.5);
                doc.line(15, yPosition, 195, yPosition);
                yPosition += 15;
            }
        });

        // --- ALL SYSTEMS SUMMARY ---
        if (includeSystems && allSystemsData.length > 0) {
            doc.addPage();
            currentPage++;
            addHeader(doc, currentPage, totalPages);
            yPosition = 75;

            doc.setFontSize(14);
            doc.setTextColor(122, 12, 12);
            doc.setFont('helvetica', 'bold');
            doc.text('ALL SYSTEMS SUMMARY', 105, yPosition, { align: 'center' });

            doc.setDrawColor(229, 9, 20);
            doc.setLineWidth(0.8);
            doc.line(75, yPosition + 2, 135, yPosition + 2);

            yPosition += 15;

            const tableData = allSystemsData.map(system => [
                system['Site Name'],
                system['Site Code'],
                system['System Name'],
                system['Status'],
                system['Install Date'],
                system['Warranty Until'],
                system['AMC Until']
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Site Name', 'Site Code', 'System', 'Status', 'Install Date', 'Warranty Until', 'AMC Until']],
                body: tableData,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.2,
                    font: 'helvetica',
                    textColor: [31, 41, 55]
                },
                headStyles: {
                    fillColor: [229, 9, 20],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [255, 245, 245]
                },
                margin: { left: 15, right: 15 },
                tableWidth: 180
            });
        }

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(122, 12, 12); // dark maroon
            doc.setFont('helvetica', 'normal');

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(15, pageHeight - 25, 195, pageHeight - 25);

            doc.text(`Page ${i} of ${pageCount}`, 195, pageHeight - 15, { align: 'right' });
            doc.text(`Confidential - © ${new Date().getFullYear()} Krisha Fire and Security`, 15, pageHeight - 15);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
        }

        if (previewMode) {
            // Generate PDF for preview
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
        } else {
            // Download the PDF
            doc.save(`Krisha_Sites_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    };

    // Generate Excel report for all selected sites
    const generateExcel = () => {
        const data = prepareData();
        if (!data) {
            alert('Please select at least one site first');
            return;
        }

        const { allSitesData, allSystemsData } = data;

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Add site information sheet
        const siteInfoData = allSitesData.map(siteData => siteData.siteInfo);
        const siteInfoWS = XLSX.utils.json_to_sheet(siteInfoData);
        XLSX.utils.book_append_sheet(wb, siteInfoWS, 'Sites Information');

        // Add systems sheet if data exists
        if (allSystemsData.length > 0) {
            const systemsWS = XLSX.utils.json_to_sheet(allSystemsData);
            XLSX.utils.book_append_sheet(wb, systemsWS, 'All Systems');
        }

        // Generate Excel file and download
        XLSX.writeFile(wb, `Krisha_Sites_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Close PDF preview
    const closePreview = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
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
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Site Reports</h1>
                            <p className="text-gray-600">Generate and download detailed site reports in PDF and Excel formats</p>
                        </div>

                        {/* Report Configuration Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Configuration</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Site Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Sites *
                                    </label>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={toggleDropdown}
                                            className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex justify-between items-center"
                                        >
                                            <span>
                                                {selectedSites.length === 0
                                                    ? 'Select sites'
                                                    : selectedSites.length === sites.length
                                                        ? 'All Sites Selected'
                                                        : `${selectedSites.length} site(s) selected`
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
                                                        onClick={selectAllSites}
                                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                                    >
                                                        Select All Sites
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={clearAllSites}
                                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {sites.map(site => (
                                                        <label key={site._id} className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSites.includes(site._id)}
                                                                onChange={() => toggleSiteSelection(site._id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">
                                                                {site.site_name} ({site.site_code})
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="mt-2 text-sm text-gray-500">
                                        {selectedSites.length} site(s) selected
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
                                        <option value="systems">Systems Only</option>
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
                                                checked={includeSystems}
                                                onChange={(e) => setIncludeSystems(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Include Systems Information</span>
                                        </label>
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
                                                checked={includeRemarks}
                                                onChange={(e) => setIncludeRemarks(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Include Remarks</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                                <button
                                    onClick={() => generatePDF(true)}
                                    disabled={selectedSites.length === 0 || loading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview PDF
                                </button>
                                <button
                                    onClick={() => generatePDF(false)}
                                    disabled={selectedSites.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download PDF
                                </button>
                                <button
                                    onClick={generateExcel}
                                    disabled={selectedSites.length === 0}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download Excel
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-blue-800 mb-3">How to generate reports</h3>
                            <ol className="list-decimal list-inside space-y-2 text-blue-700">
                                <li>Click on the dropdown to select one or more sites</li>
                                <li>Use "Select All Sites" to choose all sites at once</li>
                                <li>Choose the report type and date range if needed</li>
                                <li>Customize the content using the checkboxes</li>
                                <li>Click "Preview PDF" to see your report</li>
                                <li>Download in PDF or Excel format using the respective buttons</li>
                            </ol>
                        </div>
                    </div>
                </main>
            </div>

            {/* PDF Preview Modal */}
            {pdfUrl && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full h-full max-w-6xl flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">PDF Preview</h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => generatePDF(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full"
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteReports;