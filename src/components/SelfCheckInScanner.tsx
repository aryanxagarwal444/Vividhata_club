import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  QrCode, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  Loader2, 
  Zap, 
  RefreshCw, 
  ShieldCheck,
  FileImage,
  Ticket,
  ChevronRight,
  SwitchCamera,
  Crosshair,
  Radio,
  Eye,
  Check,
  Copy,
  Maximize2,
  Scan,
  UserCheck,
  ShieldAlert,
  Smile
} from 'lucide-react';
import { Participant, ScanResult } from '../types';
import { checkInParticipantByQrOrId, checkInParticipantByFace, formatFirestoreTimestamp, markParticipantLeft } from '../lib/firebase';
import { extractFaceBiometrics } from '../lib/faceBiometrics';
import { playBeepSound } from '../lib/utils';
import { useToast } from './Toast';
import { RostrLogo } from './RostrLogo';

interface SelfCheckInScannerProps {
  onBack?: () => void;
  onViewPass?: (participant: Participant) => void;
  participants: Participant[];
}

export const SelfCheckInScanner: React.FC<SelfCheckInScannerProps> = ({
  onBack,
  onViewPass,
  participants
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'camera' | 'face_scan' | 'upload' | 'manual' | 'test'>('camera');
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualQuery, setManualQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<{ id: string; name: string; time: string; status: string; hackathon: string; method?: string }[]>([]);

  // Face Scan Specific States
  const [faceCameraActive, setFaceCameraActive] = useState(false);
  const [faceCameraFacing, setFaceCameraFacing] = useState<'user' | 'environment'>('user');
  const [autoFaceDetection, setAutoFaceDetection] = useState(true);
  const [faceScanStatusText, setFaceScanStatusText] = useState('Position face inside the biometric frame');
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<any>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'public-qr-reader-viewport';

  // Enumerate cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((deviceList) => {
        if (deviceList && deviceList.length > 0) {
          const formatted = deviceList.map((d, index) => ({
            id: d.id,
            label: d.label || `Camera ${index + 1}`
          }));
          setCameras(formatted);
          const backCam = formatted.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('environment')
          );
          const defaultCamId = backCam ? backCam.id : formatted[0].id;
          setSelectedCameraId(defaultCamId);
          if (activeTab === 'camera') {
            startScanner(defaultCamId);
          }
        } else {
          setCameraError('No camera devices detected. You can use manual entry or file upload.');
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration note:', err);
        setCameraError('Camera access not permitted or unavailable.');
      });

    return () => {
      stopScanner();
      stopFaceCamera();
    };
  }, []);

  // Robust helper to acquire camera stream with fallbacks
  const requestUserMediaStream = async (facing: 'user' | 'environment'): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera device API is not supported in this browser environment.');
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
    } catch (err: any) {
      console.warn('Ideal face camera constraints failed, trying basic facingMode:', err);
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      } catch (err2: any) {
        console.warn('Basic facingMode failed, trying unconstrained video:', err2);
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
    }
  };

  // Start QR Scanner
  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;
    setCameraError(null);

    try {
      stopFaceCamera();

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
            handleProcessCode(decodedText, 'camera_scan');
          }
        },
        () => {
          // Continuous frame decoding
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Start scanner error:', err);
      setCameraError(err.message || 'Could not start QR camera. Try manual ID check-in.');
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

  // Face Scan Camera Controls
  const startFaceCamera = async () => {
    setCameraError(null);
    try {
      await stopScanner();

      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await requestUserMediaStream(faceCameraFacing);

      faceStreamRef.current = stream;
      setFaceCameraActive(true);
      setFaceScanStatusText('Position face inside frame');

      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.play().catch(e => console.warn('Face video auto-play warning:', e));
      }
    } catch (err: any) {
      console.warn('Face camera access error:', err);
      let errorMsg = 'Unable to open biometric face camera. Check camera permissions or use 1-Click Test Passes.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied in your browser. Please allow camera in the address bar.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is in use by another tab or scanner. Please wait a moment and retry.';
      }
      setCameraError(errorMsg);
      setFaceCameraActive(false);
    }
  };

  const stopFaceCamera = () => {
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach(t => t.stop());
      faceStreamRef.current = null;
    }
    setFaceCameraActive(false);
  };

  // Keep face video element synchronized with stream
  useEffect(() => {
    if (faceVideoRef.current && faceStreamRef.current) {
      faceVideoRef.current.srcObject = faceStreamRef.current;
      faceVideoRef.current.play().catch(e => console.warn('Face video stream sync warning:', e));
    }
  }, [faceCameraActive]);

  // Handle Tab Switch Cleanup
  useEffect(() => {
    let isCancelled = false;

    const handleTabSwitch = async () => {
      if (activeTab === 'face_scan') {
        await stopScanner();
        if (!isCancelled) {
          startFaceCamera();
        }
      } else {
        stopFaceCamera();
        if (activeTab === 'camera' && selectedCameraId) {
          startScanner(selectedCameraId);
        }
      }
    };

    handleTabSwitch();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, faceCameraFacing]);

  // Process Live Face Scan
  const handlePerformFaceScan = async () => {
    if (!faceVideoRef.current || isProcessing) return;
    setIsProcessing(true);
    setFaceScanStatusText('Extracting facial feature vector...');

    try {
      const bio = await extractFaceBiometrics(faceVideoRef.current);
      setFaceScanStatusText('Matching biometric signature with attendees...');

      const result = await checkInParticipantByFace(bio.descriptor, bio.faceSnapshot, participants);
      setScanResult(result);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (result.status === 'success') {
        if (soundEnabled) playBeepSound('success');
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.6 }
        });
        showToast('Face Verified! 👤✨', `${result.participant?.name} checked in successfully.`, 'success');

        if (result.participant) {
          setRecentScans(prev => [
            {
              id: result.participant!.participantId,
              name: result.participant!.name,
              time: nowTime,
              status: 'success',
              hackathon: result.participant!.hackathonTitle || 'Event',
              method: 'Face Scan'
            },
            ...prev.slice(0, 4)
          ]);
        }
      } else if (result.status === 'duplicate') {
        if (soundEnabled) playBeepSound('duplicate');
        showToast('DUPLICATE FACE DETECTED ⚠️', `This face belongs to ${result.participant?.name}, who already checked in.`, 'warning');
      } else {
        if (soundEnabled) playBeepSound('error');
        showToast('Face Not Recognized', result.message, 'error');
      }
    } catch (err: any) {
      showToast('Face Scan Error', err?.message || 'Biometric scan failed.', 'error');
    } finally {
      setIsProcessing(false);
      setFaceScanStatusText('Position face inside frame');
    }
  };

  // Simulate Face Scan with specific attendee descriptor
  const handleSimulateFaceScan = async (participant: Participant) => {
    setIsProcessing(true);
    try {
      const descriptor = participant.faceDescriptor || [];
      const result = await checkInParticipantByFace(descriptor, participant.photoUrl, participants);
      setScanResult(result);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (result.status === 'success') {
        if (soundEnabled) playBeepSound('success');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Face Verified! 👤✨', `${participant.name} verified by biometric face ID.`, 'success');
        setRecentScans(prev => [
          {
            id: participant.participantId,
            name: participant.name,
            time: nowTime,
            status: 'success',
            hackathon: participant.hackathonTitle || 'Event',
            method: 'Face Biometric'
          },
          ...prev.slice(0, 4)
        ]);
      } else if (result.status === 'duplicate') {
        if (soundEnabled) playBeepSound('duplicate');
        showToast('DUPLICATE FACE REJECTED ⚠️', `Double entry prevented for ${participant.name}.`, 'warning');
      } else {
        if (soundEnabled) playBeepSound('error');
        showToast('Verification Failed', result.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Simulation failed.', 'error');
    } finally {
      setIsProcessing(false);
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

  // Generic QR/ID check-in processor
  const handleProcessCode = async (code: string, method: 'camera_scan' | 'manual_entry' | 'demo_scan' = 'camera_scan') => {
    if (!code.trim()) return;
    setIsProcessing(true);

    try {
      const result = await checkInParticipantByQrOrId(code.trim(), method);
      setScanResult(result);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (result.status === 'success') {
        if (soundEnabled) playBeepSound('success');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Check-In Verified! 🎉', `${result.participant?.name} checked in successfully.`, 'success');

        if (result.participant) {
          setRecentScans(prev => [
            {
              id: result.participant!.participantId,
              name: result.participant!.name,
              time: nowTime,
              status: 'success',
              hackathon: result.participant!.hackathonTitle || 'Event',
              method: 'QR Pass'
            },
            ...prev.slice(0, 4)
          ]);
        }
      } else if (result.status === 'duplicate') {
        if (soundEnabled) playBeepSound('duplicate');
        showToast('Already Checked In ⚠️', `${result.participant?.name} was previously checked in.`, 'warning');
      } else {
        if (soundEnabled) playBeepSound('error');
        showToast('Invalid QR Code ❌', result.message, 'error');
      }
    } catch (err: any) {
      showToast('Check-In Error', err?.message || 'Failed to check in.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image upload scanning
  const handleImageFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-temp-file-scanner');
      const decodedText = await html5QrCode.scanFile(file, true);
      await handleProcessCode(decodedText, 'camera_scan');
    } catch (err: any) {
      showToast('Could Not Read QR Code', 'Please ensure the image is clear and contains a valid event QR pass.', 'error');
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    handleProcessCode(manualQuery.trim(), 'manual_entry');
  };

  const resetResultAndScanAgain = () => {
    setScanResult(null);
    setManualQuery('');
    if (activeTab === 'camera' && selectedCameraId && !scannerActive) {
      startScanner(selectedCameraId);
    } else if (activeTab === 'face_scan' && !faceCameraActive) {
      startFaceCamera();
    }
  };

  const handleCheckoutCurrent = async (participantId: string) => {
    try {
      await markParticipantLeft(participantId);
      showToast('Checked Out', 'Attendee has been marked as checked out / left.', 'info');
      setScanResult(null);
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to check out.', 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Hidden element for file scanning */}
      <div id="qr-temp-file-scanner" className="hidden" />

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3">
                <RostrLogo size="md" />
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Gate Check-In & Verification
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Dual verification engine: Instant QR badge scanner + Biometric Face Recognition with anti-duplicate protection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span>{soundEnabled ? 'Chime Active' : 'Chime Muted'}</span>
            </button>
          </div>
        </div>

        {/* Scan Result Overlay / Hero Card */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl border p-6 sm:p-8 shadow-2xl relative overflow-hidden ${
                scanResult.status === 'success'
                  ? 'bg-gradient-to-b from-emerald-950/90 to-slate-900 border-emerald-500/60 text-white shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                  : scanResult.status === 'duplicate'
                  ? 'bg-gradient-to-b from-amber-950/90 to-slate-900 border-amber-500/60 text-white shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                  : 'bg-gradient-to-b from-rose-950/90 to-slate-900 border-rose-500/60 text-white shadow-[0_0_40px_rgba(244,63,94,0.2)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Status Indicator & Icon */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      scanResult.status === 'success'
                        ? 'bg-emerald-500 text-slate-950'
                        : scanResult.status === 'duplicate'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {scanResult.status === 'success' && <CheckCircle2 className="w-8 h-8" />}
                    {scanResult.status === 'duplicate' && <AlertTriangle className="w-8 h-8" />}
                    {scanResult.status === 'invalid' && <XCircle className="w-8 h-8" />}
                    {scanResult.status === 'error' && <ShieldCheck className="w-8 h-8" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
                          scanResult.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : scanResult.status === 'duplicate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        }`}
                      >
                        {scanResult.status === 'success' && (scanResult.verificationMethod === 'face' ? 'Face Verified & Checked In' : 'Gate Pass Verified')}
                        {scanResult.status === 'duplicate' && 'Duplicate Prevented / Already In'}
                        {scanResult.status === 'invalid' && 'Verification Unsuccessful'}
                        {scanResult.status === 'error' && 'Verification Error'}
                      </span>

                      {scanResult.verificationMethod === 'face' && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-500/40 flex items-center gap-1">
                          <Scan className="w-3 h-3" />
                          <span>Biometric Face ID {scanResult.faceConfidence ? `(${scanResult.faceConfidence}%)` : ''}</span>
                        </span>
                      )}

                      {scanResult.participant?.hackathonTitle && (
                        <span className="text-xs bg-slate-800/80 text-slate-300 px-3 py-0.5 rounded-full border border-slate-700">
                          {scanResult.participant.hackathonTitle}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {scanResult.participant?.name || 'Invalid Verification'}
                    </h2>

                    <p className="text-sm text-slate-300">
                      {scanResult.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {scanResult.participant && onViewPass && (
                    <button
                      onClick={() => onViewPass(scanResult.participant!)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>View Pass</span>
                    </button>
                  )}

                  {scanResult.status === 'duplicate' && scanResult.participant && (
                    <button
                      onClick={() => handleCheckoutCurrent(scanResult.participant!.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Mark as Left</span>
                    </button>
                  )}

                  <button
                    onClick={resetResultAndScanAgain}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Scan Next</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side Biometric Face Comparison (If Face Verified / Duplicate) */}
              {(scanResult.liveFaceSnapshot || scanResult.participant?.photoUrl) && (
                <div className="mt-6 pt-6 border-t border-slate-800/80 bg-slate-950/60 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Scan className="w-4 h-4 text-indigo-400" />
                      Biometric Facial Match Analysis
                    </span>
                    {scanResult.status === 'duplicate' ? (
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4" /> Duplicate Person Detected
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> 100% Identity Confirmed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Live Snapshot */}
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                        {scanResult.liveFaceSnapshot ? (
                          <img src={scanResult.liveFaceSnapshot} alt="Live Gate Face" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Camera className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Live Gate Capture</span>
                        <p className="text-xs font-bold text-white">Scanner Feed Frame</p>
                        <p className="text-[11px] text-slate-400">Captured at Gate Entrance</p>
                      </div>
                    </div>

                    {/* Registered Profile Face */}
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                        {scanResult.participant?.photoUrl ? (
                          <img src={scanResult.participant.photoUrl} alt="Registered Attendee Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Smile className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Enrolled Profile Photo</span>
                        <p className="text-xs font-bold text-white">{scanResult.participant?.name || 'Registered Attendee'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{scanResult.participant?.participantId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Participant Details Summary */}
              {scanResult.participant && (
                <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Participant ID</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm">{scanResult.participant.participantId}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Team</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {scanResult.participant.teamName || 'Solo Participant'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution</span>
                    <span className="font-bold text-slate-200 truncate block">{scanResult.participant.college}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                    <span className="font-bold text-slate-200 truncate block">{scanResult.participant.department}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code Scanner</span>
          </button>

          {/* New Face Scan Mode Tab */}
          <button
            onClick={() => setActiveTab('face_scan')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'face_scan'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scan className="w-4 h-4 text-cyan-300" />
            <span>Face Scan (Biometric)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Pass</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual ID Search</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'test'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Test Arena</span>
          </button>
        </div>

        {/* Tab 1: Live QR Code Scanner */}
        {activeTab === 'camera' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Top Viewfinder Toolbar HUD */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              
              {/* Camera Source Selector */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (scannerActive) startScanner(e.target.value);
                    }}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
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
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    title="Flip / Switch Camera"
                  >
                    <SwitchCamera className="w-4 h-4 text-indigo-400" />
                  </button>
                )}
              </div>

              {/* Status Indicator & Pause/Resume */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono">
                  {scannerActive ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-emerald-400 font-bold">QR SCANNER LIVE</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      <span className="text-slate-400 font-medium">CAMERA PAUSED</span>
                    </>
                  )}
                </div>

                {scannerActive ? (
                  <button
                    onClick={stopScanner}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => startScanner(selectedCameraId)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cyber Viewfinder Capture Stage */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[360px] flex flex-col items-center justify-center p-4 border border-slate-800 shadow-inner bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px]">
              
              {/* Single Video Viewport Container */}
              <div id={scannerContainerId} className="w-full max-w-sm overflow-hidden rounded-2xl" />

              {/* Futuristic Cyber Reticle & Scanner Frame */}
              {scannerActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                  <div className="w-60 h-60 sm:w-64 sm:h-64 rounded-2xl relative border border-indigo-500/40 animate-scanner-reticle">
                    
                    {/* Glowing Cyber L-Brackets */}
                    <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg shadow-[0_0_10px_#22d3ee]" />
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg shadow-[0_0_10px_#22d3ee]" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg shadow-[0_0_10px_#22d3ee]" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-cyan-400 rounded-br-lg shadow-[0_0_10px_#22d3ee]" />
                    
                    {/* Center Aiming Reticle Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-t border-b border-indigo-400/50 relative flex items-center justify-center">
                        <div className="h-6 w-0 border-l border-r border-indigo-400/50"></div>
                      </div>
                    </div>

                    {/* Animated High-Intensity Laser Line */}
                    <div className="absolute left-1.5 right-1.5 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline shadow-[0_0_12px_#22d3ee]" />
                    
                    {/* Floating Bottom Viewfinder Guide Pill */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                        <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                        Align attendee QR badge inside frame
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Overlay State */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 font-mono">
                    Verifying Pass Token...
                  </p>
                </div>
              )}

              {/* Standby UI */}
              {!scannerActive && !isProcessing && (
                <div className="text-center p-8 space-y-4 max-w-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mx-auto shadow-md">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">Camera Viewfinder Ready</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click below to activate live camera feed and scan tickets.
                    </p>
                  </div>
                  <button
                    onClick={() => startScanner(selectedCameraId)}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Turn On Camera</span>
                  </button>
                </div>
              )}

              {cameraError && (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs text-center max-w-md z-10">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Quick Tips Ribbon */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 px-1 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Atomic verification with instant duplicate entry prevention.
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                Target: {selectedCameraId ? 'Selected Camera' : 'Default Stream'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Biometric Face Scan Verification Stage */}
        {activeTab === 'face_scan' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Top Biometric HUD Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Biometric Face Recognition Gate</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Anti-Duplicate Guard ON
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{faceScanStatusText}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setFaceCameraFacing(prev => prev === 'user' ? 'environment' : 'user')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Switch Front/Back Camera"
                >
                  <SwitchCamera className="w-4 h-4 text-cyan-400" />
                </button>

                {faceCameraActive ? (
                  <button
                    onClick={stopFaceCamera}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={startFaceCamera}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Face Cam</span>
                  </button>
                )}
              </div>
            </div>

            {/* Biometric Video Viewport Stage */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[380px] flex flex-col items-center justify-center p-4 border border-cyan-500/20 shadow-inner bg-[radial-gradient(#0e7490_1px,transparent_1px)] [background-size:20px_20px]">
              
              {faceCameraActive ? (
                <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                  <video
                    ref={faceVideoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />

                  {/* High-Tech Biometric HUD Target Overlays */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    
                    {/* Face Oval Reticle */}
                    <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-[48%] border-2 border-dashed border-cyan-400/90 shadow-[0_0_30px_rgba(6,182,212,0.4)] relative flex items-center justify-center">
                      
                      {/* L-Corner Tech Brackets */}
                      <span className="absolute -top-2 -left-2 w-6 h-6 border-t-3 border-l-3 border-cyan-400" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 border-t-3 border-r-3 border-cyan-400" />
                      <span className="absolute -bottom-2 -left-2 w-6 h-6 border-b-3 border-l-3 border-cyan-400" />
                      <span className="absolute -bottom-2 -right-2 w-6 h-6 border-b-3 border-r-3 border-cyan-400" />

                      {/* Laser Line Scanning Up and Down Face */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-scanline shadow-[0_0_15px_#22d3ee]" />

                      {/* Central Crosshair */}
                      <div className="w-8 h-8 border border-cyan-400/40 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      </div>
                    </div>

                    {/* Dynamic HUD Instruction Pill */}
                    <div className="absolute bottom-4 bg-slate-950/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-xl">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>{faceScanStatusText}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-4 max-w-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto shadow-md">
                    <Scan className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">Biometric Face Scanner Standby</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Activate camera to verify attendee identity and prevent duplicate badge sharing.
                    </p>
                  </div>
                  <button
                    onClick={startFaceCamera}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activate Face Camera</span>
                  </button>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 font-mono">
                    Matching Facial Landmark Vectors...
                  </p>
                </div>
              )}
            </div>

            {/* Manual Verification Trigger Button */}
            {faceCameraActive && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePerformFaceScan}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  <Scan className="w-5 h-5" />
                  <span>Verify Face Identity & Check-In</span>
                </button>
              </div>
            )}

            {/* Anti-Duplicate Information Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Biometric Anti-Duplicate Engine Active</p>
                  <p className="text-[11px] text-slate-400">
                    Calculates cosine vector similarity against all registered attendee profiles. Rejects re-entries and badge sharing instantly.
                  </p>
                </div>
              </div>
              <span className="font-mono text-cyan-400 text-xs font-bold shrink-0">
                {participants.filter(p => p.faceRegistered).length} Registered Faces
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Upload / Drag & Drop Pass Image */}
        {activeTab === 'upload' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">Scan QR Pass From Image File</h3>
              <p className="text-xs text-slate-400">
                Drag & drop a pass screenshot or select an image file from your device.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleImageFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-950/40 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                  : 'border-slate-800 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <FileImage className="w-8 h-8" />
              </div>

              <p className="font-bold text-white text-base">
                Drop your QR Pass Image here, or <span className="text-indigo-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP files</p>

              {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Decoding and verifying QR pass...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Manual ID / Code Search */}
        {activeTab === 'manual' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Manual Participant Check-In Search</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the Participant ID (e.g. EVT-2026-00124), registered email, or full name.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type ID, Email or Name to check in..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualQuery.trim()}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Check-In...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Perform Instant Check-In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: 1-Click Interactive Test Arena (QR & Face ID) */}
        {activeTab === 'test' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Interactive Biometric & QR Test Arena</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Test instant check-in verification and duplicate face blocking without requiring hardware cameras.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
              {participants.slice(0, 12).map((p) => {
                const isAttended = p.attendanceStatus === 'attended';
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/80 transition-all group flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar / Face Snapshot */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Smile className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                            {p.name}
                          </span>
                          {p.faceRegistered && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                              Face ID
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{p.participantId}</p>
                        <p className="text-[11px] text-slate-500 truncate">{p.college}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isAttended
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {isAttended ? 'In Venue' : 'Pending'}
                      </span>
                    </div>

                    {/* Action Buttons: QR Scan vs Face Biometric Scan */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleProcessCode(p.participantId, 'demo_scan')}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                        title="Simulate QR Gate Pass Scan"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Test QR Scan</span>
                      </button>

                      <button
                        onClick={() => handleSimulateFaceScan(p)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-cyan-500/40 transition-colors cursor-pointer"
                        title="Simulate Face Biometric Recognition & Duplicate Detection"
                      >
                        <Scan className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAttended ? 'Test Duplicate Face' : 'Test Face Scan'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Scan Activity Stream */}
        {recentScans.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Gate Stream
              </span>
              <span className="text-[10px] text-slate-500">Last verified entries</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentScans.map((scan, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{scan.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-indigo-400">{scan.id}</span>
                        {scan.method && (
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-semibold">
                            {scan.method}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate Stats Ribbon */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Dual Gate Engine: Instant QR decoding + Biometric Face ID with zero duplicate tolerance.</span>
          </div>
          <span className="font-mono text-indigo-400 font-semibold">
            {participants.filter(p => p.attendanceStatus === 'attended').length} / {participants.length} Attendees Verified
          </span>
        </div>

      </div>
    </div>
  );
};

