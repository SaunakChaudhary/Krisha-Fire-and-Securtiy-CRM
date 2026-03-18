import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const SiteDocuments = () => {
  const { siteId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [permissions, setPermissions] = useState(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [documents, setDocuments] = useState([]);

  const [newFolderName, setNewFolderName] = useState("");
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [loading, setLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------------- PERMISSIONS ---------------- */

  const getAccessTypeId = () => {
    if (!user) return null;
    if (user.user?.accesstype_id) return user.user.accesstype_id;
    if (user.accesstype_id?._id) return user.accesstype_id._id;
    if (typeof user.accesstype_id === "string") return user.accesstype_id;
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
    } finally {
      setPermissionsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) fetchPermissions();
  }, [user]);
  
  useEffect(() => {
    if (permissionsLoaded && !permissions?.permissions?.["Manage Site"]) {
      navigate("/UserUnAuthorized/Manage Site");
    }
  }, [permissionsLoaded]);


  /* ---------------- FOLDER LOGIC ---------------- */

  const fetchFolders = async (parentId = null) => {
    try {
      const res = await fetch(
        `${API}/site-document/sites/${siteId}/folders?parent=${parentId || ""
        }`
      );
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFolders(currentFolder?._id || null);
  }, [currentFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return alert("Enter folder name");

    try {
      const res = await fetch(
        `${API}/site-document/sites/${siteId}/folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder_name: newFolderName,
            parent_folder: currentFolder?._id || null,
          }),
        }
      );

      if (!res.ok) throw new Error();

      setNewFolderName("");
      fetchFolders(currentFolder?._id || null);
    } catch {
      alert("Folder creation failed");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Delete this folder?")) return;

    try {
      const res = await fetch(
        `${API}/site-document/sites/${siteId}/folders/${folderId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }

      fetchFolders(currentFolder?._id || null);
    } catch {
      alert("Delete failed");
    }
  };

  const handleRenameFolder = async (folder) => {
    const newName = prompt("Enter new folder name", folder.folder_name);
    if (!newName || newName === folder.folder_name) return;

    try {
      const res = await fetch(
        `${API}/site-document/sites/${siteId}/folders/${folder._id}`,
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

      fetchFolders(currentFolder?._id || null);

      if (currentFolder?._id === folder._id) {
        setCurrentFolder({ ...folder, folder_name: newName });
      }
    } catch {
      alert("Rename failed");
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
        `${API}/site-document/sites/${siteId}/documents?folderId=${currentFolder._id}`
      );
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentFolder]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!currentFolder) return alert("Select folder first");
    if (!file) return alert("Select file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_name", documentName);
    formData.append("folder_id", currentFolder._id);

    try {
      setLoading(true);

      const res = await fetch(
        `${API}/site-document/sites/${siteId}/documents`,
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

  const handleDeleteDocument = async (id) => {
    if (!window.confirm("Delete document?")) return;

    try {
      const res = await fetch(
        `${API}/site-document/documents/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error();

      fetchDocuments();
    } catch {
      alert("Delete failed");
    }
  };

  const createSubFolder = async () => {
    const name = prompt("Enter folder name");
    if (!name) return;

    try {
      const res = await fetch(
        `${API}/site-document/sites/${siteId}/folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder_name: name,
            parent_folder: currentFolder?._id || null,
          }),
        }
      );

      if (!res.ok) throw new Error();

      fetchFolders(currentFolder?._id || null);
    } catch {
      alert("Folder creation failed");
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
            Site Cabinet
          </h1>

          {/* -------- Breadcrumb -------- */}
          <div className="flex justify-between mb-4 text-sm text-gray-600">
            <div>
              <span
                className="cursor-pointer text-blue-600"
                onClick={() => {
                  setBreadcrumb([]);
                  setCurrentFolder(null);
                }}
              >
                Root
              </span>

              {breadcrumb.map((folder, index) => (
                <span key={folder._id}>
                  {" / "}
                  <span
                    className="cursor-pointer text-blue-600"
                    onClick={() => {
                      const updated = breadcrumb.slice(0, index + 1);
                      setBreadcrumb(updated);
                      setCurrentFolder(folder);
                    }}
                  >
                    {folder.folder_name}
                  </span>
                </span>
              ))}
            </div>
            <div>
              <button
                type="button"
                onClick={createSubFolder}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                + Folder
              </button>
            </div>
          </div>

          {/* -------- Folder Grid -------- */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {currentFolder
                ? `Subfolders inside "${currentFolder.folder_name}"`
                : "Folders"}
            </h2>

            <div className="grid grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder._id}
                  className="p-4 border rounded hover:bg-gray-100 relative group"
                >
                  <div
                    onClick={() => {
                      setBreadcrumb([...breadcrumb, folder]);
                      setCurrentFolder(folder);
                    }}
                    className="cursor-pointer"
                  >
                    📁 {folder.folder_name}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleRenameFolder(folder)}
                      className="text-blue-500"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder._id)}
                      className="text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* -------- Documents Section -------- */}
          {currentFolder && (
            <>
              <div className="bg-white p-6 rounded shadow mb-6">
                <form onSubmit={handleUpload} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Document name"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    {loading ? "Uploading..." : "Upload Document"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded shadow">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Size</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-gray-500">
                          No documents in this folder
                        </td>
                      </tr>
                    )}

                    {documents.map((doc) => (
                      <tr key={doc._id}>
                        <td className="px-4 py-2">{doc.document_name}</td>
                        <td className="px-4 py-2">{doc.file_type}</td>
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
                            onClick={() => handleDeleteDocument(doc._id)}
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

export default SiteDocuments;