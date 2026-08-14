import React, { useState, useMemo } from 'react';
import { Participant } from '../../types';
import { checkInParticipantByQrOrId, formatFirestoreTimestamp, HACKATHONS } from '../../lib/firebase';
import { exportParticipantsToCsv } from '../../lib/utils';
import { useToast } from '../Toast';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Layers
} from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
  onSelectParticipant: (participant: Participant) => void;
  onNavigateToTeams?: () => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  onSelectParticipant,
  onNavigateToTeams
}) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'not_attended'>('all');
  const [hackathonFilter, setHackathonFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Extract unique colleges for filter dropdown
  const uniqueColleges = useMemo(() => {
    const set = new Set<string>();
    participants.forEach(p => {
      if (p.college) set.add(p.college);
    });
    return Array.from(set).sort();
  }, [participants]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.participantId.toLowerCase().includes(q) ||
        p.college.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.hackathonTitle && p.hackathonTitle.toLowerCase().includes(q)) ||
        (p.teamName && p.teamName.toLowerCase().includes(q)) ||
        p.phone.includes(q)
      );

      // Status
      const matchesStatus = statusFilter === 'all' || p.attendanceStatus === statusFilter;

      // Hackathon
      const matchesHackathon = hackathonFilter === 'all' || p.hackathonId === hackathonFilter;

      // College
      const matchesCollege = collegeFilter === 'all' || p.college === collegeFilter;

      return matchesSearch && matchesStatus && matchesHackathon && matchesCollege;
    });
  }, [participants, searchQuery, statusFilter, hackathonFilter, collegeFilter]);

  // Manual Check-In Button Handler
  const handleManualCheckIn = async (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation();
    if (participant.attendanceStatus === 'attended') {
      showToast('Already Checked In', `${participant.name} is already marked as attended.`, 'warning');
      return;
    }

    setIsProcessingId(participant.id);
    try {
      const res = await checkInParticipantByQrOrId(participant.participantId, 'manual_entry');
      if (res.status === 'success') {
        showToast('Check-In Success! ✅', `${participant.name} is marked as Attended.`, 'success');
      } else {
        showToast('Check-In Notice', res.message, 'warning');
      }
    } catch (err: any) {
      showToast('Check-In Failed', err.message || 'Could not perform check-in.', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Participant Directory ({participants.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter by hackathon, manage, and manually check in event delegates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onNavigateToTeams && (
            <button
              onClick={onNavigateToTeams}
              className="px-4 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-semibold text-indigo-700 text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>View Grouped Teams</span>
            </button>
          )}

          <button
            onClick={() => exportParticipantsToCsv(participants)}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-semibold text-slate-700 text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, ID, team, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none transition-all"
          />
        </div>

        {/* Hackathon Filter */}
        <div className="sm:col-span-3">
          <select
            value={hackathonFilter}
            onChange={(e) => setHackathonFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-600 appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Hackathons</option>
            {HACKATHONS.map(h => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-600 appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="attended">🟢 Attended</option>
            <option value="not_attended">⚪ Not Attended</option>
          </select>
        </div>

        {/* College Filter */}
        <div className="sm:col-span-3">
          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-600 appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Colleges</option>
            {uniqueColleges.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-3.5">Participant</th>
                <th className="px-6 py-3.5">Hackathon Event</th>
                <th className="px-6 py-3.5">College & Dept</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Check-In Time</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No matching participants found.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectParticipant(p)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Participant Name & ID */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <p className="font-mono text-[11px] text-indigo-600 font-bold">{p.participantId}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.email} • {p.phone}</p>
                      </div>
                    </td>

                    {/* Hackathon Title & Team */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{p.hackathonTitle || 'Rostr 2026'}</span>
                        </p>
                        {p.teamName && (
                          <p className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Team: <strong>{p.teamName}</strong></span>
                            {p.teamRole && (
                              <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                {p.teamRole}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* College & Dept */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{p.college}</p>
                        <p className="text-[11px] text-slate-500">{p.department} ({p.year})</p>
                      </div>
                    </td>

                    {/* Attendance Status Badge */}
                    <td className="px-6 py-4">
                      {p.attendanceStatus === 'attended' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Attended
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Not Attended
                        </span>
                      )}
                    </td>

                    {/* Check-In Time */}
                    <td className="px-6 py-4 text-slate-500 text-[11px] font-medium">
                      {p.attendanceStatus === 'attended' ? (
                        <span className="text-emerald-700 font-bold">
                          {formatFirestoreTimestamp(p.checkedInAt)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {p.attendanceStatus !== 'attended' && (
                          <button
                            onClick={(e) => handleManualCheckIn(p, e)}
                            disabled={isProcessingId === p.id}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs"
                          >
                            {isProcessingId === p.id ? 'Checking...' : 'Check In'}
                          </button>
                        )}

                        <button
                          onClick={() => onSelectParticipant(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Details & QR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
