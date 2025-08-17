import React, { useState } from 'react';
import { Settings, Mail, Bell, User, Menu } from 'lucide-react';
import logo from '../assets/logo.png';


const Navbar = ({ toggleSidebar }) => {
    return (
        <nav className="fixed top-0 w-full bg-white shadow-md px-4 py-2.5 border-b border-gray-800 flex items-center justify-between z-40">
           <div className="flex items-center space-x-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-1 hover:bg-gray-100"
                >
                    <Menu size={22} />
                </button>

                <img src={logo} alt="Logo" className="w-32 sm:w-40 p-2" />
            </div>

            <div className="hidden sm:flex items-center space-x-4">
                <button className="hover:text-red-600 transition">
                    <User size={20} />
                </button>
                <button className="hover:text-red-600 transition">
                    <Mail size={20} />
                </button>
                <button className="hover:text-red-600 transition">
                    <Bell size={20} />
                </button>
                <button className="hover:text-red-600 transition">
                    <Settings size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
