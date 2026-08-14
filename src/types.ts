export type AttendanceStatus = 'not_attended' | 'attended' | 'left';

export interface Hackathon {
  id: string;
  title: string;
  tagline: string;
  theme: string;
  date: string;
  time: string;
  venue: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  prizePool: string;
  teamSize: string;
  description: string;
  organizer: string;
  totalCapacity: number;
  bannerImage: string;
  tracks: string[];
  tags: string[];
}

export interface TeamMemberInput {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  role?: string;
  participantId?: string;
}

export interface Participant {
  id: string; // Firestore doc ID
  participantId: string; // EVT-2026-XXXXX
  hackathonId: string; // e.g. "ai-nexus-2026"
  hackathonTitle: string; // e.g. "AI Nexus Hackathon 2026"
  registrationType?: 'solo' | 'team';
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  teamName?: string;
  teamRole?: string; // e.g. "Team Lead", "Member"
  isTeamLeader?: boolean;
  teamMembers?: TeamMemberInput[];
  qrToken: string; // Unique secure token (e.g. EVT-2026-00124-SEC)
  registeredAt: any; // Timestamp or ISO string
  attendanceStatus: AttendanceStatus;
  checkedInAt?: any | null; // Timestamp or ISO string
  notes?: string;
  photoUrl?: string; // Facial avatar / biometric photo
  faceDescriptor?: number[]; // Extracted 64-D biometric vector for face verification
  faceRegistered?: boolean; // Whether face ID biometric is enrolled
  faceRegisteredAt?: any; // Biometric enrollment timestamp
}

export interface CheckInLog {
  id: string;
  participantId: string;
  participantName: string;
  hackathonId?: string;
  hackathonTitle?: string;
  college: string;
  department?: string;
  timestamp: any;
  status: 'attended' | 'duplicate_attempt' | 'left';
  method?: 'camera_scan' | 'face_scan' | 'manual_entry' | 'manual_checkout' | 'demo_scan';
  faceConfidence?: number;
}

export interface EventInfo {
  title: string;
  tagline: string;
  date: string; // e.g. "October 24, 2026"
  time: string; // e.g. "09:00 AM - 05:00 PM"
  venue: string; // e.g. "Grand Auditorium, Innovation Hub, Tech City"
  description: string;
  organizer: string;
  totalCapacity: number;
  bannerImage: string;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ScanResult {
  status: 'success' | 'duplicate' | 'invalid' | 'error';
  participant?: Participant;
  message: string;
  timestamp?: string | Date;
  previousCheckInTime?: string | Date;
  verificationMethod?: 'qr' | 'face' | 'manual';
  faceConfidence?: number;
  liveFaceSnapshot?: string;
}

export interface NotificationItem {
  id: string;
  type: 'join' | 'leave' | 'registration';
  title: string;
  message: string;
  timestamp: string;
  participantId?: string;
  participantName?: string;
  teamName?: string;
  hackathonTitle?: string;
  read: boolean;
}

