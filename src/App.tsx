import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeParticipants, subscribeCheckInLogs, seedDemoData, HACKATHONS } from './lib/firebase';
import { Participant, CheckInLog, NotificationItem } from './types';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EventLanding } from './components/EventLanding';
import { RegistrationForm } from './components/RegistrationForm';
import { ParticipantPass } from './components/ParticipantPass';
import { PassLookupModal } from './components/PassLookupModal';
import { InfoModal, InfoModalTab } from './components/InfoModal';
import { AdminLogin } from './components/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardOverview } from './components/admin/DashboardOverview';
import { QrScanner } from './components/admin/QrScanner';
import { ParticipantsList } from './components/admin/ParticipantsList';
import { TeamsView } from './components/admin/TeamsView';
import { ParticipantDetailModal } from './components/admin/ParticipantDetailModal';
import { AnalyticsView } from './components/admin/AnalyticsView';
import { SettingsView } from './components/admin/SettingsView';
import { NotificationCenter } from './components/NotificationCenter';
import { SelfCheckInScanner } from './components/SelfCheckInScanner';
import { exportParticipantsToCsv } from './lib/utils';

// Synthesize pleasant chime using Web Audio API
function playChime(type: 'join' | 'leave' | 'registration' = 'join') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'join') {
      // Pleasant rising major third chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.1);
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (type === 'leave') {
      // Gentle descending chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.3); // A4

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Upbeat registration chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {
    // Ignore audio context errors if not permitted yet
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<
    'landing' | 'register' | 'pass' | 'scan-checkin' | 'admin-login' | 'admin-dashboard'
  >('landing');

  const [adminTab, setAdminTab] = useState<'overview' | 'scanner' | 'participants' | 'teams' | 'analytics' | 'settings'>('overview');

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isNewPass, setIsNewPass] = useState(false);
  const [selectedHackathonForReg, setSelectedHackathonForReg] = useState<string>(HACKATHONS[0].id);

  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab>('about');
  const [detailModalParticipant, setDetailModalParticipant] = useState<Participant | null>(null);
  
  // Notification State
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sound_enabled') !== 'false';
  });
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [clearedNotificationIds, setClearedNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cleared_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const prevLogsLengthRef = useRef<number>(0);
  const prevParticipantsLengthRef = useRef<number>(0);

  const handleOpenInfoModal = (tab: InfoModalTab) => {
    setInfoModalTab(tab);
    setInfoModalOpen(true);
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Subscribe to Firebase Auth and sessionStorage demo admin
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminAuthenticated(true);
      } else {
        const demoAuth = sessionStorage.getItem('admin_authenticated');
        setIsAdminAuthenticated(demoAuth === 'true');
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to Firestore Participants & CheckInLogs in Real-time
  useEffect(() => {
    const unsubParticipants = subscribeParticipants((list) => {
      setParticipants(list);
      // Play chime if new participant registered after initial load
      if (prevParticipantsLengthRef.current > 0 && list.length > prevParticipantsLengthRef.current && soundEnabled) {
        playChime('registration');
      }
      prevParticipantsLengthRef.current = list.length;

      // If collection is completely empty, auto-seed demo data once for instant demonstration
      if (list.length === 0) {
        seedDemoData().catch(console.error);
      }
    });

    const unsubLogs = subscribeCheckInLogs((logs) => {
      setCheckInLogs(logs);
      // Play chime if new log came in after initial load
      if (prevLogsLengthRef.current > 0 && logs.length > prevLogsLengthRef.current && soundEnabled) {
        const latest = logs[0];
        if (latest?.method === 'manual_checkout') {
          playChime('leave');
        } else {
          playChime('join');
        }
      }
      prevLogsLengthRef.current = logs.length;
    });

    return () => {
      unsubParticipants();
      unsubLogs();
    };
  }, [soundEnabled]);

  // Derive unified notifications stream
  const notifications: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = [];

    // Map logs to notifications
    checkInLogs.forEach((log) => {
      const isLeave = log.method === 'manual_checkout';
      const participant = participants.find((p) => p.participantId === log.participantId || p.id === log.participantId);
      const teamName = participant?.teamName;
      const ts = log.timestamp?.seconds 
        ? new Date(log.timestamp.seconds * 1000).toISOString()
        : new Date(log.timestamp || Date.now()).toISOString();

      const notifId = `log-${log.id}`;
      if (clearedNotificationIds.has(notifId)) return;

      if (isLeave) {
        items.push({
          id: notifId,
          type: 'leave',
          title: `${log.participantName} Checked Out / Left`,
          message: `${log.participantName} (${log.participantId}) has departed from the venue.${teamName ? ` Member of team "${teamName}".` : ''}`,
          timestamp: ts,
          participantId: participant?.id || log.participantId,
          participantName: log.participantName,
          teamName: teamName,
          hackathonTitle: log.hackathonTitle || participant?.hackathonTitle,
          read: readNotificationIds.has(notifId)
        });
      } else {
        items.push({
          id: notifId,
          type: 'join',
          title: `${log.participantName} Joined (On-Site)`,
          message: `${log.participantName} from ${log.college} checked in via ${log.method === 'camera_scan' ? 'QR Scanner' : 'On-Site Desk'}.${teamName ? ` Team: "${teamName}".` : ''}`,
          timestamp: ts,
          participantId: participant?.id || log.participantId,
          participantName: log.participantName,
          teamName: teamName,
          hackathonTitle: log.hackathonTitle || participant?.hackathonTitle,
          read: readNotificationIds.has(notifId)
        });
      }
    });

    // Map recent registrations
    participants.slice(0, 15).forEach((p) => {
      const notifId = `reg-${p.id}`;
      if (clearedNotificationIds.has(notifId)) return;

      const ts = p.registeredAt?.seconds 
        ? new Date(p.registeredAt.seconds * 1000).toISOString()
        : new Date(p.registeredAt || Date.now()).toISOString();

      items.push({
        id: notifId,
        type: 'registration',
        title: `New Registration: ${p.name}`,
        message: `${p.name} enrolled for "${p.hackathonTitle || 'Hackathon'}". College: ${p.college}.${p.teamName ? ` Team: "${p.teamName}".` : ''}`,
        timestamp: ts,
        participantId: p.id,
        participantName: p.name,
        teamName: p.teamName,
        hackathonTitle: p.hackathonTitle,
        read: readNotificationIds.has(notifId)
      });
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [checkInLogs, participants, readNotificationIds, clearedNotificationIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem('read_notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      localStorage.setItem('read_notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleClearAll = () => {
    setClearedNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      localStorage.setItem('cleared_notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('sound_enabled', next.toString());
      return next;
    });
  };

  // Count participants per hackathon
  const participantsByHackathon = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      if (p.hackathonId) {
        counts[p.hackathonId] = (counts[p.hackathonId] || 0) + 1;
      }
    });
    return counts;
  }, [participants]);

  // Update selected participant state if Firestore data updates
  useEffect(() => {
    if (selectedParticipant) {
      const updated = participants.find(p => p.id === selectedParticipant.id);
      if (updated) setSelectedParticipant(updated);
    }
    if (detailModalParticipant) {
      const updated = participants.find(p => p.id === detailModalParticipant.id);
      if (updated) setDetailModalParticipant(updated);
    }
  }, [participants]);

  const handleRegistrationSuccess = (newParticipant: Participant) => {
    setSelectedParticipant(newParticipant);
    setIsNewPass(true);
    setCurrentView('pass');
  };

  const handleAdminLogout = () => {
    auth.signOut();
    sessionStorage.removeItem('admin_authenticated');
    setIsAdminAuthenticated(false);
    setCurrentView('landing');
  };

  const attendedCount = participants.filter(p => p.attendanceStatus === 'attended').length;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        
        {/* Navigation Bar for Public View */}
        {currentView !== 'admin-dashboard' && (
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            participantCount={participants.length}
            openLookupModal={() => setLookupModalOpen(true)}
            isAdmin={isAdminAuthenticated}
            unreadNotificationsCount={unreadCount}
            onOpenNotifications={() => setNotificationCenterOpen(true)}
          />
        )}

        {/* View Router */}
        <div className="flex-1">
          {currentView === 'landing' && (
            <EventLanding
              setCurrentView={setCurrentView}
              participantCount={participants.length}
              openLookupModal={() => setLookupModalOpen(true)}
              onSelectHackathonToRegister={(hId) => setSelectedHackathonForReg(hId)}
              participantsByHackathon={participantsByHackathon}
              onOpenNotifications={() => setNotificationCenterOpen(true)}
            />
          )}

          {currentView === 'register' && (
            <RegistrationForm
              selectedHackathonId={selectedHackathonForReg}
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'pass' && selectedParticipant && (
            <ParticipantPass
              participant={selectedParticipant}
              onBack={() => {
                setIsNewPass(false);
                setCurrentView('landing');
              }}
              isNewRegistration={isNewPass}
              onOpenScanner={() => setCurrentView('scan-checkin')}
            />
          )}

          {currentView === 'scan-checkin' && (
            <SelfCheckInScanner
              participants={participants}
              onBack={() => setCurrentView('landing')}
              onViewPass={(p) => {
                setSelectedParticipant(p);
                setIsNewPass(false);
                setCurrentView('pass');
              }}
            />
          )}

          {currentView === 'admin-login' && (
            <AdminLogin
              onSuccess={() => setCurrentView('admin-dashboard')}
              onCancel={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'admin-dashboard' && (
            <AdminLayout
              activeTab={adminTab}
              setActiveTab={setAdminTab}
              onLogout={handleAdminLogout}
              onExitAdmin={() => setCurrentView('landing')}
              attendedCount={attendedCount}
              totalCount={participants.length}
              unreadNotificationsCount={unreadCount}
              onOpenNotifications={() => setNotificationCenterOpen(true)}
            >
              {adminTab === 'overview' && (
                <DashboardOverview
                  participants={participants}
                  checkInLogs={checkInLogs}
                  setActiveTab={setAdminTab}
                  onManualCheckIn={() => setAdminTab('participants')}
                  onExportCsv={() => exportParticipantsToCsv(participants)}
                />
              )}

              {adminTab === 'scanner' && (
                <QrScanner />
              )}

              {adminTab === 'participants' && (
                <ParticipantsList
                  participants={participants}
                  onSelectParticipant={(p) => setDetailModalParticipant(p)}
                  onNavigateToTeams={() => setAdminTab('teams')}
                />
              )}

              {adminTab === 'teams' && (
                <TeamsView
                  participants={participants}
                  onSelectParticipant={(p) => setDetailModalParticipant(p)}
                />
              )}

              {adminTab === 'analytics' && (
                <AnalyticsView participants={participants} />
              )}

              {adminTab === 'settings' && (
                <SettingsView participants={participants} />
              )}
            </AdminLayout>
          )}
        </div>

        {/* Public Footer */}
        {currentView !== 'admin-dashboard' && (
          <Footer setCurrentView={setCurrentView} openInfoModal={handleOpenInfoModal} />
        )}

        {/* Notification Center Drawer */}
        <NotificationCenter
          isOpen={notificationCenterOpen}
          onClose={() => setNotificationCenterOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
          onMarkAsRead={handleMarkAsRead}
          onSelectParticipant={(p) => {
            setNotificationCenterOpen(false);
            if (isAdminAuthenticated) {
              setDetailModalParticipant(p);
            } else {
              setSelectedParticipant(p);
              setIsNewPass(false);
              setCurrentView('pass');
            }
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          participants={participants}
        />

        {/* Info & Legal Modal */}
        <InfoModal
          isOpen={infoModalOpen}
          initialTab={infoModalTab}
          onClose={() => setInfoModalOpen(false)}
        />

        {/* Pass Lookup Modal */}
        <PassLookupModal
          isOpen={lookupModalOpen}
          onClose={() => setLookupModalOpen(false)}
          onFound={(p) => {
            setSelectedParticipant(p);
            setIsNewPass(false);
            setCurrentView('pass');
          }}
        />

        {/* Admin Participant Detail Modal */}
        <ParticipantDetailModal
          participant={detailModalParticipant}
          onClose={() => setDetailModalParticipant(null)}
        />

      </div>
    </ToastProvider>
  );
}

