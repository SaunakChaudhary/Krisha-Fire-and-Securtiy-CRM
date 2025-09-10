import { User, Menu } from 'lucide-react';
import logo from '../assets/logo.png';
import { AuthContext } from "../Context/AuthContext";
import { useContext } from 'react';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useContext(AuthContext);

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
                <button className="flex gap-2 font-bold hover:text-red-600 transition">
                    <span className='border-2 border-black rounded-full'><User size={20} /></span> {user?.firstname ? user?.firstname + " " + user?.lastname: user?.user?.firstname + " " + user?.user?.lastname}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
