import React, { useContext, useState } from 'react';
import {
    LayoutDashboard, Users, Search, UserPlus, Building2, UserCircle, Briefcase,
    ShoppingCart, FileText, Wrench, CalendarDays, Package,
    ClipboardList, Code2, BarChart3, Archive, LogOut, Settings2,
    Server,
    NotebookIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../Context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar, open }) => {
    const { setUser } = useContext(AuthContext);

    const [openMenu, setOpenMenu] = useState(false);
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
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                ></div>
            )}

            <div
                className={`
                    fixed lg:top-[91px] md:top-[90px] sm:top-[90px] top-[79px] left-0 h-[calc(100vh-4rem)]
                    bg-gray-900 text-white flex flex-col w-64 z-50
                    transform ${isOpen ? 'translate-x-0' : '-translate-x-64'}
                    lg:translate-x-0 transition-transform duration-300 ease-in-out
                `}
            >
                <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                    <ul className="font-semibold space-y-1 px-4 text-sm pb-20">
                        <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" link="/dashboard" />

                        <SidebarDropdown
                            open={openMenu === "user"}
                            toggle={() => setOpenMenu(openMenu === "user" ? null : "user")}
                            icon={<Users size={18} />}
                            label="Manage User"
                            subItems={[
                                { icon: <UserPlus size={16} />, label: 'Add User', link: '/add-user', open: open === "addUser" ? true : false },
                                { icon: <Search size={16} />, label: 'Search User', link: '/search-user' },
                                { icon: <Settings2 size={16} />, label: 'Set User Access Type', link: '/user-access-type' },
                                { icon: <Settings2 size={16} />, label: 'Set User Permission' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "company"}
                            toggle={() => setOpenMenu(openMenu === "company" ? null : "company")}
                            icon={<Building2 size={18} />}
                            label="Manage Company"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search Company', link: '/search-company' },
                                { icon: <UserPlus size={16} />, label: 'Add Company', link: '/add-company' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "customer"}
                            toggle={() => setOpenMenu(openMenu === "customer" ? null : "customer")}
                            icon={<UserCircle size={18} />}
                            label="Manage Lead"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search Customer', link: '/search-customer' },
                                { icon: <UserPlus size={16} />, label: 'Add Customer', link: '/add-customer' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "site"}
                            toggle={() => setOpenMenu(openMenu === "site" ? null : "site")}
                            icon={<Briefcase size={18} />}
                            label="Manage Site"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search Site', link: '/search-site' },
                                { icon: <UserPlus size={16} />, label: 'Add Site', link: '/add-site' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "sales"}
                            toggle={() => setOpenMenu(openMenu === "sales" ? null : "sales")}
                            icon={<ShoppingCart size={18} />}
                            label="Manage Sales Enquiry"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search Sales Enquiry', link: "/search-sales-enquiry" },
                                { icon: <UserPlus size={16} />, label: 'Add Sales Enquiry', link: "/add-sales-enquiry" },
                                { icon: <Search size={16} />, label: 'Search Quotation', link: "/search-quotation" },
                                { icon: <FileText size={16} />, label: 'Add Quotation', link: "/add-quotation" }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "jobCosting"}
                            toggle={() => setOpenMenu(openMenu === "jobCosting" ? null : "jobCosting")}
                            icon={<FileText size={18} />}
                            label="Manage Job Costing"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search', link: "/manage-job-costing" },
                                { icon: <UserPlus size={16} />, label: 'Add Job Costing', link: "/add-job-costing" }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "service"}
                            toggle={() => setOpenMenu(openMenu === "service" ? null : "service")}
                            icon={<Wrench size={18} />}
                            label="Service & Maintenance"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search Call', link: '/calls' },
                                { icon: <UserPlus size={16} />, label: 'Add Call', link: '/add-call' },
                                { icon: <CalendarDays size={16} />, label: 'Preventative Maintenance' }
                            ]}
                        />
                        <SidebarItem icon={<NotebookIcon size={18} />} label="Diary" link="/manage-diary" />


                        <SidebarDropdown
                            open={openMenu === "supplier"}
                            toggle={() => setOpenMenu(openMenu === "supplier" ? null : "supplier")}
                            icon={<Package size={18} />}
                            label="Manage Supplier"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search', link: "/search-supplier" },
                                { icon: <UserPlus size={16} />, label: 'Add Supplier', link: '/add-supplier' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "stock"}
                            toggle={() => setOpenMenu(openMenu === "stock" ? null : "stock")}
                            icon={<ClipboardList size={18} />}
                            label="Manage Stock"
                            subItems={[
                                { icon: <FileText size={16} />, label: 'Price List', link: "/price-list" },
                                { icon: <FileText size={16} />, label: 'Delivery Chalan', link: "/delivery-chalan" },
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "purchaseOrder"}
                            toggle={() => setOpenMenu(openMenu === "purchaseOrder" ? null : "purchaseOrder")}
                            icon={<ShoppingCart size={18} />}
                            label="Manage Purchase Order"
                            subItems={[
                                { icon: <Search size={16} />, label: 'Search', link: '/manage-purchase-order' },
                                { icon: <UserPlus size={16} />, label: 'Add Purchase Order', link: '/add-purchase-order' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "companyCode"}
                            toggle={() => setOpenMenu(openMenu === "companyCode" ? null : "companyCode")}
                            icon={<Code2 size={18} />}
                            label="Manage Company Codes"
                            subItems={[
                                { icon: <FileText size={16} />, label: 'Reference Code', link: '/reference-code' },
                                { icon: <FileText size={16} />, label: 'System Code', link: '/manage-system' },
                                { icon: <FileText size={16} />, label: 'Product Code', link: '/manage/product-code' },
                                { icon: <FileText size={16} />, label: 'Associated Call/Docket Types', link: '/docket-type' }
                            ]}
                        />

                        <SidebarDropdown
                            open={openMenu === "reports"}
                            toggle={() => setOpenMenu(openMenu === "reports" ? null : "reports")}
                            icon={<BarChart3 size={18} />}
                            label="Reports"
                            subItems={[
                                { icon: <FileText size={16} />, label: 'Site Report', link: '/site-report' },
                                { icon: <FileText size={16} />, label: 'Engineer Report', link: '/engineer-report' },
                                { icon: <FileText size={16} />, label: 'Supplier Report', link: '/supplier-report' },
                                { icon: <FileText size={16} />, label: 'Sales Enquiry Report', link: '/sales-enquiry-report' },
                                { icon: <FileText size={16} />, label: 'Purchase Order Report', link: '/purchase-order-report' },
                                { icon: <FileText size={16} />, label: 'Delivery Challan Report', link: '/delivery-challan-report' }
                            ]}
                        />

                        <SidebarItem icon={<Archive size={18} />} label="Manage Cabinet" link="/manage-cabinet" />
                    </ul>
                </div>

                <div onClick={() => handleLogout()} className="fixed bottom-[25px] w-full bg-gray-900 transition">
                    <button className="w-full flex items-center justify-center space-x-2 py-3 font-semibold">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

const SidebarItem = ({ icon, label, link }) => {
    const navigate = useNavigate();
    return (
        <li onClick={() => navigate(link)} className="hover:bg-red-700 rounded px-2 py-2 flex items-center space-x-2 cursor-pointer transition">
            {icon}
            <span>{label}</span>
        </li>)
};

const SidebarDropdown = ({ open, toggle, icon, label, subItems }) => (
    <li>
        <div
            onClick={toggle}
            className="hover:bg-red-700 rounded px-2 py-2 flex items-center justify-between cursor-pointer transition"
        >
            <div className="flex items-center space-x-2">
                {icon}
                <span>{label}</span>
            </div>
            <span className="transition-transform duration-300">{open ? '-' : '+'}</span>
        </div>

        <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
        >
            <ul className="ml-6 space-y-1 text-gray-300">
                {subItems.map((item, index) => (
                    <SidebarSubItem key={index} icon={item.icon} label={item.label} link={item.link} />
                ))}
            </ul>
        </div>
    </li>
);

const SidebarSubItem = ({ icon, label, link, open }) => {
    const navigate = useNavigate();
    return (
        <li onClick={() => navigate(link)} className={`hover:bg-gray-800 ${open && 'bg-gray-800'} rounded px-2 py-1 cursor-pointer flex items-center space-x-2 transition`}>
            {icon}
            <span>{label}</span>
        </li>)
};

export default Sidebar;
