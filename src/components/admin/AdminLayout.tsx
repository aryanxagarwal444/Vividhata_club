import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles,
  Ticket,
  ChevronRight,
  Bell,
  Layers
} from 'lucide-react';
import { RostrLogo } from '../RostrLogo';

interface AdminLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
  attendedCount: number;
  totalCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onExitAdmin,
  children,
  attendedCount,
  totalCount,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scan QR Code', icon: QrCode, badge: 'Live Cam' },
    { id: 'participants', label: 'Participants', icon: Users, badge: totalCount.toString() },
    { id: 'teams', label: 'Teams Directory', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Demo', icon: Settings },
  ];

  const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          onClick={onExitAdmin}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          title="Return to Homepage"
        >
          <RostrLogo size="sm" />
          <div>
            <span className="font-bold text-slate-900 text-sm">Admin Portal</span>
            <p className="text-[10px] text-indigo-600 font-semibold">Rostr 2026</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 relative"
              title="Notification Center"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed md:sticky top-0 z-30 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Top Sidebar Header */}
        <div className="p-6 space-y-6">
          
          <div className="flex items-center justify-between">
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer focus:outline-none flex-1 min-w-0"
              title="Return to Homepage"
            >
              <RostrLogo size="md" />
              <div className="min-w-0 truncate">
                <h2 className="font-extrabold text-slate-900 text-base tracking-tight truncate">Admin Portal</h2>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Rostr 2026</p>
              </div>
            </button>

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 relative transition-colors shrink-0"
                title="Notification Center"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Realtime Attendance Rate Widget */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Live Attendance</span>
              <span className="font-mono font-bold text-emerald-600">{attendanceRate}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 text-right font-medium">
              {attendedCount} / {totalCount} Checked In
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-6 border-t border-slate-100 space-y-2">
          
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Ticket className="w-4 h-4 text-indigo-600" />
            <span>Public Event Page</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>

        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto bg-slate-50">
        {children}
      </main>

    </div>
  );
};
