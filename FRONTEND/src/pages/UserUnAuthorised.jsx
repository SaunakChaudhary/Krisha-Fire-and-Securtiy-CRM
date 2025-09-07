import React, { useState } from 'react'
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Shield, Lock } from 'lucide-react';
import { useParams } from 'react-router-dom';

const UserUnAuthorised = () => {
    const [sidebarOpen, setSideOpen] = useState(false);
    const { page } = useParams();

    // Function to format the page name for display
    const formatPageName = (page) => {
        if (!page) return "this page";
        
        return page
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    const formattedPageName = formatPageName(page);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
            <Navbar toggleSidebar={() => setSideOpen(!sidebarOpen)} />
            <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSideOpen(false)} />
                <main className="flex-1 mt-20 sm:mt-24 p-4 lg:pl-80">
                    <div className="max-w-3xl mx-auto py-8 px-4">
                        {/* Main Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center overflow-hidden relative">
                            {/* Decorative elements */}
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-100 rounded-full opacity-30"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-100 rounded-full opacity-30"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-red-100 rounded-full shadow-inner">
                                        <Lock className="h-12 w-12 text-red-600" />
                                    </div>
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                    Access Restricted
                                </h1>

                                <div className="bg-gray-100 p-4 rounded-lg mb-6 border-l-4 border-red-500">
                                    <p className="text-lg text-gray-700 mb-2">
                                        You don't have permission to access
                                    </p>
                                    <p className="text-xl font-semibold text-red-600 bg-red-50 py-2 px-4 rounded-md inline-block">
                                        {formattedPageName}
                                    </p>
                                </div>

                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    This area requires special authorization. If you believe this is an error, 
                                    please contact your system administrator for assistance.
                                </p>
                            </div>
                        </div>

                        {/* Contact Information Card */}
                        <div className="bg-white rounded-2xl shadow-xl mt-8 p-6 md:p-8">
                            <div className="flex items-center justify-center mb-6">
                                <div className="p-3 bg-blue-100 rounded-full mr-3">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Request Access
                                </h2>
                            </div>
                            
                            <p className="text-gray-600 mb-6 text-center">
                                To gain access to <span className="font-medium text-blue-700">{formattedPageName}</span>, 
                                please contact your administrator with the following details:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-blue-600 font-semibold mb-2">Your Account</div>
                                    <p className="text-sm text-gray-600">Provide your username</p>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-blue-600 font-semibold mb-2">Requested Access</div>
                                    <p className="text-sm text-gray-600">Mention <span className="font-medium">{formattedPageName}</span></p>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-blue-600 font-semibold mb-2">Justification</div>
                                    <p className="text-sm text-gray-600">Explain why you need access</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mt-8">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-medium">Note:</span> Access permissions are managed by your organization's security policies.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default UserUnAuthorised;