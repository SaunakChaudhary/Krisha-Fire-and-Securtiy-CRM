import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import logo from '../assets/logo.png'
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-gray-50 to-gray-100 px-6 py-12">
      {/* Krishna Fire & Safety Logo */}
      <div className="mb-8">
        <img
          src={logo}
          alt="Krishna Fire & Safety"
          className="h-16 w-auto mx-auto mb-10"
        />
      </div>

      {/* 404 Content */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          onClick={() => navigate(-1)}
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
        >
          Go Back
        </Link>
      </div>

      {/* Footer Note */}
      <p className="mt-8 text-sm text-gray-500">
        © {new Date().getFullYear()} Krishna Fire & Safety. All rights reserved.
      </p>
    </div>
  );
};

export default NotFound;