import React from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  History, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Cpu,
  Database,
  Sparkles
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppUser } from '../types';

interface NavbarProps {
  user: FirebaseUser | AppUser;
  activeTab: 'dashboard' | 'new-investigation' | 'history' | 'investigation-detail';
  setActiveTab: (tab: 'dashboard' | 'new-investigation' | 'history') => void;
  onLogout: () => void;
  investigationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  investigationCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/10">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  Sentinel<span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300">
                  SOC Triage
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Cyber Incident Investigator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-900/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              id="nav-tab-new-investigation"
              onClick={() => setActiveTab('new-investigation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'new-investigation'
                  ? 'bg-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/20 border border-cyan-400/40'
                  : 'text-slate-200 bg-slate-900 hover:bg-slate-800/90 hover:text-white border border-slate-700/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Investigate</span>
              <Sparkles className="w-3 h-3 text-cyan-200" />
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-900/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
              {investigationCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                  {investigationCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Profile & Status Badges */}
          <div className="flex items-center space-x-3">
            {/* Engine status indicator */}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
              <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                <Cpu className="w-3 h-3" />
                <span>Gemini 2.5 Flash</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center space-x-1 text-blue-400 font-mono">
                <Database className="w-3 h-3" />
                <span>Firestore</span>
              </span>
            </div>

            {/* User details */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2 text-left">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
                <div className="hidden xl:block text-xs">
                  <div className="font-medium text-slate-200 truncate max-w-[130px]">
                    {user.displayName || user.email?.split('@')[0] || 'SOC Analyst'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                    {user.isAnonymous ? 'Demo Account' : user.email}
                  </div>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
