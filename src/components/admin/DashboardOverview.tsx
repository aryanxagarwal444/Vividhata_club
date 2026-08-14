import React, { useState } from 'react';
import { Participant, CheckInLog } from '../../types';
import { formatFirestoreTimestamp, HACKATHONS } from '../../lib/firebase';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  QrCode, 
  TrendingUp, 
  Clock, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  Layers
} from 'lucide-react';

interface DashboardOverviewProps {
  participants: Participant[];
  checkInLogs: CheckInLog[];
  setActiveTab: (tab: string) => void;
  onManualCheckIn: () => void;
  onExportCsv: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  participants,
  checkInLogs,
  setActiveTab,
  onManualCheckIn,
  onExportCsv
}) => {
  const [hackathonFilter, setHackathonFilter] = useState<string>('ALL');

  // Filter participants based on selected hackathon
  const filteredParticipants = hackathonFilter === 'ALL'
    ? participants
    : participants.filter(p => p.hackathonId === hackathonFilter);

  const totalRegistered = filteredParticipants.length;
  const attendedCount = filteredParticipants.filter(p => p.attendanceStatus === 'attended').length;
  const notAttendedCount = totalRegistered - attendedCount;
  const attendanceRate = totalRegistered > 0 ? ((attendedCount / totalRegistered) * 100).toFixed(1) : '0.0';

  // Recent check-in attendees derived from filtered participants list
  const recentCheckIns = filteredParticipants
    .filter(p => p.attendanceStatus === 'attended')
    .sort((a, b) => {
      const tA = a.checkedInAt?.seconds ? a.checkedInAt.seconds * 1000 : new Date(a.checkedInAt || 0).getTime();
      const tB = b.checkedInAt?.seconds ? b.checkedInAt.seconds * 1000 : new Date(b.checkedInAt || 0).getTime();
      return tB - tA;
    })
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Real-Time Attendance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live gate check-in monitoring and analytics across hackathons.
          </p>
        </div>

        {/* Hackathon Filter Dropdown & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={hackathonFilter}
              onChange={(e) => setHackathonFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer shadow-xs"
            >
              <option value="ALL">All Hackathons ({participants.length})</option>
              {HACKATHONS.map(h => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveTab('scanner')}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-white uppercase tracking-wider text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={onExportCsv}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-semibold text-slate-700 text-xs flex items-center gap-2 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards 4 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Registered</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalRegistered.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 font-medium">Registrations recorded</p>
        </div>

        {/* Attended */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Checked In</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">{attendedCount.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified at event gate
          </p>
        </div>

        {/* Not Attended */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Not Attended</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">{notAttendedCount.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 font-medium">Pending check-in</p>
        </div>

        {/* Attendance Rate */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attendance Rate</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{attendanceRate}%</div>
          <p className="text-[11px] text-slate-500 font-medium">Overall turnout rate</p>
        </div>

      </div>

      {/* Progress Bar Section */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Live Turnout Progress {hackathonFilter !== 'ALL' && `(${HACKATHONS.find(h => h.id === hackathonFilter)?.title})`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {attendedCount} of {totalRegistered} registered participants checked in.
            </p>
          </div>
          <span className="text-xl font-extrabold font-mono text-emerald-600">
            {attendanceRate}%
          </span>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-700"
            style={{ width: `${attendanceRate}%` }}
          ></div>
        </div>
      </div>

      {/* Real-time Activity Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Check-ins Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <h3 className="font-bold text-slate-900 text-base">Live Gate Check-In Stream</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-medium">Real-time Firestore</span>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No check-ins recorded for this view yet.</p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Scan a QR pass to start check-ins
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {recentCheckIns.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                        <span className="text-indigo-600 font-mono font-bold">{item.participantId}</span>
                        <span>•</span>
                        <span className="text-slate-800 font-semibold">{item.hackathonTitle || 'Hackathon'}</span>
                        <span>•</span>
                        <span>{item.college}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 inline-block">
                      🟢 Checked In
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {formatFirestoreTimestamp(item.checkedInAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Gate Actions */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Quick Gate Controls
            </h3>

            <button
              onClick={() => setActiveTab('scanner')}
              className="w-full p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5" />
                <span>Open Camera QR Scanner</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className="w-full p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Participant Directory</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hackathons Quick Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Hackathon Breakdown
            </h3>
            <div className="space-y-2 pt-1 text-xs">
              {HACKATHONS.map(h => {
                const count = participants.filter(p => p.hackathonId === h.id).length;
                const attended = participants.filter(p => p.hackathonId === h.id && p.attendanceStatus === 'attended').length;

                return (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800 truncate pr-2">{h.title}</span>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 shrink-0">
                      {attended}/{count} checked in
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
