import React from 'react';
import { Calculator, LayoutDashboard, Upload, TrendingUp, MessageCircle } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'prediction', label: 'Predict', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-violet-500 to-purple-600' },
    { id: 'doubts', label: 'Ask', icon: MessageCircle, color: 'from-indigo-500 to-blue-600' },
    { id: 'batch', label: 'Batch', icon: Upload, color: 'from-emerald-500 to-teal-600' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'from-amber-500 to-rose-600' },
  ];

  return (
    <nav className="relative bg-slate-950/85 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-2 py-3 sm:py-4 px-1">
          {tabs.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative group flex items-center space-x-2 sm:space-x-3 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                activeTab === id
                  ? `bg-gradient-to-r ${color} text-white shadow-lg ring-2 ring-white/20`
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${
                activeTab === id ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;