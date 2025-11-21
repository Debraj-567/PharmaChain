
import React from 'react';
import { LayoutDashboard, FilePlus, FileCheck, LogOut, ShieldCheck, Factory, Globe, Gavel } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.UPLOAD, label: 'Upload Rx', icon: FilePlus },
    { id: AppView.REVIEW, label: 'Review', icon: FileCheck },
    { id: AppView.VERIFY, label: 'Batch Verify', icon: ShieldCheck },
    { id: AppView.REGISTER, label: 'Register Batch', icon: Factory },
    { id: AppView.MAP, label: 'Global Map', icon: Globe },
    { id: AppView.GOVERNANCE, label: 'Governance DAO', icon: Gavel },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50 print:hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PharmaChain</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-1">Trusted AI & Blockchain</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-teal-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
