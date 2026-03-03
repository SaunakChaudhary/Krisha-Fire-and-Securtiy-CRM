import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const CustomerDocuments = () => {
    const { customerId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL;

    const [permissions, setPermissions] = useState(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);

    const [documents, setDocuments] = useState([]);

    const [newFolderName, setNewFolderName] = useState("");

    const [file, setFile] = useState(null);
    const [documentName, setDocumentName] = useState("");
    const [loading, setLoading] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    /* ---------------- PERMISSIONS ---------------- */

    const getAccessTypeId = () => {
        if (!user) return null;

        if (user.user && user.user.accesstype_id)
            return user.user.accesstype_id;

        if (user.accesstype_id && user.accesstype_id._id)
            return user.accesstype_id._id;

        if (typeof user.accesstype_id === "string")
            return user.accesstype_id;

        return null;
    };

    const fetchPermissions = async () => {
        const accessTypeId = getAccessTypeId();
        if (!accessTypeId) return;

        try {
            const res = await fetch(`${API}/permissions/${accessTypeId}`);
            if (res.ok) {
                const data = await res.json();
                setPermissions(data);
            }
            setPermissionsLoaded(true);
        } catch {
            setPermissionsLoaded(true);
        }
    };

    useEffect(() => {
        if (user) fetchPermissions();
    }, [user]);

    const hasPermission = (moduleName) =>
        permissions?.permissions?.[moduleName] === true;

    useEffect(() => {
        if (permissionsLoaded && !hasPermission("Manage Customer")) {
            navigate("/UserUnAuthorized/Manage Customer");
        }
    }, [permissionsLoaded]);

    /* ---------------- FOLDER LOGIC ---------------- */

    const fetchFolders = async () => {
        try {
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/folders`
            );
            const data = await res.json();
            setFolders(data);
        } catch (err) {
            console.error("Folder fetch error:", err);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, [customerId]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            alert("Enter folder name");
            return;
        }

        try {
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/folders`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder_name: newFolderName }),
                }
            );

            if (!res.ok) throw new Error();

            setNewFolderName("");
            fetchFolders();
        } catch {
            alert("Folder creation failed");
        }
    };

    /* ---------------- DOCUMENT LOGIC ---------------- */

    const fetchDocuments = async () => {
        if (!currentFolder) {
            setDocuments([]);
            return;
        }

        try {
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/documents?folder=${currentFolder}`
            );
            const data = await res.json();
            setDocuments(data);
        } catch (err) {
            console.error("Document fetch error:", err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [currentFolder]);

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!currentFolder) {
            alert("Select a folder first");
            return;
        }

        if (!file) {
            alert("Select a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_name", documentName);
        formData.append("folder_name", currentFolder);

        try {
            setLoading(true);

            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/documents`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) throw new Error();

            setFile(null);
            setDocumentName("");
            fetchDocuments();
        } catch {
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteFolder = async (folderId) => {
        if (!window.confirm("Delete this folder?")) return;

        try {
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/folders/${folderId}`,
                { method: "DELETE" }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Delete failed");
                return;
            }

            fetchFolders();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this document?")) return;

        try {
            const res = await fetch(
                `${API}/customer-document/documents/${id}`,
                { method: "DELETE" }
            );

            if (!res.ok) throw new Error();

            fetchDocuments();
        } catch {
            alert("Delete failed");
        }
    };

    const handleRenameFolder = async (folder) => {
        const newName = prompt("Enter new folder name", folder.folder_name);

        if (!newName || newName === folder.folder_name) return;

        try {
            const res = await fetch(
                `${API}/customer-document/customers/${customerId}/folders/${folder._id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ new_name: newName }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Rename failed");
                return;
            }

            fetchFolders();

            // If current folder was renamed → update it
            if (currentFolder === folder.folder_name) {
                setCurrentFolder(newName);
            }

        } catch {
            alert("Rename failed");
        }
    };
    /* ---------------- UI ---------------- */

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

                    {/* ---------- FOLDER VIEW ---------- */}
                    {!currentFolder && (
                        <div className="bg-white p-6 rounded shadow mb-6">
                            <h2 className="text-lg font-semibold mb-4">Folders</h2>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="New folder name"
                                    className="border px-3 py-2 rounded w-full"
                                />
                                <button
                                    onClick={handleCreateFolder}
                                    className="bg-green-600 text-white px-4 rounded"
                                >
                                    Create
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {folders.map((folder) => (
                                    <div
                                        key={folder._id}
                                        className="p-4 border rounded hover:bg-gray-100 relative group"
                                    >
                                        {/* Folder Click */}
                                        <div
                                            onClick={() => setCurrentFolder(folder.folder_name)}
                                            className="cursor-pointer"
                                        >
                                            📁 {folder.folder_name}
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">

                                            <button
                                                onClick={() => handleRenameFolder(folder)}
                                                className="cursor-pointer text-blue-500"
                                            >
                                                ✎
                                            </button>

                                            <button
                                                onClick={() => handleDeleteFolder(folder._id)}
                                                className="text-red-500 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ---------- DOCUMENT VIEW ---------- */}
                    {currentFolder && (
                        <>
                            <div className="mb-4 flex justify-between items-center">

                                <button
                                    onClick={() => setCurrentFolder(null)}
                                    className="font-bold cursor-pointer text-blue-600"
                                >
                                    ← Back
                                </button>
                                <div>
                                    📂 <strong>{currentFolder}</strong>
                                </div>
                            </div>

                            {/* Upload Box */}
                            <div className="bg-white p-6 rounded shadow mb-6">
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Document name (optional)"
                                        value={documentName}
                                        onChange={(e) =>
                                            setDocumentName(e.target.value)
                                        }
                                        className="w-full border rounded px-3 py-2"
                                    />

                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            setFile(e.target.files[0])
                                        }
                                        className="w-full"
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        {loading
                                            ? "Uploading..."
                                            : "Upload Document"}
                                    </button>
                                </form>
                            </div>

                            {/* Documents Table */}
                            <div className="bg-white rounded shadow">
                                <table className="min-w-full divide-y">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">
                                                Name
                                            </th>
                                            <th className="px-4 py-2 text-left">
                                                Type
                                            </th>
                                            <th className="px-4 py-2 text-left">
                                                Size
                                            </th>
                                            <th className="px-4 py-2 text-left">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {documents.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center py-4 text-gray-500"
                                                >
                                                    No documents in this folder
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
                                                        className="text-blue-600"
                                                    >
                                                        Download
                                                    </a>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(doc._id)
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CustomerDocuments;