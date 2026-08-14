import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Participant } from '../types';
import { HACKATHONS, DEFAULT_EVENT_INFO, checkInParticipantByQrOrId } from '../lib/firebase';
import { downloadQrSvgAsPng, downloadPassAsImage, printParticipantPass, playBeepSound } from '../lib/utils';
import { useToast } from './Toast';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Building, 
  GraduationCap, 
  Mail, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck, 
  Users, 
  Trophy, 
  Maximize2, 
  X, 
  Share2,
  Camera,
  Check,
  Loader2,
  ScanFace
} from 'lucide-react';
import { RostrLogo } from './RostrLogo';

interface ParticipantPassProps {
  participant: Participant;
  onBack: () => void;
  isNewRegistration?: boolean;
  onOpenScanner?: () => void;
}

export const ParticipantPass: React.FC<ParticipantPassProps> = ({
  participant,
  onBack,
  isNewRegistration = false,
  onOpenScanner
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const isAttended = participant.attendanceStatus === 'attended';

  // Find associated hackathon details or fallback
  const matchedHackathon = HACKATHONS.find(h => h.id === participant.hackathonId);
  const hackathonTitle = participant.hackathonTitle || matchedHackathon?.title || DEFAULT_EVENT_INFO.title;
  const hackathonDate = matchedHackathon?.date || DEFAULT_EVENT_INFO.date;
  const hackathonVenue = matchedHackathon?.venue || DEFAULT_EVENT_INFO.venue;

  const handleCopyId = () => {
    navigator.clipboard.writeText(participant.participantId);
    setCopied(true);
    showToast('Copied to Clipboard!', `Participant ID ${participant.participantId} copied.`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${hackathonTitle} Gate Pass`,
        text: `My Official Gate Pass for ${hackathonTitle} (ID: ${participant.participantId})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyId();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-[calc(100vh-4rem)] bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center"
    >
      
      {/* Top Navigation & Fast Actions */}
      <div className="max-w-xl w-full flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Click to copy ID"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{participant.participantId}</span>
          </button>
        </div>
      </div>

      {/* Main Pass Container */}
      <div className="max-w-xl w-full space-y-6">
        
        {/* Registration Confirmation Alert */}
        {isNewRegistration && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1 shadow-xs print:hidden"
          >
            <div className="inline-flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Hackathon Registration Confirmed 🎉</span>
            </div>
            <p className="text-xs text-emerald-800 font-medium">
              Official delegate pass created for <strong>{hackathonTitle}</strong>. Save or print your QR pass for instant entrance.
            </p>
          </motion.div>
        )}

        {/* Printable Pass Card */}
        <div 
          id="printable-event-pass" 
          className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl relative text-slate-900 transform transition-all hover:shadow-2xl"
        >
          {/* Top Gradient Header Strip */}
          <div className="h-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600"></div>

          <div className="p-6 sm:p-8 space-y-6 relative">
            
            {/* Header / Event Title */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-6 gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-indigo-600" />
                    DELEGATE PASS
                  </span>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border flex items-center gap-1.5 ${
                    participant.attendanceStatus === 'attended' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      participant.attendanceStatus === 'attended' ? 'bg-emerald-500 animate-status-glow' : 'bg-amber-500'
                    }`} />
                    {participant.attendanceStatus === 'attended' ? 'Checked In' : 'Valid Gate Pass'}
                  </span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 pt-1 leading-snug">
                  {hackathonTitle}
                </h2>
                
                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{hackathonDate}</span>
                </p>
              </div>

              {/* Event Badge Icon */}
              <RostrLogo size="lg" />
            </div>

            {/* QR Code Interactive Centerpiece */}
            <div className="bg-gradient-to-b from-slate-50 to-indigo-50/40 rounded-2xl p-6 border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-4 relative group">
              
              <div 
                onClick={() => setQrModalOpen(true)}
                className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 inline-block cursor-pointer relative hover:scale-[1.02] transition-transform"
                title="Click to enlarge QR pass"
              >
                <QRCodeSVG
                  id="pass-qr-code"
                  value={participant.qrToken}
                  size={195}
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a"
                />
                
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-950 tracking-wider">
                    {participant.participantId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors print:hidden"
                    title="Copy Participant ID"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Token: {participant.qrToken.slice(0, 18)}...
                </p>
              </div>

              {/* Direct Gate Verification / Check In Button for Attendee */}
              <div className="w-full pt-1 flex items-center justify-center gap-2 print:hidden">
                {!isAttended ? (
                  <button
                    onClick={async () => {
                      setIsCheckingIn(true);
                      try {
                        const res = await checkInParticipantByQrOrId(participant.participantId, 'manual_entry');
                        if (res.status === 'success') {
                          playBeepSound('success');
                          confetti({ particleCount: 90, spread: 80 });
                          showToast('Checked In! 🎉', 'You have been successfully checked in to the venue.', 'success');
                        } else if (res.status === 'duplicate') {
                          playBeepSound('duplicate');
                          showToast('Already Checked In', 'Your pass is already checked in.', 'warning');
                        }
                      } catch (err: any) {
                        showToast('Error', err?.message || 'Check-in failed', 'error');
                      } finally {
                        setIsCheckingIn(false);
                      }
                    }}
                    disabled={isCheckingIn}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Gate Check-In...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simulate / Check In With This Pass</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pass Verified & Checked In at Gate</span>
                  </div>
                )}

                {onOpenScanner && (
                  <button
                    onClick={onOpenScanner}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                    title="Open Camera QR Scanner"
                  >
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Open Scanner</span>
                  </button>
                )}
              </div>
            </div>

            {/* Delegate Details Grid */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {participant.photoUrl && (
                    <div className="relative shrink-0">
                      <img 
                        src={participant.photoUrl} 
                        alt={participant.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
                      />
                      {participant.faceRegistered && (
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-white" title="Face ID Biometric Enrolled">
                          <ScanFace className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Delegate Name</p>
                      {participant.faceRegistered && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Face ID Active
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{participant.name}</p>
                  </div>
                </div>
                {participant.teamName && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center justify-end gap-1">
                      <Users className="w-3 h-3 text-indigo-600" /> Team Name
                    </p>
                    <p className="text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md inline-block">
                      {participant.teamName}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-indigo-600" /> Institution
                  </p>
                  <p className="font-bold text-slate-800 mt-0.5">{participant.college}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Course & Year
                  </p>
                  <p className="font-bold text-slate-800 mt-0.5">{participant.department} ({participant.year})</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> Registered Email
                  </p>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{participant.email}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Venue / Mode
                  </p>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{hackathonVenue}</p>
                </div>
              </div>

              {/* Registered Team Members Roster */}
              {participant.teamMembers && participant.teamMembers.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> Registered Team Roster ({participant.teamMembers.length + 1} Total)
                    </p>
                  </div>

                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2">
                    {/* Leader */}
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
                      <div>
                        <span className="font-extrabold text-slate-900">{participant.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-medium">({participant.email})</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        👑 Team Lead
                      </span>
                    </div>

                    {/* Members */}
                    {participant.teamMembers.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-800">{m.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({m.email})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {m.role || 'Team Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Check-in instructions note */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-3 print:hidden">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-extrabold text-indigo-950">Entrance Scanner Note:</strong> Keep this pass saved or open on your device when arriving at the venue. Scanning speed is under 2 seconds.
              </p>
            </div>

          </div>

          {/* Ticket Barcode Strip */}
          <div className="bg-slate-900 px-6 py-3 text-slate-300 text-[10px] font-mono flex items-center justify-between border-t border-slate-800">
            <span className="tracking-wider uppercase font-bold text-indigo-400">ROSTR GATE PASS</span>
            <span className="tracking-widest opacity-80">{participant.qrToken.slice(0, 14)}...</span>
          </div>

        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
          
          <button
            onClick={() => downloadQrSvgAsPng('pass-qr-code', `${participant.participantId}_QR`)}
            className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-indigo-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download QR</span>
          </button>

          <button
            onClick={() => downloadPassAsImage(participant)}
            className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-indigo-300 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Save Pass PNG</span>
          </button>

          <button
            onClick={printParticipantPass}
            className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-indigo-300 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={handleShare}
            className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-indigo-300 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Share Pass</span>
          </button>

        </div>

      </div>

      {/* Enlarge QR Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 text-center relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <h3 className="font-extrabold text-slate-900 text-lg">Gate Pass QR Code</h3>
              <p className="text-xs text-slate-500 font-mono font-bold text-indigo-600">{participant.participantId}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG
                value={participant.qrToken}
                size={260}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Show this high-resolution QR code directly to the check-in scanner at the gate.
            </p>
          </div>
        </div>
      )}

    </motion.div>
  );
};
