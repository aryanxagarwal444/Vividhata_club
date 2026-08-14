import React, { useState } from 'react';
import { HACKATHONS, registerParticipant } from '../lib/firebase';
import { Participant, Hackathon, TeamMemberInput } from '../types';
import { useToast } from './Toast';
import { FaceBiometricCaptureModal } from './FaceBiometricCaptureModal';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap, 
  Calendar, 
  Ticket, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Users,
  Trophy,
  Layers,
  MapPin,
  Plus,
  Trash2,
  ShieldCheck,
  UserPlus,
  ScanFace,
  CheckCircle2,
  X
} from 'lucide-react';

interface RegistrationFormProps {
  selectedHackathonId?: string;
  onSuccess: (participant: Participant) => void;
  onCancel: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  selectedHackathonId = HACKATHONS[0].id, 
  onSuccess, 
  onCancel 
}) => {
  const { showToast } = useToast();

  const [chosenHackathonId, setChosenHackathonId] = useState<string>(selectedHackathonId);
  const activeHackathon: Hackathon = HACKATHONS.find(h => h.id === chosenHackathonId) || HACKATHONS[0];

  const [registrationType, setRegistrationType] = useState<'solo' | 'team'>('team');

  // Lead / Primary Participant Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    year: '3rd Year',
    teamName: '',
    notes: ''
  });

  // Additional Team Members List State (starts with 1 team member by default in team mode)
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([
    { name: '', email: '', phone: '', college: '', department: '', year: '3rd Year', role: 'Full Stack Developer' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Face Biometric ID State
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceRegistered, setFaceRegistered] = useState(false);

  // Helper to calculate max team size from hackathon metadata (e.g. "1 - 4 Members" => max 4 members total = lead + 3 members)
  const getMaxMembersCount = () => {
    const match = activeHackathon.teamSize.match(/\d+/g);
    if (match && match.length > 0) {
      const maxTotal = parseInt(match[match.length - 1], 10);
      return Math.max(1, maxTotal - 1); // minus team leader
    }
    return 3; // fallback 3 additional members
  };

  const maxAdditionalMembers = getMaxMembersCount();

  const handleAddMember = () => {
    if (teamMembers.length >= maxAdditionalMembers) {
      showToast('Maximum Limit Reached', `This hackathon allows up to ${maxAdditionalMembers + 1} total members per team.`, 'warning');
      return;
    }

    setTeamMembers([
      ...teamMembers,
      { 
        name: '', 
        email: '', 
        phone: '', 
        college: formData.college || '', 
        department: formData.department || '', 
        year: '3rd Year', 
        role: 'Developer' 
      }
    ]);
  };

  const handleRemoveMember = (index: number) => {
    const updated = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updated);
  };

  const handleMemberChange = (index: number, field: keyof TeamMemberInput, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    // Validate Lead Name
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Team leader full name must be at least 2 characters.';
    }

    // Validate Lead Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // Validate Lead Phone
    const phoneClean = formData.phone.replace(/[\s\-\+\(\)]/g, '');
    if (!phoneClean || phoneClean.length < 10) {
      errs.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    if (!formData.college.trim()) {
      errs.college = 'College/Organization name is required.';
    }

    if (!formData.department.trim()) {
      errs.department = 'Course/Department name is required.';
    }

    // Validate Team Name if in team mode
    if (registrationType === 'team') {
      if (!formData.teamName.trim() || formData.teamName.trim().length < 2) {
        errs.teamName = 'Team name is required for team registration.';
      }

      // Validate each filled team member
      teamMembers.forEach((m, idx) => {
        if (m.name.trim() || m.email.trim()) {
          if (!m.name.trim()) {
            errs[`member_name_${idx}`] = `Member ${idx + 2} name is required.`;
          }
          if (!m.email.trim() || !emailRegex.test(m.email.trim())) {
            errs[`member_email_${idx}`] = `Member ${idx + 2} email is invalid.`;
          }
        }
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Validation Error', 'Please fill in all required fields correctly.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const activeMembersToSubmit = registrationType === 'team'
        ? teamMembers.filter(m => m.name.trim() && m.email.trim())
        : [];

      const newParticipant = await registerParticipant({
        hackathonId: activeHackathon.id,
        hackathonTitle: activeHackathon.title,
        registrationType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        department: formData.department,
        year: formData.year,
        teamName: registrationType === 'team' ? formData.teamName : '',
        teamMembers: activeMembersToSubmit,
        notes: formData.notes,
        photoUrl: photoUrl || undefined,
        faceDescriptor: faceDescriptor || undefined,
        faceRegistered: faceRegistered || undefined
      });

      const memberMsg = activeMembersToSubmit.length > 0 
        ? ` Team pass generated with ${activeMembersToSubmit.length + 1} members!`
        : '';

      showToast('Registration Successful! 🎉', `Welcome ${newParticipant.name}!${memberMsg}`, 'success');
      onSuccess(newParticipant);
    } catch (err: any) {
      console.error('Registration error:', err);
      showToast('Registration Failed', err.message || 'Failed to register. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Back Button */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Hackathons</span>
        </button>

        {/* Container Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold uppercase tracking-wider w-fit">
                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hackathon Gate Portal</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Instant Delegate Pass Generation</span>
            </div>

            {/* Hackathon Selection Dropdown */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Target Hackathon Event <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-indigo-600" />
                <select
                  value={chosenHackathonId}
                  onChange={(e) => setChosenHackathonId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-xl text-slate-900 font-bold text-sm sm:text-base focus:outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                >
                  {HACKATHONS.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.mode} • Prize: {h.prizePool})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Hackathon Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-800">
                <span className="text-indigo-600 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {activeHackathon.theme}
                </span>
                <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> {activeHackathon.prizePool} Prize Pool
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1 border-t border-slate-200/80 text-[11px]">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {activeHackathon.date}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {activeHackathon.venue}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> Team Size: {activeHackathon.teamSize}</span>
              </div>
            </div>

            {/* Registration Mode Switcher: Solo vs Team */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Select Participation Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRegistrationType('team')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    registrationType === 'team'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team Registration ({activeHackathon.teamSize})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegistrationType('solo')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    registrationType === 'solo'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Solo / Individual Registration</span>
                </button>
              </div>
            </div>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Team Name Section (If Team Registration) */}
            {registrationType === 'team' && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-indigo-950 text-sm">Team Identity</h3>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded">
                    Max {maxAdditionalMembers + 1} Members
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Team Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Neural Forge / ByteCrafters"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-white border ${
                        errors.teamName ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                      } rounded-lg text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.teamName && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.teamName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Team Leader / Primary Registrant Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {registrationType === 'team' ? 'Team Leader Details (Member #1)' : 'Participant Details'}
                </h3>
                {registrationType === 'team' && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Contact</span>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  {registrationType === 'team' ? 'Team Leader Name' : 'Full Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Aryan Agarwal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                      errors.name ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                    } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="aryan@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.email ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                      } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.phone ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                      } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* College */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  College / University / Organization <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. GL Bajaj Institute of Technology"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                      errors.college ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                    } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                  />
                </div>
                {errors.college && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.college}
                  </p>
                )}
              </div>

              {/* Department & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Course / Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Computer Science & Engineering"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        errors.department ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                      } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.department && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.department}
                    </p>
                  )}
                </div>

              {/* Academic Year */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Academic Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Research Scholar / PhD">Research Scholar / PhD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Face ID Biometric Enrollment Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-purple-50/50 border border-indigo-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Face ID Biometric Enrollment</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        Optional / Fast Gate Pass
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enroll your face to check in instantly at the venue entrance without needing a printed badge or screen.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {faceRegistered && photoUrl ? (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <img 
                        src={photoUrl} 
                        alt="Face ID Preview" 
                        className="w-8 h-8 rounded-full object-cover border border-emerald-400 shadow-xs"
                      />
                      <div className="text-left">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono block">64-D Vector Ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl(null);
                          setFaceDescriptor(null);
                          setFaceRegistered(false);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove Face ID"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsFaceModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Enroll Face ID</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

            {/* Additional Team Members Section */}
            {registrationType === 'team' && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      Additional Team Members ({teamMembers.length} added)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Each team member receives their own unique QR code pass for venue gate entry.
                    </p>
                  </div>

                  {teamMembers.length < maxAdditionalMembers && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-100 shrink-0 w-fit"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Team Member #{teamMembers.length + 2}</span>
                    </button>
                  )}
                </div>

                {/* List of Member Cards */}
                <div className="space-y-4">
                  {teamMembers.map((member, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4 relative animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] flex items-center justify-center">
                            {idx + 2}
                          </span>
                          Team Member #{idx + 2}
                        </span>

                        {teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors rounded hover:bg-rose-50"
                            title="Remove team member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Member Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        
                        {/* Member Name */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Member Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Priya Sharma"
                            value={member.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            className={`w-full px-3 py-2.5 bg-white border ${
                              errors[`member_name_${idx}`] ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                            } rounded-lg text-slate-900 text-xs focus:outline-none`}
                          />
                          {errors[`member_name_${idx}`] && (
                            <p className="text-[10px] text-rose-500 mt-1">{errors[`member_name_${idx}`]}</p>
                          )}
                        </div>

                        {/* Member Email */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Member Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="priya@example.com"
                            value={member.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            className={`w-full px-3 py-2.5 bg-white border ${
                              errors[`member_email_${idx}`] ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-600'
                            } rounded-lg text-slate-900 text-xs focus:outline-none`}
                          />
                          {errors[`member_email_${idx}`] && (
                            <p className="text-[10px] text-rose-500 mt-1">{errors[`member_email_${idx}`]}</p>
                          )}
                        </div>

                        {/* Member Role / Specialty */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Team Role / Specialty
                          </label>
                          <select
                            value={member.role || 'Developer'}
                            onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="Frontend Developer">Frontend Developer</option>
                            <option value="Backend Developer">Backend Developer</option>
                            <option value="AI / ML Specialist">AI / ML Specialist</option>
                            <option value="Full Stack Developer">Full Stack Developer</option>
                            <option value="UI/UX Designer">UI/UX Designer</option>
                            <option value="Product / Pitcher">Product Manager / Pitcher</option>
                            <option value="Cyber Security Analyst">Cyber Security Analyst</option>
                          </select>
                        </div>

                        {/* Member Phone */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="+91 98112 33445"
                            value={member.phone || ''}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none"
                          />
                        </div>

                      </div>

                    </div>
                  ))}
                </div>

                {teamMembers.length < maxAdditionalMembers && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs border border-dashed border-indigo-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Another Team Member ({teamMembers.length + 1}/{maxAdditionalMembers + 1})</span>
                  </button>
                )}
              </div>
            )}

            {/* Notes / Idea Pitch */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Project Pitch / Special Notes <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of what your team plans to build or dietary/accessibility requests..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-lg font-bold text-white uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Hackathon Pass & Member QR Codes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {registrationType === 'team'
                        ? `Confirm Team Registration & Generate Passes (${teamMembers.length + 1} Members)`
                        : 'Confirm Individual Registration & Get Pass'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>

      {/* Face Biometric Enrollment Modal */}
      <FaceBiometricCaptureModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        initialPhotoUrl={photoUrl || undefined}
        onConfirm={(photo, descriptor) => {
          setPhotoUrl(photo);
          setFaceDescriptor(descriptor);
          setFaceRegistered(true);
          showToast('Face ID Enrolled! 🛡️', 'Your biometric face profile is ready for touchless gate check-in.', 'success');
        }}
      />

    </div>
  );
};
