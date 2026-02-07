import React, { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import logoPng from '../assets/logo.png';
import {
  Search,
  Edit,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { AuthContext } from "../Context/AuthContext";

const ManageQuotation = () => {
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
      if (!hasPermission("Manage Quotation")) {
        return navigate("/UserUnAuthorized/Manage Quotation");
      }
    }
  }, [permissionsLoaded, hasPermission, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchParams, setSearchParams] = useState({
    quotationNo: "",
    company: "",
    customer: "",
    fromDate: "",
    toDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentQuotation, setCurrentQuotation] = useState(null);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch all quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/quotation`);
      setQuotations(response.data.data);
      setFilteredQuotations(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setError("Failed to fetch quotations. Please try again later.");
      toast.error("Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filtered = quotations.filter(quotation => {
      const matchesQuotationNo = searchParams.quotationNo
        ? quotation._id.toLowerCase().includes(searchParams.quotationNo.toLowerCase())
        : true;

      const matchesCompany = searchParams.company
        ? (quotation.company_id?.name || '').toLowerCase().includes(searchParams.company.toLowerCase())
        : true;

      const matchesCustomer = searchParams.customer
        ? (quotation.customer_id?.name || '').toLowerCase().includes(searchParams.customer.toLowerCase())
        : true;

      const matchesFromDate = searchParams.fromDate
        ? new Date(quotation.createdAt) >= new Date(searchParams.fromDate)
        : true;

      const matchesToDate = searchParams.toDate
        ? new Date(quotation.createdAt) <= new Date(searchParams.toDate)
        : true;

      return (
        matchesQuotationNo &&
        matchesCompany &&
        matchesCustomer &&
        matchesFromDate &&
        matchesToDate
      );
    });

    setFilteredQuotations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [quotations, searchParams]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setSearchParams({
      quotationNo: "",
      company: "",
      customer: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedQuotations = [...filteredQuotations].sort((a, b) => {
      // Handle nested properties
      const getValue = (obj, key) => {
        return key.split('.').reduce((o, k) => (o || {})[k], obj);
      };

      const aValue = key.includes('.') ? getValue(a, key) : a[key];
      const bValue = key.includes('.') ? getValue(b, key) : b[key];

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredQuotations(sortedQuotations);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/quotation/${id}`);
        toast.success("Quotation deleted successfully");
        await fetchQuotations(); // Refresh the list
      } catch (err) {
        console.error("Error deleting quotation:", err);
        toast.error(err.response?.data?.message || "Failed to delete quotation");
      }
    }
  };

  // Calculate totals for a quotation (same logic as AddQuotation page)
  const calculateQuotationTotals = (quotation) => {
    let subtotal = 0;
    let totalGst = 0;
    let installationSubtotal = 0;
    let installationGst = 0;

    quotation.product_details?.forEach(product => {
      // Product calculations
      const productTotal = (parseFloat(product.quantity) || 0) * (parseFloat(product.price) || 0);
      subtotal += productTotal;
      totalGst += productTotal * ((parseFloat(product.gst_percent) || 0) / 100);

      // Installation calculations
      const installationTotal = (parseFloat(product.quantity) || 0) * (parseFloat(product.installation_price) || 0);
      installationSubtotal += installationTotal;
      installationGst += installationTotal * ((parseFloat(product.installation_gst_percent) || 0) / 100);
    });

    const grossTotal = subtotal + totalGst + installationSubtotal + installationGst;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalGst: parseFloat(totalGst.toFixed(2)),
      installationSubtotal: parseFloat(installationSubtotal.toFixed(2)),
      installationGst: parseFloat(installationGst.toFixed(2)),
      grossTotal: parseFloat(grossTotal.toFixed(2))
    };
  };

  const generatePdf = async (quotation) => {
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const fontkit = (await import("@pdf-lib/fontkit")).default;

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const [fontRegular, fontBold, logoImage] = await Promise.all([
        loadFont(pdfDoc, "/fonts/NotoSans-Regular.ttf"),
        loadFont(pdfDoc, "/fonts/NotoSans-Bold.ttf"),
        loadImage(pdfDoc, logoPng)
      ]);

      // Page management
      let currentPage = pdfDoc.addPage([595, 842]);
      let pages = [currentPage];
      let currentPageIndex = 0;

      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 50;
      const fontSize = 10;
      const lineHeight = 15;
      const footerHeight = 60;
      const maxContentHeight = pageHeight - footerHeight;

      const colors = {
        primary: rgb(0.1, 0.1, 0.6),
        secondary: rgb(0.2, 0.2, 0.6),
        text: rgb(0, 0, 0),
        lightBg: rgb(0.95, 0.95, 0.98),
        footerText: rgb(0.5, 0.5, 0.5)
      };

      const totals = calculateQuotationTotals(quotation);

      // Helper function to add new page
      const addNewPage = () => {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        pages.push(currentPage);
        currentPageIndex++;
        return margin; // Return starting Y position for new page
      };

      // Helper function to check if we need a new page
      const checkPageOverflow = (currentY, requiredSpace = 50) => {
        if (currentY + requiredSpace > maxContentHeight) {
          return addNewPage();
        }
        return currentY;
      };

      const drawText = (text, x, y, options = {}) => {
        const maxWidth = options.maxWidth || pageWidth - x - margin;
        const size = options.size || fontSize;
        const font = options.font || fontRegular;
        const color = options.color || colors.text;
        const lh = options.lineHeight || lineHeight;

        const words = text ? text.split(" ") : [];
        let line = "";
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          if (font.widthOfTextAtSize(testLine, size) > maxWidth && i > 0) {
            currentY = checkPageOverflow(currentY, lh);
            currentPage.drawText(line, { x, y: pageHeight - currentY, size, font, color });
            currentY += lh;
            line = words[i] + " ";
          } else {
            line = testLine;
          }
        }

        if (line) {
          currentY = checkPageOverflow(currentY, lh);
          currentPage.drawText(line, { x, y: pageHeight - currentY, size, font, color });
          currentY += lh;
        }

        return currentY;
      };

      /* ---------- HEADER ---------- */
      let currentY = drawHeader();

      /* ---------- QUOTATION INFO ---------- */
      currentY = drawQuotationInfo(currentY);

      /* ---------- CUSTOMER SECTION ---------- */
      currentY = drawCustomerSection(currentY);

      /* ---------- PRODUCTS ---------- */
      currentY = drawProductsTable(currentY);

      /* ---------- SUMMARY ---------- */
      currentY = drawSummary(totals, currentY + 30);

      /* ---------- TERMS ---------- */
      drawTermsAndFooter(currentY + 40);

      // Add page numbers to all pages
      pages.forEach((page, index) => {
        page.drawText(
          `Page ${index + 1} of ${pages.length}`,
          {
            x: pageWidth / 2 - 30,
            y: 30,
            size: 8,
            font: fontRegular,
            color: colors.footerText
          }
        );
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: "application/pdf" });

      /* ================= FUNCTIONS ================= */

      function drawHeader() {
        currentPage.drawImage(logoImage, {
          x: pageWidth - 200,
          y: pageHeight - 85,
          width: 150,
          height: 60
        });

        let y = margin;

        currentPage.drawText(quotation.company_id?.company_name || "", {
          x: margin,
          y: pageHeight - y,
          size: 20,
          font: fontBold,
          color: colors.primary
        });

        y += 20;
        currentPage.drawText("Sun Gravitas, 1110, Char Rasta,", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        y += 15;
        currentPage.drawText("near Jivraj Park Bridge, Rajmani Society,", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        y += 15;
        currentPage.drawText("Satellite, Shyamal, Ahmedabad, Gujarat 380015", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        y += 15;
        currentPage.drawText("Phone: 90999 26117", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        y += 20;
        currentPage.drawLine({
          start: { x: margin, y: pageHeight - y },
          end: { x: pageWidth - margin, y: pageHeight - y },
          thickness: 2,
          color: colors.secondary
        });

        return y + 15;
      }

      function drawQuotationInfo(startY) {
        let y = startY;
        y = checkPageOverflow(y, 40);

        currentPage.drawText(`Quotation No: ${quotation.quotation_id || "N/A"}`, {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        y += 15;
        currentPage.drawText(`Date: ${formatDate(quotation.createdAt)}`, {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        return y + 20;
      }

      function drawCustomerSection(startY) {
        let y = startY;
        y = checkPageOverflow(y, 100);

        currentPage.drawText("Customer :", {
          x: margin,
          y: pageHeight - y,
          size: 12,
          font: fontBold,
          color: colors.text
        });

        y += 15;
        currentPage.drawText(quotation.customer_id?.customer_name || "Customer Name", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        const address = [
          quotation.customer_id?.address?.line1,
          quotation.customer_id?.address?.line2,
          `${quotation.customer_id?.address?.city || ""}, ${quotation.customer_id?.address?.state || ""}`
        ].filter(Boolean).join(", ");

        y += 15;
        y = drawText(address, margin, y);

        y += 5;
        currentPage.drawText(`Phone: ${quotation.customer_id?.mobile_no || "N/A"}`, {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        y += 15;
        currentPage.drawText(`Email: ${quotation.customer_id?.email || "N/A"}`, {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        return y + 25;
      }

      function drawProductsTable(startY) {
        let y = startY;
        y = checkPageOverflow(y, 50);

        const colWidths = {
          sno: 30,
          desc: 220,
          qty: 50,
          price: 70,
          inst: 80,
          total: 80
        };

        const colX = {
          sno: margin,
          desc: margin + colWidths.sno,
          qty: margin + colWidths.sno + colWidths.desc,
          price: margin + colWidths.sno + colWidths.desc + colWidths.qty,
          inst: margin + colWidths.sno + colWidths.desc + colWidths.qty + colWidths.price,
          total: margin + colWidths.sno + colWidths.desc + colWidths.qty + colWidths.price + colWidths.inst
        };

        const drawTableHeader = (yPos) => {
          currentPage.drawRectangle({
            x: margin - 5,
            y: pageHeight - yPos - 10,
            width: pageWidth - margin * 2 + 10,
            height: 20,
            color: colors.secondary
          });

          const headers = ["#", "Product", "Qty", "Unit Price", "Installation", "Total"];
          headers.forEach((h, i) => {
            currentPage.drawText(h, {
              x: Object.values(colX)[i],
              y: pageHeight - yPos - 2,
              size: 11,
              font: fontBold,
              color: rgb(1, 1, 1)
            });
          });

          return yPos + 25;
        };

        y = drawTableHeader(y);

        quotation.product_details?.forEach((product, index) => {
          // Check if we need a new page for this product row
          const estimatedRowHeight = 25;
          if (y + estimatedRowHeight > maxContentHeight) {
            y = addNewPage();
            y = drawTableHeader(y);
          }

          const unitPrice = product.price
            ? parseFloat(product.price).toFixed(2)
            : "0.00";

          const instPrice = product.installation_price
            ? parseFloat(product.installation_price * product.quantity).toFixed(2)
            : "0.00";

          const total = product.total_amount
            ? parseFloat(product.total_amount + product.installation_price * product.quantity).toFixed(2)
            : "0.00";

          if (index % 2 === 0) {
            currentPage.drawRectangle({
              x: margin - 5,
              y: pageHeight - y - 10,
              width: pageWidth - margin * 2 + 10,
              height: 20,
              color: colors.lightBg
            });
          }

          currentPage.drawText(`${index + 1}`, {
            x: colX.sno,
            y: pageHeight - y,
            size: fontSize,
            font: fontRegular,
            color: colors.text
          });

          const productName = product.product_id?.product_name || "Product";
          const maxProductNameWidth = colWidths.desc - 10;
          const nameLines = [];
          let currentLine = "";

          productName.split(" ").forEach(word => {
            const testLine = currentLine + word + " ";
            if (fontRegular.widthOfTextAtSize(testLine, fontSize) > maxProductNameWidth) {
              if (currentLine) nameLines.push(currentLine.trim());
              currentLine = word + " ";
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) nameLines.push(currentLine.trim());

          nameLines.forEach((line, lineIndex) => {
            currentPage.drawText(line, {
              x: colX.desc,
              y: pageHeight - y - (lineIndex * 12),
              size: fontSize,
              font: fontRegular,
              color: colors.text
            });
          });

          currentPage.drawText(String(product.quantity || 0), {
            x: colX.qty,
            y: pageHeight - y,
            size: fontSize,
            font: fontRegular,
            color: colors.text
          });

          currentPage.drawText(`₹${unitPrice}`, {
            x: colX.price,
            y: pageHeight - y,
            size: fontSize,
            font: fontRegular,
            color: colors.text
          });

          currentPage.drawText(`₹${instPrice}`, {
            x: colX.inst,
            y: pageHeight - y,
            size: fontSize,
            font: fontRegular,
            color: colors.text
          });

          currentPage.drawText(`₹${total}`, {
            x: colX.total,
            y: pageHeight - y,
            size: fontSize,
            font: fontRegular,
            color: colors.text
          });

          y += Math.max(20, nameLines.length * 12);
        });

        return y;
      }

      function drawSummary(totals, startY) {
        let y = startY;
        y = checkPageOverflow(y, 120);

        currentPage.drawText("Subtotal:", {
          x: pageWidth - 320,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        currentPage.drawText(`₹${totals.subtotal.toFixed(2)}`, {
          x: pageWidth - 245,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        currentPage.drawText(`₹${totals.installationSubtotal.toFixed(2)}`, {
          x: pageWidth - 175,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        currentPage.drawText(`₹${(totals.subtotal + totals.installationSubtotal).toFixed(2)}`, {
          x: pageWidth - 95,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        y += 20;
        currentPage.drawText("GST Amount:", {
          x: pageWidth - 320,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        currentPage.drawText(`₹${totals.totalGst.toFixed(2)}`, {
          x: pageWidth - 245,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        currentPage.drawText(`₹${totals.installationGst.toFixed(2)}`, {
          x: pageWidth - 175,
          y: pageHeight - y,
          size: fontSize,
          font: fontRegular,
          color: colors.text
        });

        currentPage.drawText(`₹${(totals.totalGst + totals.installationGst).toFixed(2)}`, {
          x: pageWidth - 95,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        y += 20;
        currentPage.drawLine({
          start: { x: pageWidth - 240, y: pageHeight - y },
          end: { x: pageWidth - 40, y: pageHeight - y },
          thickness: 1,
          color: colors.secondary
        });

        y += 20;
        currentPage.drawText("Gross Total:", {
          x: pageWidth - 200,
          y: pageHeight - y,
          size: 12,
          font: fontBold,
          color: colors.text
        });

        currentPage.drawText(`₹${totals.grossTotal.toFixed(2)}`, {
          x: pageWidth - 95,
          y: pageHeight - y,
          size: 12,
          font: fontBold,
          color: colors.text
        });

        return y + 20;
      }

      function drawTermsAndFooter(startY) {
        let y = startY;
        y = checkPageOverflow(y, 80);

        currentPage.drawText("Terms & Conditions:", {
          x: margin,
          y: pageHeight - y,
          size: fontSize,
          font: fontBold,
          color: colors.text
        });

        y += 20;
        const terms = quotation.terms_and_conditions ||
          "1. Payment within 15 days\n2. Late fee 2% per month\n3. Goods remain property until paid";

        y = drawText(terms, margin, y, {
          maxWidth: pageWidth - margin * 2,
          lineHeight: 14
        });

        // Footer on last page
        currentPage.drawText("Thank you for your business!", {
          x: margin,
          y: 50,
          size: 12,
          font: fontRegular,
          color: colors.footerText
        });

        currentPage.drawText(`Generated on ${formatDate(new Date())}`, {
          x: pageWidth - 150,
          y: 50,
          size: 10,
          font: fontRegular,
          color: colors.footerText
        });
      }

    } catch (err) {
      console.error("Error generating PDF:", err);
      throw new Error("Failed to generate PDF document");
    }
  };

  // Helper functions
  async function loadFont(pdfDoc, fontPath) {
    const fontBytes = await fetch(fontPath).then(res => res.arrayBuffer());
    return pdfDoc.embedFont(fontBytes);
  }

  async function loadImage(pdfDoc, imagePath) {
    const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
    return pdfDoc.embedPng(imageBytes);
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const handlePreviewPdf = async (quotation) => {
    try {
      setLoading(true);
      setCurrentQuotation(quotation);
      const blob = await generatePdf(quotation);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfPreviewOpen(true);
    } catch (err) {
      toast.error("Failed to generate PDF preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (quotation) => {
    try {
      setLoading(true);
      const blob = await generatePdf(quotation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.quotation_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  const toggleFilters = () => setExpandedFilters(!expandedFilters);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  const customStyles = {
    content: {
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      margin: '0',
      padding: '0',
      border: 'none',
      borderRadius: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Quotations</h1>
                <p className="text-xs sm:text-sm text-gray-500">View and manage all quotations</p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to="/add-quotation"
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  <Plus size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create Quotation</span>
                  <span className="sm:hidden">New</span>
                </Link>
                <button
                  onClick={toggleFilters}
                  className="flex items-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  <Filter size={14} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Search Filters */}
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden transition-all duration-300 ${expandedFilters ? "max-h-[500px]" : "max-h-[60px]"}`}>
              <button
                type="button"
                onClick={toggleFilters}
                className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center">
                  <Search className="text-red-600 mr-3" size={18} />
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                    Search Filters
                  </h2>
                </div>
                {expandedFilters ? (
                  <ChevronUp size={18} className="text-gray-500" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500" />
                )}
              </button>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quotation ID</label>
                  <input
                    type="text"
                    name="quotationNo"
                    value={searchParams.quotationNo}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Search by quotation ID"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={searchParams.company}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Search by company"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <input
                    type="text"
                    name="customer"
                    value={searchParams.customer}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Search by customer"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    name="fromDate"
                    value={searchParams.fromDate}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    name="toDate"
                    value={searchParams.toDate}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Loading and Error States */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            {!loading && (
              <div className="mb-4 text-xs sm:text-sm text-gray-600">
                Showing {filteredQuotations.length} results
              </div>
            )}

            {/* Quotations Table - Desktop View */}
            {!loading && !error && !mobileView && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('_id')}
                      >
                        <div className="flex items-center">
                          Quotation ID
                          {sortConfig.key === '_id' && (
                            <span className="ml-1">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('company_id.name')}
                      >
                        <div className="flex items-center">
                          Company
                          {sortConfig.key === 'company_id.name' && (
                            <span className="ml-1">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('customer_id.name')}
                      >
                        <div className="flex items-center">
                          Customer
                          {sortConfig.key === 'customer_id.name' && (
                            <span className="ml-1">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                          {sortConfig.key === 'createdAt' && (
                            <span className="ml-1">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((quotation) => {
                        const totals = calculateQuotationTotals(quotation);
                        return (
                          <tr key={quotation._id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {quotation.quotation_id}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {quotation.company_id?.company_name || 'N/A'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {quotation.customer_id?.customer_name || 'N/A'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {new Date(quotation.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                              {quotation.product_details.length} items
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              ₹{totals.grossTotal.toLocaleString()}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {quotation.sales_enquiry_id?.status || 'N/A'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handlePreviewPdf(quotation)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Preview"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(quotation)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Download"
                                >
                                  <Download size={16} />
                                </button>
                                <Link
                                  to={`/edit-quotation/${quotation._id}`}
                                  className="text-red-600 hover:text-red-900"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </Link>
                                <button
                                  onClick={() => handleDelete(quotation._id)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                          No quotations found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quotations Cards - Mobile View */}
            {!loading && !error && mobileView && (
              <div className="space-y-4">
                {currentItems.length > 0 ? (
                  currentItems.map((quotation) => {
                    const totals = calculateQuotationTotals(quotation);
                    return (
                      <div key={quotation._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">{quotation.quotation_id}</h3>
                            <p className="text-xs text-gray-600 mt-2">{quotation.company_id?.company_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                              {quotation.sales_enquiry_id?.status || 'N/A'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreviewPdf(quotation)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(quotation)}
                              className="text-green-600 hover:text-green-900"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <Link
                              to={`/edit-quotation/${quotation._id}`}
                              className="text-red-600 hover:text-red-900"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(quotation._id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Customer</p>
                            <p className="text-gray-800">{quotation.customer_id?.customer_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="text-gray-800">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Products</p>
                            <p className="text-gray-800">{quotation.product_details.length} items</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="text-gray-800">
                              ₹{totals.grossTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center text-sm text-gray-500">
                    No quotations found matching your criteria
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filteredQuotations.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
                <div className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-0">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredQuotations.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredQuotations.length}</span> results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === pageNum ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">...</span>
                  )}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={pdfPreviewOpen}
        onRequestClose={() => setPdfPreviewOpen(false)}
        style={customStyles}
        contentLabel="PDF Preview"
        ariaHideApp={false}
      >
        <div className="h-full flex flex-col bg-white">
          <div className="flex justify-between items-center p-3 border-b bg-gray-800 text-white">
            <h2 className="text-sm md:text-lg font-semibold truncate max-w-[50%]">
              Quotation: {currentQuotation?.quotation_id}
            </h2>
            <div className="flex space-x-1">
              <button
                onClick={() => currentQuotation && handleDownloadPdf(currentQuotation)}
                className="flex items-center px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs md:text-sm transition"
                title="Download"
              >
                <Download size={14} className="md:mr-1" />
                <span className="hidden md:inline">Download</span>
              </button>
              <button
                onClick={() => setPdfPreviewOpen(false)}
                className="flex items-center px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs md:text-sm transition"
                title="Close"
              >
                <X size={14} className="md:mr-1" />
                <span className="hidden md:inline">Close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
                style={{ minHeight: 'calc(100vh - 50px)' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageQuotation;