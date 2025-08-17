import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
      <ShieldOff className="h-20 w-20 text-red-500 mb-4" />
      <h1 className="text-3xl font-semibold text-gray-800 mb-2">Unauthorized Access</h1>
      <p className="text-gray-600 mb-6">
        You don’t have permission to view this page. Please contact your administrator.
      </p>
      <button
        onClick={() => navigate(-3)}
        className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Go Back 
      </button>
    </div>
  );
};

export default Unauthorized;
