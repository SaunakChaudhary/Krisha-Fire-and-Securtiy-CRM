import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ManageCabinet = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [editingFolder, setEditingFolder] = useState(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingFile, setViewingFile] = useState(null); // New state for viewing files
    const [fileContent, setFileContent] = useState(''); // New state for file content

    // Fetch data on component mount and when currentFolder changes
    useEffect(() => {
        fetchData();
    }, [currentFolder]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            if (currentFolder) {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/cabinet/folder/${currentFolder._id}?search=${searchQuery}`
                );
                if (!response.ok) throw new Error('Failed to fetch folder contents');

                const data = await response.json();
                setFolders(data.subfolders || []);
                setFiles(data.files || []);
            } else {
                // Fetch root items
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/cabinet?search=${searchQuery}`
                );
                if (!response.ok) throw new Error('Failed to fetch root items');

                const data = await response.json();
                setFolders(data.folders || []);
                setFiles(data.files || []);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // New function to open/view documents
    const openDocument = async (file) => {
        try {
            setError('');
            setViewingFile(file);
            
            // For image files, we can display them directly
            if (file.mimeType && file.mimeType.startsWith('image/')) {
                setFileContent('image');
                return;
            }
            
            // For other files, we need to fetch the content
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/file/${file._id}`, {
                method: 'GET',
            });

            if (!response.ok) {
                // If the endpoint doesn't exist, show a preview message
                if (response.status === 404) {
                    setFileContent('preview');
                    return;
                }
                throw new Error('Failed to fetch file content');
            }

            // Handle different file types
            if (file.mimeType) {
                if (file.mimeType.startsWith('text/') || file.mimeType === 'application/pdf') {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setFileContent(url);
                } else {
                    setFileContent('download');
                }
            } else {
                setFileContent('download');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error opening document:', err);
            setViewingFile(null);
        }
    };

    // New function to download files
    const downloadFile = async (file) => {
        try {
            setError('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/file/${file._id}/download`);
            
            if (!response.ok) throw new Error('Failed to download file');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err.message);
            console.error('Error downloading file:', err);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            setError('Folder name cannot be empty');
            return;
        }

        try {
            setError('');
            const requestBody = {
                name: newFolderName.trim(),
                parentId: currentFolder ? currentFolder._id : null
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/folder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to create folder';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    console.error('Could not parse error response:', parseError);
                }
                throw new Error(errorMessage);
            }

            setNewFolderName('');
            setShowCreateFolder(false);
            fetchData();
        } catch (err) {
            setError(err.message);
            console.error('Error creating folder:', err);
        }
    };
    const handleFileUpload = async (e) => {
        const uploadedFiles = Array.from(e.target.files);
        if (uploadedFiles.length === 0) return;

        try {
            setError('');
            const formData = new FormData();
            uploadedFiles.forEach(file => {
                formData.append('files', file);
            });

            if (currentFolder) {
                formData.append('folderId', currentFolder._id);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload files');

            fetchData(); // Refresh the data
            e.target.value = ''; // Clear the file input
        } catch (err) {
            setError(err.message);
            console.error('Error uploading files:', err);
        }
    };

    const toggleFileSelection = (fileId) => {
        if (selectedFiles.includes(fileId)) {
            setSelectedFiles(selectedFiles.filter(id => id !== fileId));
        } else {
            setSelectedFiles([...selectedFiles, fileId]);
        }
    };

    const deleteSelectedFiles = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setError('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/files`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileIds: selectedFiles }),
            });

            if (!response.ok) throw new Error('Failed to delete files');

            setSelectedFiles([]);
            fetchData(); // Refresh the data
        } catch (err) {
            setError(err.message);
            console.error('Error deleting files:', err);
        }
    };

    const openFolder = (folder) => {
        setCurrentFolder(folder);
        setSelectedFiles([]);
    };

    const navigateToRoot = () => {
        setCurrentFolder(null);
        setSelectedFiles([]);
    };

    const deleteFolder = async (folderId) => {
        if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) {
            return;
        }

        try {
            setError('');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/folder/${folderId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete folder');

            // If we're inside the folder being deleted, navigate back to root
            if (currentFolder && currentFolder._id === folderId) {
                setCurrentFolder(null);
            }
            fetchData(); // Refresh the data
        } catch (err) {
            setError(err.message);
            console.error('Error deleting folder:', err);
        }
    };

    const startEditFolder = (folder) => {
        setEditingFolder(folder);
        setEditFolderName(folder.name);
    };

    const saveEditFolder = async () => {
        if (editFolderName.trim() && editingFolder) {
            try {
                setError('');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cabinet/folder/${editingFolder._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: editFolderName }),
                });

                if (!response.ok) throw new Error('Failed to update folder');

                const updatedFolder = await response.json();

                // Update current folder if we're inside the edited folder
                if (currentFolder && currentFolder._id === editingFolder._id) {
                    setCurrentFolder(updatedFolder);
                }

                setEditingFolder(null);
                setEditFolderName('');
                fetchData(); // Refresh the data
            } catch (err) {
                setError(err.message);
                console.error('Error updating folder:', err);
            }
        }
    };

    const cancelEditFolder = () => {
        setEditingFolder(null);
        setEditFolderName('');
    };

    const getCurrentItems = () => {
        if (currentFolder) {
            return [...folders, ...files];
        } else {
            return [...folders, ...files];
        }
    };

    const currentItems = getCurrentItems().filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex">
                    <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                    <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading...</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Add this function to close the document viewer
    const closeDocumentViewer = () => {
        setViewingFile(null);
        setFileContent('');
    };


    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                    <div className="max-w-7xl mx-auto">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                                <button 
                                    className="ml-4 text-sm underline"
                                    onClick={() => setError('')}
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        <div className="flex items-center text-sm mb-6">
                            <span className="text-gray-600 cursor-pointer" onClick={navigateToRoot}>Home</span>
                            <span className="mx-2 text-gray-400">/</span>
                            {currentFolder ? (
                                <>
                                    <span
                                        className="text-gray-600 cursor-pointer"
                                        onClick={navigateToRoot}
                                    >
                                        Search Cabinet
                                    </span>
                                    <span className="mx-2 text-gray-400">/</span>
                                    <span className="text-gray-800 font-medium">{currentFolder.name}</span>
                                </>
                            ) : (
                                <span className="text-gray-800 font-medium">Search Cabinet</span>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-6">
                            {currentFolder ? `Folder: ${currentFolder.name}` : 'Manage Cabinet'}
                        </h1>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex flex-wrap gap-3">
                                {!currentFolder && (
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                        onClick={() => setShowCreateFolder(true)}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                        Create Folder
                                    </button>
                                )}

                                <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center cursor-pointer">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    Upload Documents
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        onChange={handleFileUpload}
                                    />
                                </label>

                                {selectedFiles.length > 0 && (
                                    <button
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                        onClick={deleteSelectedFiles}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Delete Selected
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                {currentFolder ? `Search in ${currentFolder.name}` : 'Search Cabinet'}
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            fetchData();
                                        }
                                    }}
                                />
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    onClick={fetchData}
                                >
                                    Search
                                </button>
                                <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>All Files</option>
                                    <option>Documents</option>
                                    <option>Images</option>
                                    <option>Videos</option>
                                </select>
                            </div>
                        </div>

                        {showCreateFolder && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Folder</h3>
                                    <input
                                        type="text"
                                        placeholder="Folder Name"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCreateFolder();
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                                            onClick={() => setShowCreateFolder(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            onClick={handleCreateFolder}
                                        >
                                            Create
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {editingFolder && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Folder</h3>
                                    <input
                                        type="text"
                                        placeholder="Folder Name"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                        value={editFolderName}
                                        onChange={(e) => setEditFolderName(e.target.value)}
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                saveEditFolder();
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                                            onClick={cancelEditFolder}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            onClick={saveEditFolder}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Modified
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Size
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    No items found
                                                </td>
                                            </tr>
                                        ) : (
                                            currentItems.map((item) => (
                                                <tr key={item._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.type === 'file' ? (
                                                            <div className="flex items-center">
                                                                <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                                </svg>
                                                                <span className="text-sm text-gray-500">File</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path>
                                                                </svg>
                                                                <span className="text-sm text-gray-500">Folder</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {item.type === 'file' && (
                                                                <input
                                                                    type="checkbox"
                                                                    className="mr-3 h-4 w-4 text-blue-600 rounded"
                                                                    checked={selectedFiles.includes(item._id)}
                                                                    onChange={() => toggleFileSelection(item._id)}
                                                                />
                                                            )}
                                                            {item.type === 'file' ? (
                                                                <button
                                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 text-left"
                                                                    onClick={() => openDocument(item)}
                                                                >
                                                                    {item.name}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 text-left"
                                                                    onClick={() => openFolder(item)}
                                                                >
                                                                    {item.name}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(item.modified)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.type === 'file' && item.size ? (
                                                            `${(item.size / 1024).toFixed(1)} KB`
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {item.type === 'file' ? (
                                                            <>
                                                                <button
                                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                                    onClick={() => openDocument(item)}
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                                    onClick={() => downloadFile(item)}
                                                                >
                                                                    Download
                                                                </button>
                                                                <button
                                                                    className="text-red-600 hover:text-red-900"
                                                                    onClick={() => {
                                                                        setSelectedFiles([item._id]);
                                                                        setTimeout(deleteSelectedFiles, 100);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                                    onClick={() => startEditFolder(item)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="text-red-600 hover:text-red-900"
                                                                    onClick={() => deleteFolder(item._id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Document Viewer Modal */}
                        {viewingFile && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                    <div className="flex justify-between items-center p-4 border-b">
                                        <h3 className="text-lg font-semibold text-gray-800">{viewingFile.name}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-green-600 hover:text-green-800"
                                                onClick={() => downloadFile(viewingFile)}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                            <button
                                                className="text-gray-600 hover:text-gray-800"
                                                onClick={closeDocumentViewer}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                                        {fileContent === 'image' ? (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL}/uploads/${viewingFile.path.split('/').pop()}`} 
                                                alt={viewingFile.name}
                                                className="max-w-full mx-auto"
                                            />
                                        ) : fileContent === 'preview' ? (
                                            <div className="text-center p-8">
                                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                                                <button
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                    onClick={() => downloadFile(viewingFile)}
                                                >
                                                    Download File
                                                </button>
                                            </div>
                                        ) : fileContent === 'download' ? (
                                            <div className="text-center p-8">
                                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
                                                <button
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                    onClick={() => downloadFile(viewingFile)}
                                                >
                                                    Download File
                                                </button>
                                            </div>
                                        ) : fileContent ? (
                                            <iframe
                                                src={fileContent}
                                                className="w-full h-96 border-none"
                                                title={viewingFile.name}
                                            />
                                        ) : (
                                            <div className="text-center p-8">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                <p className="text-gray-600">Loading document...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageCabinet;