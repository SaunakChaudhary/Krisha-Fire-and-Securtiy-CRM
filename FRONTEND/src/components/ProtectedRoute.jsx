import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import logo from "../assets/logo.png"

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <img src={logo} alt="Logo" className="h-16 mb-4 animate-pulse" />
        <p className="text-gray-600 text-lg">Authenticating your session...</p>
    </div>;

    if (!user) return <Navigate to="/" />;
    const role = user?.accesstype_id?.name || user.role;
    if (!allowedRoles.includes(role)) {
        return <Navigate to={'/unauthorized'} />;
    }

    return user ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
