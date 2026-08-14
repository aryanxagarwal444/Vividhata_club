import React, { useState } from 'react';
import { seedDemoData, clearAllParticipantsData } from '../../lib/firebase';
import { exportParticipantsToCsv } from '../../lib/utils';
import { Participant } from '../../types';
import { useToast } from '../Toast';
import { 
  Settings, 
  Sparkles, 
  Trash2, 
  FileSpreadsheet, 
  RefreshCw, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';

interface SettingsViewProps {
  participants: Participant[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ participants }) => {
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Handle Seeding Demo Data
  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const added = await seedDemoData();
      showToast('Demo Data Populated 🎉', `Added ${added} sample participants with realistic check-in activity.`, 'success');
    } catch (err: any) {
      showToast('Seeding Error', err.message || 'Failed to populate demo data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Handle Clearing Database
  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllParticipantsData();
      showToast('Database Cleared', 'All participant and check-in records removed.', 'warning');
      setConfirmClear(false);
    } catch (err: any) {
      showToast('Clear Failed', err.message || 'Could not clear data.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" />
          System Settings & Demo Operations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage sample datasets, export roster logs, and database utilities.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Demo Dataset Control Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Seed Demo Dataset</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Populates 12 realistic sample participants across top universities (GL Bajaj, IIT Delhi, DTU, NSUT) with mixed check-in timestamps. Allows instant testing of real-time analytics and camera QR scanning.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Populating Firestore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Populate Sample Participants (12 Records)</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-500">
              Current Database Records: <strong className="text-white">{participants.length}</strong>
            </span>
          </div>
        </div>

        {/* Data Export Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export Roster CSV</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Download a complete spreadsheet containing all participant details, registration timestamps, attendance status, and gate check-in times.
              </p>
            </div>
          </div>

          <button
            onClick={() => exportParticipantsToCsv(participants)}
            disabled={participants.length === 0}
            className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>

        {/* Danger Zone: Clear Database */}
        <div className="bg-slate-900 border border-rose-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Clear All Database Records</h3>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                Permanently deletes all registered participants and check-in activity logs from Firestore. Use with caution.
              </p>
            </div>
          </div>

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-6 py-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 font-bold text-xs transition-colors"
            >
              Reset / Clear All Participants
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-rose-200">Are you sure? This will delete all {participants.length} records immediately.</span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleClearData}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  {isClearing ? 'Deleting...' : 'Yes, Delete All'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
