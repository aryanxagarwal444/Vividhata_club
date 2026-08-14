import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Info, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  QrCode, 
  Lock, 
  Users,
  Trophy
} from 'lucide-react';
import { RostrLogo } from './RostrLogo';

export type InfoModalTab = 'about' | 'terms' | 'privacy' | 'faq';

interface InfoModalProps {
  isOpen: boolean;
  initialTab?: InfoModalTab;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  initialTab = 'about',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(initialTab);

  // Sync tab when initialTab changes on open
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <RostrLogo size="md" />
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Rostr 2026</h2>
                <p className="text-xs text-slate-500 font-medium">Platform Information & Compliance</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-3 border-b-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'about'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-3 border-b-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'terms'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Terms & Conditions</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-3 border-b-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'privacy'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-3 border-b-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ & Help</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            
            {/* ABOUT US TAB */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Empowering Developers & Hackathons
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    About Rostr 2026
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Rostr 2026 is India's leading digital event check-in and QR attendance infrastructure built specifically for developer summits, competitive hackathons, and technology buildathons.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Sub-2 Second Gate Verification</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Instant camera scanning with atomic duplicate check-in prevention ensures frictionless entry for thousands of delegates.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Multi-Hackathon Ecosystem</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Hosts premier hackathons including AI Nexus, CodeSprint National, GreenTech Climate Hack, and CyberPulse Security.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Team Roster Synchronization</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Individual pass generation for both team leads and registered team members with instant offline/online QR passes.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Real-time Analytics Engine</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Live Firestore streaming analytics allow organizers to monitor check-in rates, college participation, and venue capacity.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 space-y-1">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-900">Organizer Alliance</h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Organized by the <strong>National AI Alliance & Tech Forum</strong> in collaboration with premier educational institutions including IIT Bombay, IIIT Hyderabad, and AIIMS.
                  </p>
                </div>
              </div>
            )}

            {/* TERMS & CONDITIONS TAB */}
            {activeTab === 'terms' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Terms & Conditions (TnC)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Last updated: August 2026</p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">1. Gate Pass Authenticity & Non-Transferability</h4>
                    <p className="leading-relaxed">
                      Each QR Gate Pass issued by Rostr 2026 is uniquely linked to a registered participant ID and token. Gate passes are strictly non-transferable without prior written permission from the event organizers. Attempting to check in with a pass belonging to another individual will invalidate entry.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">2. Event Code of Conduct</h4>
                    <p className="leading-relaxed">
                      All hackathon participants, team members, and mentors must abide by standard professional conduct. Harassment, unauthorized access to restricted venue areas, plagiarism, or malicious activity will result in immediate disqualification and pass revocation.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">3. Intellectual Property Ownership</h4>
                    <p className="leading-relaxed">
                      Participants retain 100% ownership of all source code, design assets, and intellectual property developed during the hackathon events. Event sponsors and organizers do not claim ownership over projects unless explicitly agreed upon in writing.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">4. QR Scanning & Venue Verification</h4>
                    <p className="leading-relaxed">
                      By registering for Rostr 2026, participants consent to having their digital pass scanned at venue entry points for safety, headcount verification, and attendance logging.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY POLICY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Privacy & Data Protection Policy
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Commitment to Delegate Privacy & Security</p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">1. Information We Collect</h4>
                    <p className="leading-relaxed">
                      We collect basic registration details necessary for event coordination, including full name, institutional email address, phone number, college/university name, department, and team member names.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">2. How Your Data Is Used</h4>
                    <p className="leading-relaxed">
                      Your information is exclusively used to generate your digital QR Gate Pass, verify attendance upon arrival, send important hackathon schedule announcements, and issue digital certificates of participation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-xs block text-emerald-900">Zero Data Monetization Guarantee</strong>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        We NEVER sell, rent, or trade participant personal data to third-party ad networks or marketing agencies.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">3. Security & Cloud Infrastructure</h4>
                    <p className="leading-relaxed">
                      All registration data is stored in Firebase Firestore with end-to-end transport encryption and strict security rules preventing unauthorized public read access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ TAB */}
            {activeTab === 'faq' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Frequently Asked Questions (FAQ)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quick answers to common event questions</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      How do I access my gate pass if I lost the tab?
                    </h4>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      Click <strong>"Find My Pass"</strong> in the top navigation bar or footer, then enter your registered email address or Participant ID (e.g. EVT-2026-00124) to retrieve your QR pass instantly.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      Does every team member get an individual QR pass?
                    </h4>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      Yes! When a team leader registers, individual QR gate passes are generated for each team member listed in the roster, allowing independent check-in at the venue.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      Is internet required at the venue gate for check-in?
                    </h4>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      You can save your QR pass as an image or PDF beforehand. The event volunteer scanners handle verification seamlessly.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-xs text-indigo-950">Have another question?</p>
                      <p className="text-xs text-indigo-700">Contact our event operations team directly.</p>
                    </div>
                    <a
                      href="mailto:support@rostr.app"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Support</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">© 2026 Rostr Platform. All rights reserved.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
