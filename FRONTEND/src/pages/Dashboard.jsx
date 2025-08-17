import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import {
    StickyNote, FileText, Briefcase, ClipboardList, Users, ShoppingCart,
    PhoneCall, Wrench, Box, CheckSquare, XSquare, MessageSquare,
    Award
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Share2, Activity } from 'lucide-react';

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');

    const handleSearch = () => {
        // Replace with your actual logic
        console.log('Search with:', { year, month });
    };

    const handleClear = () => {
        setYear('');
        setMonth('');
        // Replace with your actual logic
        console.log('Clear filters');
    };

    const years = ['2023', '2024', '2025', '2026'];
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    const cards = [
        { icon: <StickyNote size={20} />, title: 'Customer Notes', count: 0, iconBg: 'bg-orange-500' },
        { icon: <Award size={20} />, title: 'Contract Expiring for AMC', count: 1, iconBg: 'bg-orange-600' },
        { icon: <Award size={20} />, title: 'Contract Expiring for Warranty', count: 2, iconBg: 'bg-cyan-600' },
        { icon: <FileText size={20} />, title: 'Pending Sales Enquiry Quotation', count: 1, iconBg: 'bg-cyan-500' },
        { icon: <ShoppingCart size={20} />, title: 'Open Purchase Order', count: 10, iconBg: 'bg-blue-600' },
        { icon: <FileText size={20} />, title: 'Quotation', count: 18, iconBg: 'bg-gray-700' },
        { icon: <Briefcase size={20} />, title: 'Sites', count: 11, iconBg: 'bg-orange-500' },
        { icon: <StickyNote size={20} />, title: 'Site Notes', count: 0, iconBg: 'bg-orange-300' },
        { icon: <ClipboardList size={20} />, title: 'Active Job', count: 33, iconBg: 'bg-green-600' },
        { icon: <Users size={20} />, title: 'Engineers not assigned job', count: 4, iconBg: 'bg-orange-600' },
        { icon: <MessageSquare size={20} />, title: 'Quotes Follow Up', count: 6, iconBg: 'bg-pink-500' },
        { icon: <PhoneCall size={20} />, title: 'New Calls', count: 14, iconBg: 'bg-blue-500' },
        { icon: <PhoneCall size={20} />, title: 'Assigned Calls', count: 15, iconBg: 'bg-green-500' },
        { icon: <Wrench size={20} />, title: 'InProgress Calls', count: 4, iconBg: 'bg-rose-500' },
        { icon: <CheckSquare size={20} />, title: 'Completed Calls', count: 3, iconBg: 'bg-orange-500' },
        { icon: <XSquare size={20} />, title: 'Cancelled Calls', count: 1, iconBg: 'bg-orange-600' },
        { icon: <Box size={20} />, title: 'DC - Pending Invoice', count: 14, iconBg: 'bg-orange-400' },
        { icon: <Box size={20} />, title: 'DC - Not Delivered', count: 13, iconBg: 'bg-orange-300' },
        { icon: <ShoppingCart size={20} />, title: 'PO - Pending Approval', count: 0, iconBg: 'bg-blue-300' },
        { icon: <CheckSquare size={20} />, title: 'Engineer Completed Calls', count: 24, iconBg: 'bg-gray-700' },
        { icon: <CheckSquare size={20} />, title: 'Completed Calls - No Waiting', count: 21, iconBg: 'bg-gray-600' }
    ];

    const salesPriority = [
        { label: 'HIGH', count: 3, icon: <TrendingUp className="text-blue-500" /> },
        { label: 'MEDIUM', count: 1, icon: <Share2 className="text-blue-500" /> },
        { label: 'LOW', count: 1, icon: <Activity className="text-blue-500" /> }
    ];

    const inquiryData = [
        { name: 'Jan', Registered: 0, Won: 0, Loss: 0, Ongoing: 0 },
        { name: 'Feb', Registered: 2, Won: 1, Loss: 0, Ongoing: 4 },
        { name: 'Mar', Registered: 8, Won: 3, Loss: 1, Ongoing: 10 },
        { name: 'Apr', Registered: 12, Won: 4, Loss: 2, Ongoing: 12 },
        { name: 'May', Registered: 13, Won: 5, Loss: 3, Ongoing: 8 },
        { name: 'Jun', Registered: 6, Won: 3, Loss: 2, Ongoing: 10 },
        { name: 'Jul', Registered: 0, Won: 0, Loss: 0, Ongoing: 10 },
    ];

    const callWaitingDetails = [
        { reason: "INVOICE PENDING", count: 2, color: "bg-blue-500" },
        { reason: "TECHNICAL SUPPORT PENDING FROM OEM", count: 2, color: "bg-red-500" },
        { reason: "NEED TO SEND QUOTE", count: 1, color: "bg-gray-700" },
        { reason: "Customer Not Responding", count: 0, color: "bg-orange-500" },
        { reason: "Site Visit Scheduled", count: 0, color: "bg-green-500" },
        { reason: "Parts/Material Awaited", count: 0, color: "bg-gray-400" },
        { reason: "Client Not Available for Discussion", count: 0, color: "bg-cyan-500" },
    ];

    const customerData = [
        { name: 'Jan', newCustomer: 3, newSite: 3 },
        { name: 'Feb', newCustomer: 3, newSite: 3 },
        { name: 'Mar', newCustomer: 0, newSite: 0 },
        { name: 'Jun', newCustomer: 1, newSite: 1 },
        { name: 'Jul', newCustomer: 4, newSite: 4 },
    ];

    const warrantyData = [
        { name: 'Jan', warranty: 0, AMC: 0 },
        { name: 'Feb', warranty: 1, AMC: 0.9 },
        { name: 'Jul', warranty: 1, AMC: 1 },
        { name: 'Dec', warranty: 1, AMC: 1 },
    ];

    const salesData = {
        quoted: 9080500,
        won: 4500000,
        lost: 625000,
    };

    const calls = [
        { date: '22/07/2025', number: '00062', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'New', site: 'MAS', system: 'CONVENTIONAL FIRE ALARM SYSTEM' },
        { date: '17/07/2025', number: '00060', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'New', site: 'MAS SOLUTIONS', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
        { date: '16/07/2025', number: '00059', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'New', site: 'MAS', system: 'CONVENTIONAL FIRE ALARM SYSTEM' },
        { date: '01/07/2025', number: '00046', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'New', site: 'ADANI WILMAR FORTUNE', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
        { date: '26/06/2025', number: '00044', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'Assigned', site: 'MAS SOLUTIONS', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
        { date: '16/06/2025', number: '00042', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'Assigned', site: 'ADANI WILMAR FORTUNE', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
        { date: '16/06/2025', number: '00041', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'Assigned', site: 'KFSL', system: 'FIRE EXTINGUISHER' },
        { date: '09/06/2025', number: '00030', type: 'PREVENTIVE MAINTENANCE', priority: 90, status: 'Assigned', site: 'NOKIA SOLUTIONS AND NETWORKS INDIA PRIVATE LIMITED-ZODIAC SQUARE', system: 'FIRE EXTINGUISHER' },
        { date: '07/06/2025', number: '00027', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'Assigned', site: 'CROMA', route: 'PRAHLADNAGAR', system: 'CONVENTIONAL FIRE ALARM SYSTEM' },
        { date: '05/06/2025', number: '00024', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'Assigned', site: 'NOKIA SOLUTIONS AND NETWORKS INDIA PRIVATE LIMITED-ZODIAC SQUARE', system: 'CONVENTIONAL FIRE ALARM SYSTEM' },
        { date: '05/06/2025', number: '00023', type: 'PREVENTIVE MAINTENANCE', priority: 90, status: 'New', site: 'ADANI WILMAR FORTUNE', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
        { date: '06/02/2025', number: '00014', type: 'PREVENTIVE MAINTENANCE', priority: 0, status: 'New', site: 'ADANI WILMAR FORTUNE', system: 'ADDRESSABLE FIRE ALARM SYSTEM' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
                <main className="flex-1 bg-gray-100 mt-20 sm:mt-24 p-4 lg:pl-80">
                    <h2 className='font-semibold text-2xl sm:text-3xl my-4'>Dashboard</h2>

                    {/* Filter Section */}
                    <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
                        {/* Year Dropdown */}
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-2"
                            >
                                <option value="">Select Year</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Dropdown */}
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Month</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm p-2"
                            >
                                <option value="">Select Month</option>
                                {months.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 w-full sm:w-auto items-end">
                            <button
                                onClick={handleSearch}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded w-full sm:w-auto"
                            >
                                Search
                            </button>
                            <button
                                onClick={handleClear}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded w-full sm:w-auto"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {cards.map((card, index) => (
                            <DashboardCard
                                key={index}
                                icon={card.icon}
                                title={card.title}
                                count={card.count}
                                iconBg={card.iconBg}
                            />
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="p-6 space-y-6">

                        {/* Sales Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {salesPriority.map((item, i) => (
                                <div key={i} className="flex flex-col items-center p-4 rounded-lg bg-white shadow-md text-center">
                                    <div className="text-3xl">{item.icon}</div>
                                    <p className="text-xl font-semibold">{item.count}</p>
                                    <span className="text-sm text-gray-500">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Middle Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sales Inquiry Chart */}
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-gray-700 font-semibold mb-2">Sales Inquiry Details for 2025</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={inquiryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Registered" stroke="#8884d8" />
                                        <Line type="monotone" dataKey="Won" stroke="#82ca9d" />
                                        <Line type="monotone" dataKey="Loss" stroke="#ff6961" />
                                        <Line type="monotone" dataKey="Ongoing" stroke="#facc15" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Call Waiting Details */}
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-gray-700 font-semibold mb-2">Call Waiting Details</h3>
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-gray-600 border-b">
                                            <th className="py-2">Reason</th>
                                            <th className="py-2">Counts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {callWaitingDetails.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="py-2">{item.reason}</td>
                                                <td className="py-2">
                                                    <span className={`text-white px-2 py-1 text-xs rounded ${item.color}`}>
                                                        {item.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottom Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* New Customer Bar Chart */}
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-gray-700 font-semibold mb-2">New Customers & New Sites Detail for 2025</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={customerData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="newCustomer" fill="#10b981" />
                                        <Bar dataKey="newSite" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Warranty & AMC Expiry Chart */}
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-gray-700 font-semibold mb-2">Warranty & AMC Contract Expiring Details for 2025</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={warrantyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="warranty" stroke="#3b82f6" />
                                        <Line type="monotone" dataKey="AMC" stroke="#facc15" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>


                </main>
            </div>
        </div>
    );
};

export default Dashboard;
