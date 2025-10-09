import React from 'react';
import { Brain, BarChart3, Shield } from 'lucide-react';
import logo from '../Assets/Logo.png'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <img 
                src= {logo} 
                alt="EduPredict Logo" 
                className="w-[100px] h-[100px] object-contain"
                onError={(e) => {
                  // Fallback to a placeholder if logo doesn't exist
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 10v6M2 10l10-5 10 5-10 5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                EduPredict
              </h1>
              <p className="text-gray-600 text-sm">
                Student Performance Analytics Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Brain className="w-5 h-5" />
              <div>
                <div className="text-xs text-gray-500">ML Engine</div>
                <div className="text-sm font-semibold">v3.0</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <BarChart3 className="w-5 h-5" />
              <div>
                <div className="text-xs text-gray-500">Accuracy</div>
                <div className="text-sm font-semibold">95.2%</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-5 h-5" />
              <div>
                <div className="text-xs text-gray-500">Deterministic</div>
                <div className="text-sm font-semibold">100%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;