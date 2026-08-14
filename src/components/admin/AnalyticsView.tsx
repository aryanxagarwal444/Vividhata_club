import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { Participant } from '../../types';
import { HACKATHONS } from '../../lib/firebase';
import { BarChart3, TrendingUp, Users, PieChart as PieIcon, Building2, Layers } from 'lucide-react';

interface AnalyticsViewProps {
  participants: Participant[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ participants }) => {
  const total = participants.length;
  const attended = participants.filter(p => p.attendanceStatus === 'attended').length;
  const notAttended = total - attended;

  // Donut chart data for attendance breakdown
  const pieData = [
    { name: 'Checked In', value: attended, color: '#10B981' }, // Emerald 500
    { name: 'Not Attended', value: notAttended, color: '#F59E0B' } // Amber 500
  ];

  // Hackathon breakdown data
  const hackathonData = useMemo(() => {
    return HACKATHONS.map(h => {
      const reg = participants.filter(p => p.hackathonId === h.id).length;
      const att = participants.filter(p => p.hackathonId === h.id && p.attendanceStatus === 'attended').length;
      return {
        name: h.title.length > 15 ? h.title.substring(0, 15) + '...' : h.title,
        registered: reg,
        checkedIn: att
      };
    });
  }, [participants]);

  // Hourly check-in distribution
  const hourlyCheckInData = useMemo(() => {
    const hoursMap: Record<string, number> = {
      '08 AM': 0,
      '09 AM': 0,
      '10 AM': 0,
      '11 AM': 0,
      '12 PM': 0,
      '01 PM': 0,
      '02 PM': 0,
      '03 PM': 0,
      '04 PM': 0
    };

    participants.forEach(p => {
      if (p.attendanceStatus === 'attended' && p.checkedInAt) {
        const date = new Date(p.checkedInAt.seconds ? p.checkedInAt.seconds * 1000 : p.checkedInAt);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = `${(hour % 12 || 12).toString().padStart(2, '0')} ${ampm}`;
        if (hoursMap[formattedHour] !== undefined) {
          hoursMap[formattedHour]++;
        } else {
          hoursMap[formattedHour] = 1;
        }
      }
    });

    return Object.keys(hoursMap).map(hour => ({
      hour,
      checkIns: hoursMap[hour]
    }));
  }, [participants]);

  // College distribution top 5
  const collegeData = useMemo(() => {
    const colMap: Record<string, number> = {};
    participants.forEach(p => {
      const col = p.college || 'Other';
      colMap[col] = (colMap[col] || 0) + 1;
    });

    return Object.keys(colMap)
      .map(col => ({ college: col.length > 18 ? col.substring(0, 18) + '...' : col, count: colMap[col] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [participants]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Event Attendance Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Visual metrics, multi-hackathon participation breakdown, and turnout trends.
        </p>
      </div>

      {/* Grid 2x2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Hackathon Participation Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Hackathon Registration & Turnout
          </h3>
          <p className="text-xs text-slate-500">Registered delegates vs checked-in participants across active hackathons.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hackathonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }} 
                />
                <Legend />
                <Bar dataKey="registered" fill="#6366F1" name="Registered" radius={[4, 4, 0, 0]} />
                <Bar dataKey="checkedIn" fill="#10B981" name="Checked In" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Breakdown Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-600" />
            Overall Turnout Ratio
          </h3>
          <p className="text-xs text-slate-500">Ratio of checked-in vs remaining registered delegates.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Check-ins By Hour Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Gate Scans By Hour
          </h3>
          <p className="text-xs text-slate-500">Peak check-in activity at the entrance gate.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyCheckInData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }} 
                />
                <Bar dataKey="checkIns" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Colleges Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Top Participating Colleges
          </h3>
          <p className="text-xs text-slate-500">Institutions with highest registered delegation.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="college" type="category" stroke="#64748B" fontSize={10} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }} 
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
