import React, { useState } from 'react';

const DashboardCard = ({ icon, title, count, iconBg, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Function to determine text size based on count length and screen size
    const getCountSize = () => {
        const length = count.toString().length;
        
        // Base sizes for mobile
        if (length <= 5) return "text-xl md:text-2xl";
        if (length <= 8) return "text-lg md:text-xl";
        if (length <= 12) return "text-md md:text-lg";
        return "text-sm md:text-md";
    };

    return (
        <div 
            className={`flex flex-col justify-between bg-white rounded-xl shadow p-4 w-full hover:shadow-lg transition min-h-[120px] md:min-h-[140px] lg:min-h-[160px] relative ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between w-full">
                <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-lg ${iconBg} text-white text-xl md:text-2xl lg:text-3xl flex-shrink-0`}>
                    {icon}
                </div>
                <div 
                    className="ml-2 flex-grow min-w-0"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <p className={`font-bold text-gray-900 text-right ${getCountSize()} truncate`}>
                        {count}
                    </p>
                    
                    {/* Tooltip for full value */}
                    {showTooltip && (
                        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs md:text-sm px-2 py-1 rounded shadow-lg z-10">
                            {count}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-3 md:mt-4">
                <p className="text-sm md:text-base font-medium text-gray-700 text-center line-clamp-2 leading-tight">
                    {title}
                </p>
            </div>
        </div>
    );
};

export default DashboardCard;