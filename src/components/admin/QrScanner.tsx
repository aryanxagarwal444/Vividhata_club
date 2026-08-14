import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { checkInParticipantByQrOrId, formatFirestoreTimestamp, getParticipants } from '../../lib/firebase';
import { ScanResult, Participant } from '../../types';
import { playBeepSound } from '../../lib/utils';
import { useToast } from '../Toast';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Loader2, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Layers,
  Users,
  Zap,
  RefreshCw,
  SwitchCamera,
  Crosshair,
  Radio,
  ShieldCheck
} from 'lucide-react';

export const QrScanner: React.FC = () => {
  const { showToast } = useToast();
  
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [demoParticipants, setDemoParticipants] = useState<Participant[]>([]);
  const [recentGateScans, setRecentGateScans] = useState<{ id: string; name: string; time: string; status: string }[]>([]);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-viewport';

  // Get available camera devices & load demo participants for quick test
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((deviceList) => {
        if (deviceList && deviceList.length > 0) {
          const formatted = deviceList.map((d, index) => ({
            id: d.id,
            label: d.label || `Camera ${index + 1}`
          }));
          setCameras(formatted);
          const backCam = formatted.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          const defaultId = backCam ? backCam.id : formatted[0].id;
          setSelectedCameraId(defaultId);
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration notice:', err);
      });

    // Fetch registered participants for quick demo test check-ins
    getParticipants().then(list => setDemoParticipants(list.slice(0, 6))).catch(() => {});

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;

    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15
        },
        async (decodedText) => {
          if (!isProcessing) {
            handleQrCodeScanned(decodedText);
          }
        },
        () => {
          // Ignore frame scan failures
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Start scanner error:', err);
      showToast('Camera Notice', 'Could not start camera. You can use Manual Check-In or Demo Test scan below.', 'warning');
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
      } catch (e) {
        // Ignore stop error
      }
      setScannerActive(false);
    }
  };

  const handleFlipCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    if (scannerActive) {
      startScanner(nextCam.id);
    }
  };

  // Process scanned code
  const handleQrCodeScanned = async (code: string) => {
    setIsProcessing(true);
    
    // Perform atomic transaction check-in
    const result = await checkInParticipantByQrOrId(code, 'camera_scan');
    setScanResult(result);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (result.status === 'success') {
      if (soundEnabled) playBeepSound('success');
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
      showToast('Check-In Successful! ✅', `${result.participant?.name} checked in for ${result.participant?.hackathonTitle || 'Hackathon'}.`, 'success');

      if (result.participant) {
        setRecentGateScans(prev => [
          {
            id: result.participant!.participantId,
            name: result.participant!.name,
            time: nowTime,
            status: 'success'
          },
          ...prev.slice(0, 3)
        ]);
      }
    } else if (result.status === 'duplicate') {
      if (soundEnabled) playBeepSound('duplicate');
      showToast('Already Checked In ⚠️', `${result.participant?.name} was previously checked in.`, 'warning');
    } else {
      if (soundEnabled) playBeepSound('error');
      showToast('Invalid QR Code ❌', result.message, 'error');
    }

    setIsProcessing(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsProcessing(true);
    const result = await checkInParticipantByQrOrId(manualCode.trim(), 'manual_entry');
    setScanResult(result);

    if (result.status === 'success') {
      if (soundEnabled) playBeepSound('success');
      confetti({ particleCount: 70, spread: 70 });
      showToast('Check-In Successful! ✅', `${result.participant?.name} checked in.`, 'success');
    } else if (result.status === 'duplicate') {
      if (soundEnabled) playBeepSound('duplicate');
      showToast('Already Checked In ⚠️', `${result.participant?.name} was previously checked in.`, 'warning');
    } else {
      if (soundEnabled) playBeepSound('error');
      showToast('Invalid Code ❌', result.message, 'error');
    }

    setIsProcessing(false);
  };

  // Quick Demo Test Trigger
  const triggerDemoScan = async (participantIdOrQr: string) => {
    setIsProcessing(true);
    const result = await checkInParticipantByQrOrId(participantIdOrQr, 'demo_scan');
    setScanResult(result);

    if (result.status === 'success') {
      if (soundEnabled) playBeepSound('success');
      confetti({ particleCount: 80, spread: 75, origin: { y: 0.5 } });
      showToast('Check-In Verified! ✅', `${result.participant?.name} checked in successfully.`, 'success');
    } else if (result.status === 'duplicate') {
      if (soundEnabled) playBeepSound('duplicate');
      showToast('Duplicate Check-In ⚠️', `${result.participant?.name} was already verified earlier!`, 'warning');
    } else {
      if (soundEnabled) playBeepSound('error');
      showToast('Scan Error ❌', result.message, 'error');
    }
    setIsProcessing(false);
  };

  const resetResultAndContinue = () => {
    setScanResult(null);
    setManualCode('');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Camera className="w-6 h-6" />
            </span>
            Gate QR Code Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Point camera at attendee QR pass for sub-2s gate verification and real-time attendance syncing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs font-bold shadow-2xs cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-rose-600" />}
            <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Scanner Viewport Section (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
          
          {/* Top Camera Toolbar HUD */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (scannerActive) startScanner(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer font-bold"
                >
                  {cameras.length === 0 ? (
                    <option value="">Integrated Camera</option>
                  ) : (
                    cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        📷 {c.label}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>

              {cameras.length > 1 && (
                <button
                  onClick={handleFlipCamera}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Flip / Switch Camera"
                >
                  <SwitchCamera className="w-4 h-4 text-indigo-600" />
                </button>
              )}
            </div>

            {scannerActive ? (
              <button
                onClick={stopScanner}
                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-extrabold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => startScanner(selectedCameraId)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}
          </div>

          {/* Redesigned High-Tech Viewfinder Stage */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[340px] flex flex-col items-center justify-center p-4 border border-slate-800 shadow-inner bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            
            <div id={scannerContainerId} className="w-full max-w-sm overflow-hidden rounded-xl"></div>

            {/* Single Crisp Cyber Reticle Frame Overlay */}
            {scannerActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                <div className="w-56 h-56 sm:w-60 sm:h-60 border border-indigo-500/40 rounded-2xl relative animate-scanner-reticle">
                  {/* Cyber Corner brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg shadow-[0_0_8px_#22d3ee]" />
                  
                  {/* Center Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-t border-b border-indigo-400/40 relative flex items-center justify-center">
                      <div className="h-5 w-0 border-l border-r border-indigo-400/40"></div>
                    </div>
                  </div>

                  {/* Animated High-Intensity Laser Line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline shadow-[0_0_10px_#22d3ee]" />
                
                  {/* Viewfinder Guidance Pill */}
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-cyan-300 flex items-center gap-1 backdrop-blur-md">
                      <Crosshair className="w-3 h-3 text-cyan-400" />
                      Align attendee QR pass
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Standby UI */}
            {!scannerActive && (
              <div className="text-center p-6 space-y-4 text-white z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mx-auto shadow-md">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-base">Gate Camera Ready</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Click "Start Camera" above to activate the live scanner.
                  </p>
                </div>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Turn On Camera</span>
                </button>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs font-bold font-mono text-indigo-300">Checking Pass Validity...</p>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Manual Check-In Entry
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Paste Participant ID (e.g. EVT-2026-00101) or QR token..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
              </button>
            </form>
          </div>

          {/* Quick Demo Test Scan Buttons */}
          {demoParticipants.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 1-Click Demo Scan Testing
                </p>
                <span className="text-[10px] text-slate-400">Instant simulate</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {demoParticipants.map((dp) => (
                  <button
                    key={dp.id}
                    onClick={() => triggerDemoScan(dp.participantId)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{dp.name}</span>
                    <span className="font-mono text-[10px] text-indigo-600 font-bold">({dp.participantId})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Scan Result Display Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {scanResult ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl border shadow-md space-y-6 ${
                scanResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950'
                  : scanResult.status === 'duplicate'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-950'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-950'
              }`}
            >
              
              {/* Result Icon Header */}
              <div className="text-center space-y-2 border-b border-slate-200/60 pb-5">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-sm mx-auto ${
                  scanResult.status === 'success' ? 'bg-emerald-600 text-white' :
                  scanResult.status === 'duplicate' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {scanResult.status === 'success' && <CheckCircle2 className="w-10 h-10" />}
                  {scanResult.status === 'duplicate' && <AlertTriangle className="w-10 h-10" />}
                  {scanResult.status === 'invalid' && <XCircle className="w-10 h-10" />}
                </div>

                <h3 className="text-xl font-black tracking-tight">
                  {scanResult.status === 'success' && 'Gate Pass Validated! ✅'}
                  {scanResult.status === 'duplicate' && 'Duplicate Scan Warning ⚠️'}
                  {scanResult.status === 'invalid' && 'Invalid QR Pass ❌'}
                </h3>
              </div>

              {/* Participant Details Card */}
              {scanResult.participant ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 text-slate-800 text-xs space-y-3 shadow-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Participant Name</p>
                    <p className="text-lg font-black text-slate-900">{scanResult.participant.name}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-extrabold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" /> Hackathon Event
                    </p>
                    <p className="font-black text-indigo-950 text-sm">
                      {scanResult.participant.hackathonTitle || 'Hackathon Event'}
                    </p>
                    {scanResult.participant.teamName && (
                      <p className="text-[11px] text-indigo-700 font-extrabold flex items-center gap-1 pt-0.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" /> Team: {scanResult.participant.teamName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Participant ID</p>
                      <p className="font-mono text-indigo-600 font-extrabold text-xs">{scanResult.participant.participantId}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Institution</p>
                      <p className="font-bold text-slate-800 truncate">{scanResult.participant.college}</p>
                    </div>
                  </div>

                  {scanResult.status === 'duplicate' && scanResult.previousCheckInTime && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-900 text-xs space-y-1">
                      <p className="font-extrabold flex items-center gap-1 text-amber-950">
                        <ShieldAlert className="w-4 h-4 text-amber-600" /> Duplicate Check-In Blocked:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Already verified at: <strong>{formatFirestoreTimestamp(scanResult.previousCheckInTime)}</strong>. Duplicate entry recorded in audit logs.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-rose-200 text-xs text-rose-800 shadow-xs font-semibold">
                  <p>{scanResult.message}</p>
                </div>
              )}

              <button
                onClick={resetResultAndContinue}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ready For Next Pass</span>
              </button>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Awaiting QR Scan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Scanned ticket details, participant credentials, and verification status will display here in real-time.
                </p>
              </div>
            </div>
          )}

          {/* Live Recent Gate Entries */}
          {recentGateScans.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  Recent Gate Check-Ins
                </span>
                <span className="text-[10px] text-slate-400">Live stream</span>
              </div>
              <div className="space-y-2">
                {recentGateScans.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{s.name}</span>
                        <span className="font-mono text-[10px] text-indigo-600">{s.id}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
