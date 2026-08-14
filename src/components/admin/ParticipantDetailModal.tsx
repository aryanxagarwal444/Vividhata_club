import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Participant } from '../../types';
import { checkInParticipantByQrOrId, resetAttendance, deleteParticipantDoc, formatFirestoreTimestamp } from '../../lib/firebase';
import { downloadQrSvgAsPng } from '../../lib/utils';
import { useToast } from '../Toast';
import { 
  X, 
  QrCode, 
  UserCheck, 
  RotateCcw, 
  Trash2, 
  Download, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface ParticipantDetailModalProps {
  participant: Participant | null;
  onClose: () => void;
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  participant,
  onClose
}) => {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset confirmation state whenever participant changes or modal opens
  React.useEffect(() => {
    setConfirmDelete(false);
    setIsProcessing(false);
  }, [participant?.id]);

  if (!participant) return null;

  // Mark as Attended
  const handleMarkAttended = async () => {
    setIsProcessing(true);
    try {
      const res = await checkInParticipantByQrOrId(participant.participantId, 'manual_entry');
      if (res.status === 'success') {
        showToast('Check-In Success! ✅', `${participant.name} is marked as Attended.`, 'success');
      } else {
        showToast('Check-In Notice', res.message, 'warning');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to check in.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Attendance
  const handleResetAttendance = async () => {
    setIsProcessing(true);
    try {
      await resetAttendance(participant.id);
      showToast('Attendance Reset', `Reset attendance status for ${participant.name}.`, 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to reset attendance.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Record
  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteParticipantDoc(participant.id);
      showToast('Participant Deleted', `Deleted record for ${participant.name}.`, 'warning');
      onClose();
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Could not delete participant.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-xl w-full shadow-lg relative space-y-6 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{participant.name}</h3>
            <p className="font-mono text-xs text-indigo-600 font-bold">{participant.participantId}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
              <Mail className="w-3 h-3 text-indigo-600" /> Email
            </p>
            <p className="font-semibold text-slate-800 mt-1 truncate">{participant.email}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
              <Phone className="w-3 h-3 text-indigo-600" /> Phone
            </p>
            <p className="font-semibold text-slate-800 mt-1">{participant.phone}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
              <Building className="w-3 h-3 text-indigo-600" /> College
            </p>
            <p className="font-semibold text-slate-800 mt-1">{participant.college}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-indigo-600" /> Course & Year
            </p>
            <p className="font-semibold text-slate-800 mt-1">{participant.department} ({participant.year})</p>
          </div>

        </div>

        {/* Team Members List if present */}
        {participant.teamName && (
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">
                Team: {participant.teamName}
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">
                Role: {participant.teamRole || (participant.isTeamLeader ? 'Team Lead' : 'Team Member')}
              </span>
            </div>

            {participant.teamMembers && participant.teamMembers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-indigo-900/70 uppercase tracking-widest">
                  Associated Team Members ({participant.teamMembers.length + 1})
                </p>
                <div className="space-y-1">
                  {participant.teamMembers.map((m, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-indigo-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{m.name} ({m.email})</span>
                      <span className="text-[10px] text-slate-500 font-medium">{m.role || 'Member'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status & Timestamps */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Attendance Status:</span>
            {participant.attendanceStatus === 'attended' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                🟢 Attended
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                ⚪ Not Attended
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Registration Time:</span>
            <span className="text-slate-800 font-semibold">{formatFirestoreTimestamp(participant.registeredAt)}</span>
          </div>

          {participant.attendanceStatus === 'attended' && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-medium">Gate Check-In Time:</span>
              <span className="text-emerald-700 font-bold">{formatFirestoreTimestamp(participant.checkedInAt)}</span>
            </div>
          )}
        </div>

        {/* QR Code Center View */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs inline-block">
            <QRCodeSVG id="detail-modal-qr" value={participant.qrToken} size={140} level="H" />
          </div>
          <button
            onClick={() => downloadQrSvgAsPng('detail-modal-qr', `${participant.participantId}_QR`)}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Image
          </button>
        </div>

        {/* Admin Actions Bar */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Actions</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            
            {participant.attendanceStatus !== 'attended' ? (
              <button
                onClick={handleMarkAttended}
                disabled={isProcessing}
                className="px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark Attended</span>
              </button>
            ) : (
              <button
                onClick={handleResetAttendance}
                disabled={isProcessing}
                className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Reset Status</span>
              </button>
            )}

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isProcessing ? 'Deleting...' : 'Confirm'}</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                  title="Cancel deletion"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
            >
              Close
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
