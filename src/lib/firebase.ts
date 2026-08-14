import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Participant, CheckInLog, EventInfo, ScanResult, Hackathon, TeamMemberInput } from '../types';
import { matchFaceWithEventParticipants, generateFaceDescriptorFromSeed } from './faceBiometrics';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Explicitly specify firestore database ID from config if present
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Collection references
export const PARTICIPANTS_COL = 'participants';
export const CHECK_IN_LOGS_COL = 'checkInLogs';
export const SETTINGS_COL = 'settings';

// List of Active Hackathons
export const HACKATHONS: Hackathon[] = [
  {
    id: "ai-nexus-2026",
    title: "AI Nexus Hackathon 2026",
    tagline: "Build Autonomous Agents & Multimodal AI Applications",
    theme: "Generative AI, Agentic Workflows & Neural Systems",
    date: "October 24 - 25, 2026",
    time: "36-Hour Continuous Buildathon",
    venue: "Innovation Hub & Hybrid Virtual Arena, New Delhi",
    mode: "Hybrid",
    prizePool: "₹5,00,000",
    teamSize: "1 - 4 Members",
    description: "Join developers, AI researchers, and student creators to build frontier AI applications leveraging Gemini 1.5, autonomous agents, and RAG architectures.",
    organizer: "National AI Alliance & Tech Forum",
    totalCapacity: 800,
    bannerImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    tracks: ["Agentic AI Systems", "Multimodal Search & Synthesis", "AI for Social Good", "Edge AI & Mobile ML"],
    tags: ["AI & ML", "Generative AI", "Hybrid", "High Prize"]
  },
  {
    id: "codesprint-2026",
    title: "CodeSprint National 2026",
    tagline: "Low-Latency Systems & High-Speed Algorithmic Battle",
    theme: "Distributed Backend & Real-Time Computing",
    date: "November 07 - 08, 2026",
    time: "24-Hour Non-Stop Code Sprint",
    venue: "IIT Bombay Tech Arena, Powai, Mumbai",
    mode: "Offline",
    prizePool: "₹3,50,000",
    teamSize: "1 - 3 Members",
    description: "Compete against top competitive programmers and software engineers. Architect fast microservices, high-frequency algorithms, and fault-tolerant streaming engines.",
    organizer: "Computer Society of India & IIT Bombay",
    totalCapacity: 500,
    bannerImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    tracks: ["Low-Latency Microservices", "High-Throughput Streaming", "WebAssembly & Rust", "Algorithmic Speed Run"],
    tags: ["Competitive Coding", "Full Stack", "Offline", "Fast-Paced"]
  },
  {
    id: "greentech-hack",
    title: "GreenTech & Climate Hackathon",
    tagline: "Engineering Tech for Sustainable Clean Energy & Carbon Offset",
    theme: "Climate Tech, Circular Economy & Clean Energy",
    date: "November 21 - 22, 2026",
    time: "48-Hour Global Online Hackathon",
    venue: "Global Virtual Developer Hub",
    mode: "Online",
    prizePool: "₹4,00,000",
    teamSize: "2 - 5 Members",
    description: "Develop IoT software, smart grid managers, carbon offset calculators, and AI algorithms for renewable energy optimization.",
    organizer: "EcoTech Global Foundation & Energy Council",
    totalCapacity: 1200,
    bannerImage: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80",
    tracks: ["Carbon Analytics & Offset", "EV & Smart Grid Infrastructure", "Sustainable Agriculture", "Circular Plastics"],
    tags: ["CleanTech", "Sustainability", "Online", "Global"]
  },
  {
    id: "cyberpulse-hack",
    title: "CyberPulse Security Buildathon",
    tagline: "Zero-Trust Architecture & Threat Detection Arena",
    theme: "Cybersecurity, Cryptography & Threat Intelligence",
    date: "December 05 - 06, 2026",
    time: "30-Hour Live Hacking & Defense",
    venue: "IIIT Hyderabad Cyber Center & Online",
    mode: "Hybrid",
    prizePool: "₹6,00,000",
    teamSize: "1 - 4 Members",
    description: "Engineer intrusion detection tools, cryptographic proof systems, malware analysis models, and cloud security compliance automation.",
    organizer: "Cyber Defense Alliance & IIIT Hyderabad",
    totalCapacity: 600,
    bannerImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    tracks: ["Zero-Trust Network Access", "AI Threat Intelligence", "Quantum-Safe Cryptography", "Cloud Security Automation"],
    tags: ["Cyber Security", "Cryptography", "Hybrid", "High Bounty"]
  },
  {
    id: "healthtech-2026",
    title: "HealthTech Innovation Hack 2026",
    tagline: "Medical AI Diagnostics & Smart Healthcare Systems",
    theme: "Digital Health, Remote Diagnostics & Patient Care",
    date: "December 19 - 20, 2026",
    time: "36-Hour MedTech Challenge",
    venue: "AIIMS Innovation Complex, New Delhi",
    mode: "Hybrid",
    prizePool: "₹4,50,000",
    teamSize: "2 - 4 Members",
    description: "Build clinical AI diagnostic assistants, wearable bio-sensor software, electronic record sync tools, and telemedicine apps.",
    organizer: "National Health Innovation Mission",
    totalCapacity: 750,
    bannerImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    tracks: ["AI Medical Image Analysis", "EHR Interoperability", "Wearable Bio-Sensors", "Mental Health Digital Tools"],
    tags: ["HealthTech", "AI Diagnostics", "MedTech", "Hybrid"]
  }
];

// Backward Compatibility Default Event Information
export const DEFAULT_EVENT_INFO: EventInfo = {
  title: HACKATHONS[0].title,
  tagline: HACKATHONS[0].tagline,
  date: HACKATHONS[0].date,
  time: HACKATHONS[0].time,
  venue: HACKATHONS[0].venue,
  description: HACKATHONS[0].description,
  organizer: HACKATHONS[0].organizer,
  totalCapacity: HACKATHONS[0].totalCapacity,
  bannerImage: HACKATHONS[0].bannerImage
};

// --- Firestore Database Helpers ---

export function generateParticipantId(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `EVT-2026-${randomDigits}`;
}

export function generateQrToken(participantId: string): string {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${participantId}-QR-${randomString}`;
}

export function formatFirestoreTimestamp(ts: any): string {
  if (!ts) return 'N/A';
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  if (ts?.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  if (ts instanceof Date) {
    return ts.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  return String(ts);
}

// Fetch all participants
export async function getParticipants(): Promise<Participant[]> {
  const q = query(collection(db, PARTICIPANTS_COL));
  const snap = await getDocs(q);
  const list: Participant[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as Participant);
  });
  return list;
}

// Register Participant or Team for a selected Hackathon
export async function registerParticipant(data: {
  hackathonId: string;
  hackathonTitle: string;
  registrationType?: 'solo' | 'team';
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  teamName?: string;
  teamRole?: string;
  teamMembers?: TeamMemberInput[];
  notes?: string;
  photoUrl?: string;
  faceDescriptor?: number[];
  faceRegistered?: boolean;
}): Promise<Participant> {
  const emailClean = data.email.trim().toLowerCase();
  const isTeam = data.registrationType === 'team';

  // 1. Check for existing registration in the SAME hackathon for Lead/Individual
  const participantsRef = collection(db, PARTICIPANTS_COL);
  const q = query(
    participantsRef, 
    where('email', '==', emailClean),
    where('hackathonId', '==', data.hackathonId)
  );
  const querySnap = await getDocs(q);

  if (!querySnap.empty) {
    const existingDoc = querySnap.docs[0];
    const existingData = existingDoc.data() as Participant;
    throw new Error(`Email "${emailClean}" is already registered for "${data.hackathonTitle}" with Participant ID ${existingData.participantId}.`);
  }

  // 2. Validate and check uniqueness for each additional team member email
  const cleanedMembers: TeamMemberInput[] = [];
  if (isTeam && data.teamMembers && data.teamMembers.length > 0) {
    for (const member of data.teamMembers) {
      if (!member.name.trim() || !member.email.trim()) continue;
      const memberEmail = member.email.trim().toLowerCase();

      // Check if team member email is already registered in this hackathon
      const memQ = query(
        participantsRef,
        where('email', '==', memberEmail),
        where('hackathonId', '==', data.hackathonId)
      );
      const memSnap = await getDocs(memQ);
      if (!memSnap.empty) {
        throw new Error(`Team member email "${memberEmail}" is already registered for "${data.hackathonTitle}".`);
      }

      cleanedMembers.push({
        name: member.name.trim(),
        email: memberEmail,
        phone: member.phone?.trim() || '',
        college: member.college?.trim() || data.college.trim(),
        department: member.department?.trim() || data.department.trim(),
        year: member.year?.trim() || data.year.trim(),
        role: member.role?.trim() || 'Team Member'
      });
    }
  }

  // 3. Build unique IDs for Primary registrant / Team Leader
  const participantId = generateParticipantId();
  const qrToken = generateQrToken(participantId);
  const docRef = doc(participantsRef, participantId);

  const finalMembersWithIds: TeamMemberInput[] = [];

  // Register each team member as individual participant record for individual gate check-ins
  for (const member of cleanedMembers) {
    const memParticipantId = generateParticipantId();
    const memQrToken = generateQrToken(memParticipantId);
    const memDocRef = doc(participantsRef, memParticipantId);

    const memberRecord: Omit<Participant, 'id'> = {
      participantId: memParticipantId,
      hackathonId: data.hackathonId,
      hackathonTitle: data.hackathonTitle,
      registrationType: 'team',
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      college: member.college || data.college.trim(),
      department: member.department || data.department.trim(),
      year: member.year || data.year.trim(),
      teamName: data.teamName?.trim() || 'Team',
      teamRole: member.role || 'Team Member',
      isTeamLeader: false,
      qrToken: memQrToken,
      registeredAt: serverTimestamp(),
      attendanceStatus: 'not_attended',
      checkedInAt: null,
      notes: `Registered under Team: ${data.teamName?.trim()} (Lead: ${data.name.trim()})`,
      photoUrl: '',
      faceRegistered: false
    };

    await setDoc(memDocRef, memberRecord);

    finalMembersWithIds.push({
      ...member,
      participantId: memParticipantId
    });
  }

  const faceDescriptorToSave = data.faceDescriptor && data.faceDescriptor.length > 0
    ? data.faceDescriptor
    : (data.photoUrl ? generateFaceDescriptorFromSeed(`${participantId}-${data.photoUrl}`) : undefined);

  const newParticipant: Omit<Participant, 'id'> = {
    participantId,
    hackathonId: data.hackathonId,
    hackathonTitle: data.hackathonTitle,
    registrationType: isTeam ? 'team' : 'solo',
    name: data.name.trim(),
    email: emailClean,
    phone: data.phone.trim(),
    college: data.college.trim(),
    department: data.department.trim(),
    year: data.year.trim(),
    teamName: isTeam ? (data.teamName?.trim() || 'Team') : (data.teamName?.trim() || ''),
    teamRole: isTeam ? 'Team Lead' : 'Individual Participant',
    isTeamLeader: isTeam,
    teamMembers: finalMembersWithIds,
    qrToken,
    registeredAt: serverTimestamp(),
    attendanceStatus: 'not_attended',
    checkedInAt: null,
    notes: data.notes || '',
    photoUrl: data.photoUrl || '',
    faceDescriptor: faceDescriptorToSave,
    faceRegistered: Boolean(data.photoUrl || (data.faceDescriptor && data.faceDescriptor.length > 0)),
    faceRegisteredAt: data.photoUrl ? serverTimestamp() : null
  };

  await setDoc(docRef, newParticipant);

  return {
    id: participantId,
    ...newParticipant,
    registeredAt: new Date()
  };
}

// Update or enroll face biometric ID for an existing participant
export async function updateParticipantFace(
  participantDocId: string, 
  photoUrl: string, 
  faceDescriptor: number[]
): Promise<void> {
  const docRef = doc(db, PARTICIPANTS_COL, participantDocId);
  await updateDoc(docRef, {
    photoUrl,
    faceDescriptor,
    faceRegistered: true,
    faceRegisteredAt: serverTimestamp()
  });
}

// Lookup Participant by Participant ID or Email or QR Token
export async function findParticipant(searchQuery: string): Promise<Participant | null> {
  const queryClean = searchQuery.trim();
  if (!queryClean) return null;

  const participantsRef = collection(db, PARTICIPANTS_COL);

  // Direct doc lookup by ID
  const docSnap = await getDoc(doc(participantsRef, queryClean));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Participant;
  }

  // Lookup by QR Token
  const qQr = query(participantsRef, where('qrToken', '==', queryClean));
  const qrSnap = await getDocs(qQr);
  if (!qrSnap.empty) {
    const d = qrSnap.docs[0];
    return { id: d.id, ...d.data() } as Participant;
  }

  // Lookup by Email
  const qEmail = query(participantsRef, where('email', '==', queryClean.toLowerCase()));
  const emailSnap = await getDocs(qEmail);
  if (!emailSnap.empty) {
    const d = emailSnap.docs[0];
    return { id: d.id, ...d.data() } as Participant;
  }

  // Lookup by Participant ID field
  const qPartId = query(participantsRef, where('participantId', '==', queryClean.toUpperCase()));
  const partIdSnap = await getDocs(qPartId);
  if (!partIdSnap.empty) {
    const d = partIdSnap.docs[0];
    return { id: d.id, ...d.data() } as Participant;
  }

  return null;
}

// Atomic Check-In Function with Guaranteed Duplicate Check-In Prevention
export async function checkInParticipantByQrOrId(
  scannedCode: string, 
  method: 'camera_scan' | 'manual_entry' | 'demo_scan' = 'camera_scan'
): Promise<ScanResult> {
  const codeClean = scannedCode.trim();
  if (!codeClean) {
    return { status: 'invalid', message: 'Empty QR code scanned.' };
  }

  try {
    const foundParticipant = await findParticipant(codeClean);

    if (!foundParticipant) {
      return {
        status: 'invalid',
        message: 'Invalid QR Code. This code does not belong to any registered hackathon participant.'
      };
    }

    const docRef = doc(db, PARTICIPANTS_COL, foundParticipant.id);

    const result = await runTransaction(db, async (transaction) => {
      const pDoc = await transaction.get(docRef);
      if (!pDoc.exists()) {
        throw new Error('Participant record not found.');
      }

      const pData = pDoc.data() as Participant;

      // Duplicate Check
      if (pData.attendanceStatus === 'attended') {
        return {
          isDuplicate: true,
          participant: { id: pDoc.id, ...pData },
          firstCheckInTime: formatFirestoreTimestamp(pData.checkedInAt)
        };
      }

      // Mark as Attended
      const checkInTime = serverTimestamp();
      transaction.update(docRef, {
        attendanceStatus: 'attended',
        checkedInAt: checkInTime
      });

      // Add to Check-In Activity Log
      const logRef = doc(collection(db, CHECK_IN_LOGS_COL));
      transaction.set(logRef, {
        participantId: pData.participantId,
        participantName: pData.name,
        hackathonId: pData.hackathonId || HACKATHONS[0].id,
        hackathonTitle: pData.hackathonTitle || HACKATHONS[0].title,
        college: pData.college,
        department: pData.department,
        timestamp: checkInTime,
        status: 'attended',
        method
      });

      return {
        isDuplicate: false,
        participant: { 
          id: pDoc.id, 
          ...pData, 
          attendanceStatus: 'attended' as const, 
          checkedInAt: new Date() 
        }
      };
    });

    if (result.isDuplicate) {
      return {
        status: 'duplicate',
        participant: result.participant,
        message: `Already Checked In for ${result.participant.hackathonTitle || 'Hackathon'}! ${result.participant.name} checked in at ${result.firstCheckInTime}.`,
        previousCheckInTime: result.firstCheckInTime
      };
    }

    return {
      status: 'success',
      participant: result.participant,
      message: `Check-in Successful! ${result.participant.name} is checked into ${result.participant.hackathonTitle || 'the hackathon'}.`,
      timestamp: new Date(),
      verificationMethod: 'qr'
    };
  } catch (err: any) {
    console.error('Check-in error:', err);
    return {
      status: 'error',
      message: err.message || 'An unexpected error occurred during check-in.',
      verificationMethod: 'qr'
    };
  }
}

// Biometric Face Check-In with Real-Time Face Recognition & Duplicate Face Prevention
export async function checkInParticipantByFace(
  liveDescriptor: number[],
  capturedFaceSnapshot?: string,
  cachedParticipants?: Participant[]
): Promise<ScanResult> {
  if (!liveDescriptor || liveDescriptor.length === 0) {
    return {
      status: 'invalid',
      message: 'No facial biometric features detected. Please align your face inside the scanner frame.',
      verificationMethod: 'face',
      liveFaceSnapshot: capturedFaceSnapshot
    };
  }

  try {
    // 1. Get participant list for biometric matching
    let pool = cachedParticipants;
    if (!pool || pool.length === 0) {
      pool = await getParticipants();
    }

    if (pool.length === 0) {
      return {
        status: 'invalid',
        message: 'No registered participants found in the system to verify face against.',
        verificationMethod: 'face',
        liveFaceSnapshot: capturedFaceSnapshot
      };
    }

    // 2. Perform Biometric Match
    const match = matchFaceWithEventParticipants(liveDescriptor, pool, 0.68);

    if (!match.isMatch || !match.participant) {
      return {
        status: 'invalid',
        message: 'Face Not Recognized. No registered attendee matches this facial profile (Confidence: ' + match.confidencePercent + '%). Please verify with QR Code or register.',
        verificationMethod: 'face',
        faceConfidence: match.confidencePercent,
        liveFaceSnapshot: capturedFaceSnapshot
      };
    }

    const matchedParticipant = match.participant;
    const docRef = doc(db, PARTICIPANTS_COL, matchedParticipant.id);

    // 3. Atomic Database Verification & Duplicate Entry Guard
    const result = await runTransaction(db, async (transaction) => {
      const pDoc = await transaction.get(docRef);
      if (!pDoc.exists()) {
        throw new Error('Attendee record could not be found.');
      }

      const pData = pDoc.data() as Participant;

      // Duplicate Check-In Gate
      if (pData.attendanceStatus === 'attended') {
        return {
          isDuplicate: true,
          participant: { id: pDoc.id, ...pData },
          firstCheckInTime: formatFirestoreTimestamp(pData.checkedInAt)
        };
      }

      const checkInTime = serverTimestamp();
      transaction.update(docRef, {
        attendanceStatus: 'attended',
        checkedInAt: checkInTime
      });

      // Add Check-In Log with biometric tag
      const logRef = doc(collection(db, CHECK_IN_LOGS_COL));
      transaction.set(logRef, {
        participantId: pData.participantId,
        participantName: pData.name,
        hackathonId: pData.hackathonId || HACKATHONS[0].id,
        hackathonTitle: pData.hackathonTitle || HACKATHONS[0].title,
        college: pData.college,
        department: pData.department,
        timestamp: checkInTime,
        status: 'attended',
        method: 'face_scan',
        faceConfidence: match.confidencePercent
      });

      return {
        isDuplicate: false,
        participant: {
          id: pDoc.id,
          ...pData,
          attendanceStatus: 'attended' as const,
          checkedInAt: new Date()
        }
      };
    });

    if (result.isDuplicate) {
      return {
        status: 'duplicate',
        participant: result.participant,
        message: `DUPLICATE FACE DETECTED ⚠️! ${result.participant.name} is already checked in (Checked in at: ${result.firstCheckInTime}). Double entry prevented.`,
        previousCheckInTime: result.firstCheckInTime,
        verificationMethod: 'face',
        faceConfidence: match.confidencePercent,
        liveFaceSnapshot: capturedFaceSnapshot
      };
    }

    return {
      status: 'success',
      participant: result.participant,
      message: `Face Verified & Checked In! Identity matched for ${result.participant.name} (${match.confidencePercent}% confidence).`,
      timestamp: new Date(),
      verificationMethod: 'face',
      faceConfidence: match.confidencePercent,
      liveFaceSnapshot: capturedFaceSnapshot
    };
  } catch (err: any) {
    console.error('Face check-in error:', err);
    return {
      status: 'error',
      message: err.message || 'An error occurred during facial verification check-in.',
      verificationMethod: 'face',
      liveFaceSnapshot: capturedFaceSnapshot
    };
  }
}

// Reset Attendance for a Participant
export async function resetAttendance(participantId: string): Promise<void> {
  const docRef = doc(db, PARTICIPANTS_COL, participantId);
  await updateDoc(docRef, {
    attendanceStatus: 'not_attended',
    checkedInAt: null
  });
}

// Mark a Participant as Left / Checked Out
export async function markParticipantLeft(participantId: string): Promise<void> {
  const docRef = doc(db, PARTICIPANTS_COL, participantId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const pData = snap.data() as Participant;

  const now = serverTimestamp();
  await updateDoc(docRef, {
    attendanceStatus: 'left',
  });

  // Add checkout log
  await addDoc(collection(db, CHECK_IN_LOGS_COL), {
    participantId: pData.participantId,
    participantName: pData.name,
    hackathonId: pData.hackathonId || HACKATHONS[0].id,
    hackathonTitle: pData.hackathonTitle || HACKATHONS[0].title,
    college: pData.college,
    department: pData.department,
    timestamp: now,
    status: 'attended',
    method: 'manual_checkout'
  });
}

// Mark a Participant as Attended manually
export async function markParticipantAttended(participantId: string): Promise<void> {
  const docRef = doc(db, PARTICIPANTS_COL, participantId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const pData = snap.data() as Participant;

  const now = serverTimestamp();
  await updateDoc(docRef, {
    attendanceStatus: 'attended',
    checkedInAt: now
  });

  // Add checkin log
  await addDoc(collection(db, CHECK_IN_LOGS_COL), {
    participantId: pData.participantId,
    participantName: pData.name,
    hackathonId: pData.hackathonId || HACKATHONS[0].id,
    hackathonTitle: pData.hackathonTitle || HACKATHONS[0].title,
    college: pData.college,
    department: pData.department,
    timestamp: now,
    status: 'attended',
    method: 'manual_entry'
  });
}

// Delete Participant Record
export async function deleteParticipantDoc(participantId: string): Promise<void> {
  const docRef = doc(db, PARTICIPANTS_COL, participantId);
  await deleteDoc(docRef);
}

// Listen to all participants in real time
export function subscribeParticipants(callback: (participants: Participant[]) => void) {
  const q = query(collection(db, PARTICIPANTS_COL));
  return onSnapshot(q, (snapshot) => {
    const list: Participant[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Participant);
    });
    list.sort((a, b) => {
      const tA = a.registeredAt?.seconds ? a.registeredAt.seconds * 1000 : new Date(a.registeredAt || 0).getTime();
      const tB = b.registeredAt?.seconds ? b.registeredAt.seconds * 1000 : new Date(b.registeredAt || 0).getTime();
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    console.error('Participants listener error:', err);
    handleFirestoreError(err, OperationType.GET, PARTICIPANTS_COL);
  });
}

// Listen to recent Check-In Activity Logs in real time
export function subscribeCheckInLogs(callback: (logs: CheckInLog[]) => void, limitCount = 20) {
  const q = query(
    collection(db, CHECK_IN_LOGS_COL),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot) => {
    const list: CheckInLog[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as CheckInLog);
    });
    callback(list);
  }, (err) => {
    console.error('CheckInLogs listener error:', err);
    handleFirestoreError(err, OperationType.GET, CHECK_IN_LOGS_COL);
  });
}

// Seed Demo Data with multi-hackathon mappings and face biometrics
export async function seedDemoData(): Promise<number> {
  const demoParticipants = [
    {
      participantId: "EVT-2026-00124",
      hackathonId: "ai-nexus-2026",
      hackathonTitle: "AI Nexus Hackathon 2026",
      name: "Aryan Agarwal",
      email: "aryan.agarwal@glbajaj.edu",
      phone: "+91 98765 43210",
      college: "GL Bajaj Institute of Technology",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      teamName: "Neural Forge",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 240,
      minutesAgoCheckIn: 45,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00125",
      hackathonId: "ai-nexus-2026",
      hackathonTitle: "AI Nexus Hackathon 2026",
      name: "Priya Sharma",
      email: "priya.sharma@iitd.ac.in",
      phone: "+91 98112 33445",
      college: "IIT Delhi",
      department: "Electrical Engineering",
      year: "4th Year",
      teamName: "AgentX",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 300,
      minutesAgoCheckIn: 30,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00126",
      hackathonId: "codesprint-2026",
      hackathonTitle: "CodeSprint National 2026",
      name: "Rahul Verma",
      email: "rahul.v@dtu.ac.in",
      phone: "+91 99887 76655",
      college: "Delhi Technological University",
      department: "Information Technology",
      year: "2nd Year",
      teamName: "Byte Crafters",
      attendanceStatus: "not_attended" as const,
      minutesAgoReg: 180,
      minutesAgoCheckIn: null,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00127",
      hackathonId: "ai-nexus-2026",
      hackathonTitle: "AI Nexus Hackathon 2026",
      name: "Ananya Patel",
      email: "ananya.patel@nsut.ac.in",
      phone: "+91 97654 32109",
      college: "Netaji Subhas University of Technology",
      department: "AI & Data Science",
      year: "3rd Year",
      teamName: "Deep Vision",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 150,
      minutesAgoCheckIn: 15,
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00128",
      hackathonId: "greentech-hack",
      hackathonTitle: "GreenTech & Climate Hackathon",
      name: "Rohan Das",
      email: "rohan.das@amity.edu",
      phone: "+91 91234 56789",
      college: "Amity University Noida",
      department: "Mechanical Engineering",
      year: "1st Year",
      teamName: "EcoGrid",
      attendanceStatus: "not_attended" as const,
      minutesAgoReg: 120,
      minutesAgoCheckIn: null,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00129",
      hackathonId: "cyberpulse-hack",
      hackathonTitle: "CyberPulse Security Buildathon",
      name: "Sneha Reddy",
      email: "sneha.reddy@bits.ac.in",
      phone: "+91 93456 78901",
      college: "BITS Pilani",
      department: "Computer Science",
      year: "4th Year",
      teamName: "ZeroTrust Guild",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 360,
      minutesAgoCheckIn: 60,
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00130",
      hackathonId: "healthtech-2026",
      hackathonTitle: "HealthTech Innovation Hack 2026",
      name: "Vikram Malhotra",
      email: "vikram.m@jiit.ac.in",
      phone: "+91 98990 11223",
      college: "Jaypee Institute of Information Tech",
      department: "Electronics & Communication",
      year: "2nd Year",
      teamName: "BioPulse AI",
      attendanceStatus: "not_attended" as const,
      minutesAgoReg: 90,
      minutesAgoCheckIn: null,
      photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00131",
      hackathonId: "codesprint-2026",
      hackathonTitle: "CodeSprint National 2026",
      name: "Kavya Nair",
      email: "kavya.nair@dtu.ac.in",
      phone: "+91 97111 22334",
      college: "Delhi Technological University",
      department: "Software Engineering",
      year: "3rd Year",
      teamName: "Kernel Panic",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 210,
      minutesAgoCheckIn: 10,
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00132",
      hackathonId: "cyberpulse-hack",
      hackathonTitle: "CyberPulse Security Buildathon",
      name: "Aman Gupta",
      email: "aman.gupta@galgotias.edu",
      phone: "+91 98777 66554",
      college: "Galgotias University",
      department: "Cyber Security",
      year: "2nd Year",
      teamName: "ShadowGuard",
      attendanceStatus: "not_attended" as const,
      minutesAgoReg: 70,
      minutesAgoCheckIn: null,
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
    },
    {
      participantId: "EVT-2026-00133",
      hackathonId: "ai-nexus-2026",
      hackathonTitle: "AI Nexus Hackathon 2026",
      name: "Divya Kapoor",
      email: "divya.k@glbajaj.edu",
      phone: "+91 96543 21890",
      college: "GL Bajaj Institute of Technology",
      department: "Information Technology",
      year: "3rd Year",
      teamName: "SynthAI",
      attendanceStatus: "attended" as const,
      minutesAgoReg: 400,
      minutesAgoCheckIn: 90,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
    }
  ];

  let addedCount = 0;
  const now = Date.now();

  for (const item of demoParticipants) {
    const docRef = doc(db, PARTICIPANTS_COL, item.participantId);
    const existingSnap = await getDoc(docRef);

    if (!existingSnap.exists()) {
      const regTime = new Date(now - item.minutesAgoReg * 60 * 1000);
      const checkInTime = item.minutesAgoCheckIn ? new Date(now - item.minutesAgoCheckIn * 60 * 1000) : null;
      const qrToken = `${item.participantId}-QR-PASS`;
      const faceDescriptor = generateFaceDescriptorFromSeed(`${item.participantId}-${item.photoUrl}`);

      const pData: Omit<Participant, 'id'> = {
        participantId: item.participantId,
        hackathonId: item.hackathonId,
        hackathonTitle: item.hackathonTitle,
        name: item.name,
        email: item.email,
        phone: item.phone,
        college: item.college,
        department: item.department,
        year: item.year,
        teamName: item.teamName,
        qrToken: qrToken,
        registeredAt: Timestamp.fromDate(regTime),
        attendanceStatus: item.attendanceStatus,
        checkedInAt: checkInTime ? Timestamp.fromDate(checkInTime) : null,
        notes: "Demo seed participant with registered Face ID biometrics",
        photoUrl: item.photoUrl,
        faceDescriptor: faceDescriptor,
        faceRegistered: true,
        faceRegisteredAt: Timestamp.fromDate(regTime)
      };

      await setDoc(docRef, pData);
      addedCount++;

      if (item.attendanceStatus === 'attended' && checkInTime) {
        const logRef = doc(collection(db, CHECK_IN_LOGS_COL));
        await setDoc(logRef, {
          participantId: item.participantId,
          participantName: item.name,
          hackathonId: item.hackathonId,
          hackathonTitle: item.hackathonTitle,
          college: item.college,
          department: item.department,
          timestamp: Timestamp.fromDate(checkInTime),
          status: 'attended',
          method: 'camera_scan'
        });
      }
    }
  }

  return addedCount;
}

// Clear All Data
export async function clearAllParticipantsData(): Promise<void> {
  const pSnap = await getDocs(collection(db, PARTICIPANTS_COL));
  for (const d of pSnap.docs) {
    await deleteDoc(doc(db, PARTICIPANTS_COL, d.id));
  }
  const lSnap = await getDocs(collection(db, CHECK_IN_LOGS_COL));
  for (const d of lSnap.docs) {
    await deleteDoc(doc(db, CHECK_IN_LOGS_COL, d.id));
  }
}
