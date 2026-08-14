import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Users, 
  Volume2, 
  VolumeX,
  Search,
  ArrowRight
} from 'lucide-react';
import { NotificationItem, Participant } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  onSelectParticipant?: (participant: Participant) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  participants: Participant[];
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  onSelectParticipant,
  soundEnabled,
  onToggleSound,
  participants,
}: NotificationCenterProps) {
  const [filterType, setFilterType] = useState<'all' | 'join' | 'leave' | 'registration'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.participantName && n.participantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.teamName && n.teamName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const getParticipant = (id?: string) => {
    if (!id) return undefined;
    return participants.find((p) => p.id === id || p.participantId === id);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">Notification Center</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Live participant joins, leaves & teams feed</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute audio notifications' : 'Enable audio notifications'}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? 'text-indigo-400 hover:bg-slate-800'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search participant or team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('join')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                  filterType === 'join'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3 h-3 text-emerald-500" />
                <span>Joined</span>
              </button>
              <button
                onClick={() => setFilterType('leave')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                  filterType === 'leave'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserX className="w-3 h-3 text-amber-500" />
                <span>Left</span>
              </button>
              <button
                onClick={() => setFilterType('registration')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                  filterType === 'registration'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserPlus className="w-3 h-3 text-blue-500" />
                <span>Registered</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">{filteredNotifications.length} live activities</span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-3 mt-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No notifications in this filter</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Real-time alerts will pop up automatically whenever attendees check in, leave, or register.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const participant = getParticipant(n.participantId);

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkAsRead(n.id);
                    if (participant && onSelectParticipant) {
                      onSelectParticipant(participant);
                    }
                  }}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer group hover:bg-indigo-50/50 border relative ${
                    !n.read 
                      ? 'bg-indigo-50/40 border-indigo-100 shadow-sm' 
                      : 'bg-white border-transparent hover:border-slate-200'
                  }`}
                >
                  {!n.read && (
                    <span className="absolute left-1.5 top-4 w-2 h-2 rounded-full bg-indigo-600" />
                  )}

                  <div className="flex items-start gap-3 pl-1.5">
                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        n.type === 'join'
                          ? 'bg-emerald-100 text-emerald-700'
                          : n.type === 'leave'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {n.type === 'join' && <UserCheck className="w-5 h-5" />}
                      {n.type === 'leave' && <UserX className="w-5 h-5" />}
                      {n.type === 'registration' && <UserPlus className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {n.title}
                        </p>
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Team Name & Meta Tags */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {n.teamName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                            <Users className="w-3 h-3" />
                            <span>Team: {n.teamName}</span>
                          </span>
                        )}

                        {n.hackathonTitle && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[180px]">
                            {n.hackathonTitle}
                          </span>
                        )}

                        {n.type === 'join' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            On-Site
                          </span>
                        )}

                        {n.type === 'leave' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Checked Out
                          </span>
                        )}

                        {participant && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 font-semibold ml-auto group-hover:underline">
                            <span>View Pass</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Live updates enabled • Grouped by teams & individual attendance
          </p>
        </div>
      </div>
    </div>
  );
}
