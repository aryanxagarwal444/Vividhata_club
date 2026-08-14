import React from 'react';
import { QrCode, Ticket, Shield, Sparkles, Search, UserCheck, Bell } from 'lucide-react';
import { RostrLogo } from './RostrLogo';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  participantCount: number;
  openLookupModal: () => void;
  isAdmin: boolean;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  participantCount,
  openLookupModal,
  isAdmin,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 text-left group transition-all cursor-pointer focus:outline-none"
          title="Go to Homepage"
        >
          <RostrLogo size="md" />
          <div>
            <div className="font-semibold text-slate-900 tracking-tight text-base flex items-center gap-2">
              <span>ROSTR</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase tracking-wider">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Event QR Attendance System</p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live attendee count indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span><strong className="text-emerald-900">{participantCount}</strong> Registered</span>
          </div>

          {/* Notification Center Bell Button */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5"
              title="Open Notification Center"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden sm:inline text-xs font-bold text-slate-700">Live Feed</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-emerald-500 text-slate-950 rounded-full animate-pulse shadow-sm">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* QR Check-In Fast Button */}
          <button
            onClick={() => setCurrentView('scan-checkin')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-extrabold rounded-lg border transition-all cursor-pointer shadow-2xs ${
              currentView === 'scan-checkin'
                ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-indigo-500/20'
                : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200/80'
            }`}
            title="Open Live QR Code Scanner to Check In"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>QR Check-In</span>
          </button>

          {/* Find My Pass Button */}
          <button
            onClick={openLookupModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Find My Pass</span>
            <span className="sm:hidden">Pass</span>
          </button>

          {/* Register Button */}
          {currentView !== 'register' && (
            <button
              onClick={() => setCurrentView('register')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-sm transition-all"
            >
              <Ticket className="w-4 h-4" />
              <span>Register Now</span>
            </button>
          )}

          {/* Admin Login or Dashboard Button */}
          <button
            onClick={() => setCurrentView(isAdmin ? 'admin-dashboard' : 'admin-login')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all ${
              isAdmin
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>{isAdmin ? 'Admin Portal' : 'Admin'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
