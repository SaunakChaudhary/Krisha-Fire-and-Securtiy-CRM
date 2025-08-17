import React from 'react';

const DashboardCard = ({ icon, title, count, iconBg }) => {
    return (
        <div className="flex flex-col justify-between bg-white rounded-xl shadow p-6 w-full hover:shadow-lg transition min-h-[140px]">
            <div className="flex items-center justify-between w-full">
                <div className={`w-12 h-12 flex items-center justify-center rounded ${iconBg} text-white text-2xl`}>
                    {icon}
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
            <div className="mt-4">
                <p className="text-center text-base font-medium text-gray-700 break-words">
                    {title}
                </p>
            </div>
        </div>
    );
};

export default DashboardCard;
