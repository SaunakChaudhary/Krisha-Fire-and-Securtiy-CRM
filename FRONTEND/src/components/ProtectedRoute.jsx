import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import logo from "../assets/logo.png";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    const token = localStorage.getItem("token");

    // 1️⃣ If loading OR token exists but user not loaded yet → WAIT
    if (loading || (token && !user)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <img src={logo} alt="Logo" className="h-16 mb-4 animate-pulse" />
                <p className="text-gray-600 text-lg">Authenticating your session...</p>
            </div>
        );
    }

    // 2️⃣ If no user and no token → redirect to login
    if (!user && !token) {
        return <Navigate to="/" replace />;
    }

    // 3️⃣ Role check
    const role = user?.accesstype_id?.name || user?.role;
    if (!allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
