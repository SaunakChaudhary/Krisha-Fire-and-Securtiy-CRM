import React, { useContext, useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

const CustomerDocuments = () => {

    const { customerId } = useParams();
    const { user } = useContext(AuthContext);

    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [file, setFile] = useState(null);
    const [documentName, setDocumentName] = useState("");
    const [loading, setLoading] = useState(false);

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
            if (!hasPermission("Manage Customer")) {
                return navigate("/UserUnAuthorized/Manage Customer");
            }
        }
    }, [permissionsLoaded, hasPermission, navigate]);


    const [sidebarOpen, setSidebarOpen] = useState(false);
    const API = import.meta.env.VITE_API_URL;

    // 🔹 Fetch documents
    const fetchDocuments = async () => {
        try {
            const res = await fetch(`${API}/customer-document/customers/${customerId}/documents`);
            const data = await res.json();
            setDocuments(data);
        } catch (err) {
            console.error("Failed to fetch documents", err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [customerId]);

    // 🔹 Upload document
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_name", documentName);

        try {
            setLoading(true);
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/documents`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                throw new Error("Upload failed");
            }

            setFile(null);
            setDocumentName("");
            fetchDocuments();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Delete document
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this document?")) return;

        try {
            const res = await fetch(`${API}/customer-document/documents/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Delete failed");
            }

            fetchDocuments();
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex">
                <Sidebar
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(false)}
                />

                <main className="flex-1 mt-20 sm:mt-24 lg:ml-64 p-4">
                    <h1 className="text-2xl font-semibold mb-6">
                        Customer Cabinet
                    </h1>

                    {/* Upload Box */}
                    <div className="bg-white p-6 rounded shadow mb-6">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Document name (optional)"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />

                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {loading ? "Uploading..." : "Upload Document"}
                            </button>
                        </form>
                    </div>

                    {/* Documents Table */}
                    <div className="bg-white rounded shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">
                                        Size
                                    </th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">
                                            No documents uploaded
                                        </td>
                                    </tr>
                                )}

                                {documents.map((doc) => (
                                    <tr key={doc._id}>
                                        <td className="px-4 py-2">
                                            {doc.document_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {doc.file_type}
                                        </td>
                                        <td className="px-4 py-2">
                                            {(doc.file_size / 1024).toFixed(2)} KB
                                        </td>
                                        <td className="px-4 py-2 space-x-3">
                                            <a
                                                href={`${API.replace("/api", "")}/${doc.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Download
                                            </a>

                                            <button
                                                onClick={() => handleDelete(doc._id)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default CustomerDocuments