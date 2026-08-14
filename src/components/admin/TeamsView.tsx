import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Sparkles,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { Participant } from '../../types';
import { markParticipantAttended, markParticipantLeft } from '../../lib/firebase';
import { useToast } from '../Toast';

interface TeamsViewProps {
  participants: Participant[];
  onSelectParticipant: (participant: Participant) => void;
}

interface TeamGroup {
  teamName: string;
  members: Participant[];
  totalMembers: number;
  attendedCount: number;
  leftCount: number;
  notAttendedCount: number;
  hackathonTitle?: string;
}

export function TeamsView({ participants, onSelectParticipant }: TeamsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'partial' | 'none'>('all');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  // Group participants by team
  const teamGroups = useMemo(() => {
    const groupsMap: Record<string, Participant[]> = {};

    participants.forEach((p) => {
      const name = p.teamName?.trim() || 'Solo / Unassigned';
      if (!groupsMap[name]) {
        groupsMap[name] = [];
      }
      groupsMap[name].push(p);
    });

    const groups: TeamGroup[] = Object.entries(groupsMap).map(([teamName, members]) => {
      const attendedCount = members.filter((m) => m.attendanceStatus === 'attended').length;
      const leftCount = members.filter((m) => m.attendanceStatus === 'left').length;
      const notAttendedCount = members.filter((m) => m.attendanceStatus === 'not_attended' || !m.attendanceStatus).length;
      const hackathonTitle = members[0]?.hackathonTitle;

      return {
        teamName,
        members,
        totalMembers: members.length,
        attendedCount,
        leftCount,
        notAttendedCount,
        hackathonTitle
      };
    });

    // Sort: named teams first, then by total members descending
    return groups.sort((a, b) => {
      if (a.teamName === 'Solo / Unassigned') return 1;
      if (b.teamName === 'Solo / Unassigned') return -1;
      return b.totalMembers - a.totalMembers;
    });
  }, [participants]);

  // Filtered teams based on search & status filter
  const filteredTeams = useMemo(() => {
    return teamGroups.filter((team) => {
      const matchesSearch = 
        team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.members.some((m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.college.toLowerCase().includes(searchQuery.toLowerCase())
        );

      let matchesStatus = true;
      if (statusFilter === 'full') {
        matchesStatus = team.attendedCount === team.totalMembers && team.totalMembers > 0;
      } else if (statusFilter === 'partial') {
        matchesStatus = team.attendedCount > 0 && team.attendedCount < team.totalMembers;
      } else if (statusFilter === 'none') {
        matchesStatus = team.attendedCount === 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [teamGroups, searchQuery, statusFilter]);

  const toggleExpand = (teamName: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamName]: prev[teamName] === undefined ? false : !prev[teamName]
    }));
  };

  const handleCheckInTeam = async (team: TeamGroup) => {
    const toCheckIn = team.members.filter((m) => m.attendanceStatus !== 'attended');
    if (toCheckIn.length === 0) {
      addToast('info', 'Team Already Checked In', 'All team members are already present on-site.');
      return;
    }

    try {
      await Promise.all(toCheckIn.map((m) => markParticipantAttended(m.id)));
      addToast('success', 'Team Checked In', `Marked ${toCheckIn.length} member(s) of "${team.teamName}" as present.`);
    } catch (err: any) {
      addToast('error', 'Check-In Error', err?.message || 'Failed to check in team.');
    }
  };

  const handleCheckOutTeam = async (team: TeamGroup) => {
    const toCheckOut = team.members.filter((m) => m.attendanceStatus === 'attended');
    if (toCheckOut.length === 0) {
      addToast('info', 'No Active Attendees', 'No team members are currently on-site.');
      return;
    }

    try {
      await Promise.all(toCheckOut.map((m) => markParticipantLeft(m.id)));
      addToast('warning', 'Team Checked Out', `Marked ${toCheckOut.length} member(s) of "${team.teamName}" as left.`);
    } catch (err: any) {
      addToast('error', 'Checkout Error', err?.message || 'Failed to check out team.');
    }
  };

  const totalNamedTeams = teamGroups.filter((t) => t.teamName !== 'Solo / Unassigned').length;
  const fullyAttendedTeams = teamGroups.filter((t) => t.attendedCount === t.totalMembers && t.totalMembers > 0).length;
  const partiallyAttendedTeams = teamGroups.filter((t) => t.attendedCount > 0 && t.attendedCount < t.totalMembers).length;

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Teams Directory & Attendance</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Grouped team rosters, live member check-ins, and batch team attendance controls.
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            <span className="text-indigo-400 font-bold">{totalNamedTeams}</span> Total Teams
          </div>
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            <span className="text-emerald-400 font-bold">{fullyAttendedTeams}</span> 100% On-Site
          </div>
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            <span className="text-amber-400 font-bold">{partiallyAttendedTeams}</span> Partial
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team, member, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            All ({teamGroups.length})
          </button>
          <button
            onClick={() => setStatusFilter('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'full'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            Fully On-Site
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'partial'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            Partial
          </button>
          <button
            onClick={() => setStatusFilter('none')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'none'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            Not Arrived
          </button>
        </div>
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
            <p className="text-base font-semibold text-slate-200">No teams match your search</p>
            <p className="text-xs text-slate-400">Try modifying the search keyword or filter options.</p>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const isExpanded = expandedTeams[team.teamName] !== false; // expanded by default
            const attendancePct = team.totalMembers > 0 ? Math.round((team.attendedCount / team.totalMembers) * 100) : 0;

            return (
              <div
                key={team.teamName}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Team Card Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 border-b border-slate-700/60">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => toggleExpand(team.teamName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0 mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-lg text-white tracking-tight">
                          {team.teamName}
                        </h3>

                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {team.totalMembers} {team.totalMembers === 1 ? 'Member' : 'Members'}
                        </span>

                        {team.hackathonTitle && (
                          <span className="px-2 py-0.5 text-[11px] rounded bg-slate-700 text-slate-300">
                            {team.hackathonTitle}
                          </span>
                        )}

                        {team.attendedCount === team.totalMembers && team.totalMembers > 0 && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            100% Present
                          </span>
                        )}
                      </div>

                      {/* Attendance Progress Bar & counts */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <div className="w-36 h-2 bg-slate-900 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${attendancePct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          <strong className="text-emerald-400 font-bold">{team.attendedCount}</strong> Joined •{' '}
                          <strong className="text-amber-400 font-bold">{team.leftCount}</strong> Left •{' '}
                          <strong className="text-slate-400">{team.notAttendedCount}</strong> Not Checked In
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Controls for Entire Team */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => handleCheckInTeam(team)}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check-In Team</span>
                    </button>

                    <button
                      onClick={() => handleCheckOutTeam(team)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 active:scale-95 text-amber-300 rounded-xl border border-slate-600 transition-all flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Check-Out Team</span>
                    </button>
                  </div>
                </div>

                {/* Team Members List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 divide-y divide-slate-700/50">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-750/30 -mx-2 px-2 rounded-xl transition-colors"
                      >
                        {/* Member Information */}
                        <div
                          onClick={() => onSelectParticipant(member)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors">
                                {member.name}
                              </span>
                              <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-700 text-slate-300 rounded-md">
                                {member.teamRole || (member.isTeamLeader ? 'Team Lead' : 'Member')}
                              </span>
                              {member.college && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  <span className="truncate max-w-[180px]">{member.college}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                              <span>{member.email}</span>
                              <span className="text-slate-500">•</span>
                              <span className="font-mono text-indigo-300">{member.participantId}</span>
                              {member.department && (
                                <>
                                  <span className="text-slate-500">•</span>
                                  <span>{member.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Individual Status & Quick Toggle */}
                        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                          {member.attendanceStatus === 'attended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Joined (On-site)</span>
                            </span>
                          ) : member.attendanceStatus === 'left' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Left (Checked Out)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Not Checked In</span>
                            </span>
                          )}

                          {member.attendanceStatus !== 'attended' ? (
                            <button
                              onClick={() => {
                                markParticipantAttended(member.id);
                                addToast('success', 'Checked In', `${member.name} is marked present.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                            >
                              Check In
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                markParticipantLeft(member.id);
                                addToast('warning', 'Checked Out', `${member.name} is marked left.`);
                              }}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-lg text-xs font-semibold"
                            >
                              Check Out
                            </button>
                          )}

                          <button
                            onClick={() => onSelectParticipant(member)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                            title="View Member Pass"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
