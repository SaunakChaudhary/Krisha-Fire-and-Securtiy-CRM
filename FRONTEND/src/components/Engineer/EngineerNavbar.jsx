import { LogOut, User, Menu, X, ChevronLeft } from 'lucide-react'
import React, { useContext, useState } from 'react'
import { AuthContext } from "../../Context/AuthContext";
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const EngineerNavbar = () => {
    const { user,setUser } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                setUser(null);
                navigate("/");
            } else {
                const data = await res.json();
                console.error("Logout failed:", data.message);
            }
        } catch (err) {
            console.error("Error during logout:", err);
        }
    };

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <nav className="bg-white shadow-md px-4 sm:px-6 py-3 flex justify-between items-center">
                {/* Left Section - Logo and Back Button */}
                <div className="flex items-center">

                    <button
                        className="lg:hidden mr-3 text-gray-600"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>


                    <img src={logo} alt="Logo" className="w-28 sm:w-36" />
                </div>

                {/* Right Section - User Info and Actions */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="hidden sm:flex sm:items-center">
                        <User className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="text-gray-700 font-medium">
                            {user.user.firstname} {user.user.lastname}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="hidden sm:flex items-center bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-1" />
                        <span>Logout</span>
                    </button>

                    <button
                        className="lg:hidden text-gray-600"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <User className="h-6 w-6" />
                    </button>
                </div>

                {/* Mobile Menu Slide-in */}
                <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <img src={logo} alt="Logo" className="w-32" />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-b">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">{user.user.firstname} {user.user.lastname}</p>
                                <p className="text-sm text-gray-500">Engineer</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default EngineerNavbar