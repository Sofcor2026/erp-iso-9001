
import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
    const changeColor = changeType === 'increase' ? 'text-green-600' : 'text-red-600';
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className="text-gray-400">{icon}</div>
            </div>
            <div className="mt-2">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
