import React from 'react';
import { Wrench } from 'lucide-react';

const EngineerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-red-600 mb-8">
        Engineer Dashboard
      </h1>

      <div className="max-w-xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl p-8 flex flex-col items-center space-y-4 border-l-4 border-blue-500">
          <Wrench size={48} className="text-blue-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Features Coming Soon</h2>
          <p className="text-gray-600 text-center">
            This section is under construction. We're working on bringing powerful tools and insights for engineers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EngineerDashboard;
