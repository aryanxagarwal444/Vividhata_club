import React, { useState, useEffect, useRef } from 'react';
import { HACKATHONS } from '../lib/firebase';
import { Hackathon } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Ticket, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Sparkles,
  Trophy,
  Filter,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowDown,
  MousePointer,
  Zap,
  ShieldCheck,
  Flame,
  Globe,
  Bell,
  Camera,
  Award,
  Compass,
  Check
} from 'lucide-react';
import { RostrLogo } from './RostrLogo';

interface EventLandingProps {
  setCurrentView: (view: string) => void;
  participantCount: number;
  openLookupModal: () => void;
  onSelectHackathonToRegister?: (hackathonId: string) => void;
  participantsByHackathon?: Record<string, number>;
  onOpenNotifications?: () => void;
}

export const EventLanding: React.FC<EventLandingProps> = ({
  setCurrentView,
  participantCount,
  openLookupModal,
  onSelectHackathonToRegister,
  participantsByHackathon = {},
  onOpenNotifications
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Hybrid' | 'Online' | 'Offline'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalHackathon, setActiveModalHackathon] = useState<Hackathon | null>(null);

  // Hero Slideshow State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Edge Auto-Scroll State & Mouse Proximity Tracking
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [isNearEdge, setIsNearEdge] = useState(false);
  const mousePosRef = useRef<{ y: number | null }>({ y: null });
  const directoryRef = useRef<HTMLDivElement | null>(null);

  // Slideshow interval
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HACKATHONS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Smooth Continuous Pointer Proximity Edge Auto-Scrolling
  useEffect(() => {
    if (!autoScrollEnabled) {
      setIsNearEdge(false);
      return;
    }

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mousePosRef.current.y = null;
      setIsNearEdge(false);
    };

    const scrollLoop = () => {
      const mouseY = mousePosRef.current.y;
      if (mouseY !== null) {
        const windowHeight = window.innerHeight;
        const edgeZone = 80;

        let speed = 0;

        if (mouseY > windowHeight - edgeZone) {
          const depth = (mouseY - (windowHeight - edgeZone)) / edgeZone;
          speed = Math.min(12, Math.pow(depth, 1.5) * 12);
        } else if (mouseY < edgeZone && window.scrollY > 0) {
          const depth = (edgeZone - mouseY) / edgeZone;
          speed = -Math.min(12, Math.pow(depth, 1.5) * 12);
        }

        if (Math.abs(speed) > 0.4) {
          window.scrollBy({ top: speed, behavior: 'auto' });
          setIsNearEdge(true);
        } else {
          setIsNearEdge(false);
        }
      } else {
        setIsNearEdge(false);
      }

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [autoScrollEnabled]);

  const activeSlide = HACKATHONS[currentSlideIndex];

  // Filter hackathons
  const filteredHackathons = HACKATHONS.filter(h => {
    const matchesCategory = selectedCategory === 'All' || h.mode === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      h.title.toLowerCase().includes(query) ||
      h.theme.toLowerCase().includes(query) ||
      h.organizer.toLowerCase().includes(query) ||
      h.tracks.some(t => t.toLowerCase().includes(query)) ||
      h.tags.some(tg => tg.toLowerCase().includes(query));
    
    return matchesCategory && matchesSearch;
  });

  const handleParticipate = (hackathonId: string) => {
    if (onSelectHackathonToRegister) {
      onSelectHackathonToRegister(hackathonId);
    }
    setCurrentView('register');
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HACKATHONS.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HACKATHONS.length) % HACKATHONS.length);
  };

  const scrollToDirectory = () => {
    directoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white relative">
      
      {/* Refined Hero Section: Clear, Focused & High Impact */}
      <section className="relative bg-slate-950 text-white pt-10 pb-16 overflow-hidden border-b border-slate-800">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          
          {/* Main Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rostr 2026 National Hackathon Arena</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Build the Future. <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Compete & Get Instant QR Passes.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Explore national buildathons, generate verifiable attendee passes with cryptographic QR codes, and experience sub-second gate check-ins.
            </p>

            {/* Clear Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={scrollToDirectory}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Challenges</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView('scan-checkin')}
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Venue QR Check-In</span>
              </button>

              <button
                onClick={openLookupModal}
                className="px-4 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Find My Pass</span>
              </button>
            </div>

          </div>

          {/* Unified 4-Metric Glass Ribbon (Replaces Cluttered Hero Widgets) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg">
            
            <div className="flex items-center gap-3.5 px-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white block">₹24,50,000</span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Prize Pool</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 border-l-0 sm:border-l border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white block">&lt; 2 Seconds</span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">QR Gate Scanning</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 border-l-0 md:border-l border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-300 flex items-center gap-1.5">
                  {participantCount}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Live Delegates</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 border-l-0 sm:border-l border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white block">Hybrid & On-Site</span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Global Participation</span>
              </div>
            </div>

          </div>

          {/* Interactive Featured Challenge Showcase Carousel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Featured Challenges</span>
              </div>

              {/* Carousel Indicators & Play/Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <button onClick={handlePrevSlide} className="text-slate-400 hover:text-white cursor-pointer p-0.5">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
                    {currentSlideIndex + 1} / {HACKATHONS.length}
                  </span>
                  <button onClick={handleNextSlide} className="text-slate-400 hover:text-white cursor-pointer p-0.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
              <div className="relative h-[340px] sm:h-[380px] w-full overflow-hidden">
                <img 
                  key={activeSlide.id}
                  src={activeSlide.bannerImage} 
                  alt={activeSlide.title}
                  className="w-full h-full object-cover animate-fade-in transition-all duration-500"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        activeSlide.mode === 'Hybrid' ? 'bg-purple-600 text-white' :
                        activeSlide.mode === 'Online' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {activeSlide.mode} Format
                      </span>
                      <span className="text-xs text-indigo-300 font-bold">{activeSlide.organizer}</span>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{activeSlide.prizePool}</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xl">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                      {activeSlide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
                      {activeSlide.tagline}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {activeSlide.date.split(',')[0]}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {activeSlide.venue}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {activeSlide.teamSize}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleParticipate(activeSlide.id)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Register Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveModalHackathon(activeSlide)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
                      >
                        Overview
                      </button>
                    </div>

                    <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                      Event: {activeSlide.date.split(',')[0]}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trust & Sponsor Strip */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-widest text-[10px] font-bold text-slate-400">
              Trusted by 120+ Premier Colleges & Tech Ecosystems:
            </span>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 opacity-75 font-bold tracking-tight text-slate-700">
              <span className="hover:text-indigo-600 transition-colors">IIT Bombay</span>
              <span className="hover:text-indigo-600 transition-colors">NIT Karnataka</span>
              <span className="hover:text-indigo-600 transition-colors">BITS Pilani</span>
              <span className="hover:text-indigo-600 transition-colors">IIIT Hyderabad</span>
              <span className="hover:text-indigo-600 transition-colors">RVCE Bangalore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Search & Category Filter Toolbar */}
      <section ref={directoryRef} className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by track, AI, Web3, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Segment Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {(['All', 'Hybrid', 'Online', 'Offline'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'All Formats' : cat}
                </button>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* Active Hackathons Directory Grid */}
      <section className="py-10 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore Active Hackathons</h2>
              <p className="text-xs text-slate-500 font-medium">Select a challenge to submit your delegate or team registration.</p>
            </div>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {filteredHackathons.length} Challenges
            </span>
          </div>

          {filteredHackathons.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No hackathons match your search</h3>
              <p className="text-xs text-slate-500">Try searching for keywords like "AI", "Cloud", or reset filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wider cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.map(hackathon => {
                const registeredCount = participantsByHackathon[hackathon.id] || 0;

                return (
                  <div 
                    key={hackathon.id}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                  >
                    
                    {/* Header Banner Image */}
                    <div className="relative h-44 overflow-hidden bg-slate-900">
                      <img 
                        src={hackathon.bannerImage} 
                        alt={hackathon.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      
                      {/* Mode Badge */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                          hackathon.mode === 'Hybrid' ? 'bg-indigo-600 text-white' :
                          hackathon.mode === 'Online' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                        }`}>
                          {hackathon.mode}
                        </span>
                      </div>

                      {/* Prize Pool Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                          <Trophy className="w-3 h-3" />
                          <span>{hackathon.prizePool}</span>
                        </span>
                      </div>

                      {/* Title on Banner */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 truncate">
                          {hackathon.organizer}
                        </p>
                        <h3 className="font-black text-base sm:text-lg leading-snug line-clamp-1">
                          {hackathon.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Theme Tagline */}
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {hackathon.tagline}
                      </p>

                      {/* Key Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{hackathon.date.split(',')[0]}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{hackathon.teamSize}</span>
                        </div>

                        <div className="col-span-2 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{hackathon.venue}</span>
                        </div>
                      </div>

                      {/* Tracks Pills */}
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tracks</p>
                        <div className="flex flex-wrap gap-1">
                          {hackathon.tracks.slice(0, 3).map((track, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                            >
                              {track}
                            </span>
                          ))}
                          {hackathon.tracks.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold px-1">
                              +{hackathon.tracks.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500 font-medium">
                          <strong className="text-slate-900 font-bold">{registeredCount}</strong> registered
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveModalHackathon(hackathon)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleParticipate(hackathon.id)}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          >
                            <span>Register</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* On-Site Gate Check-In Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-white mt-8">
            <div className="flex items-center gap-4">
              <RostrLogo size="lg" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Fast-Track Gate Entry</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">Live Gate Active</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">Present on Venue? Scan Your QR Pass to Enter</h3>
                <p className="text-xs text-slate-400">
                  Instant camera or screenshot scan for instant check-in confirmation and attendance verification.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('scan-checkin')}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Launch QR Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Simple 3-Step Flow
            </span>
            <h2 className="text-2xl font-black text-slate-900">How Rostr Event Entry Works</h2>
            <p className="text-xs text-slate-500">From registration to gate verification in under 60 seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Select Your Challenge</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse through tracks in Artificial Intelligence, Web3, Cloud Infrastructure, or Open Innovation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Receive Delegate QR Pass</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get an instant downloadable holographic pass card embedded with your unique cryptographically signed QR token.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Scan at Gate & Hack</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Show your pass at the entrance or virtual desk for sub-2s automated verification and live notification logging.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Floating Pointer Edge Auto-Scroll Floating Control Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
          className={`px-3.5 py-2 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md ${
            autoScrollEnabled
              ? isNearEdge
                ? 'bg-indigo-600 text-white border-indigo-500 animate-bounce'
                : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
          }`}
          title="Toggle cursor edge auto-scrolling"
        >
          <MousePointer className={`w-3.5 h-3.5 ${autoScrollEnabled ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline text-[11px]">
            {autoScrollEnabled ? 'Edge Scroll Active' : 'Edge Scroll'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${autoScrollEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
        </button>
      </div>

      {/* Hackathon Detail Modal */}
      {activeModalHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden my-8 space-y-6 p-6 sm:p-8 animate-fade-in">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveModalHackathon(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Banner Preview */}
            <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-900 -mt-2">
              <img src={activeModalHackathon.bannerImage} alt={activeModalHackathon.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block mb-1">
                  Prize Pool: {activeModalHackathon.prizePool}
                </span>
                <h3 className="text-xl font-black">{activeModalHackathon.title}</h3>
                <p className="text-xs text-indigo-300 font-bold">{activeModalHackathon.organizer}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 text-xs text-slate-600">
              <p className="text-sm font-semibold text-slate-800">{activeModalHackathon.tagline}</p>
              <p className="leading-relaxed">{activeModalHackathon.description}</p>

              {/* Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Date & Duration</p>
                  <p className="font-semibold text-slate-800">{activeModalHackathon.date}</p>
                  <p className="text-[10px] text-slate-500">{activeModalHackathon.time}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Mode & Venue</p>
                  <p className="font-semibold text-slate-800">{activeModalHackathon.mode}</p>
                  <p className="text-[10px] text-slate-500 truncate">{activeModalHackathon.venue}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Team Format</p>
                  <p className="font-semibold text-slate-800">{activeModalHackathon.teamSize}</p>
                  <p className="text-[10px] text-slate-500">Max Cap: {activeModalHackathon.totalCapacity}</p>
                </div>
              </div>

              {/* Tracks List */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tracks & Themes</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeModalHackathon.tracks.map((tr, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{tr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setActiveModalHackathon(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const hId = activeModalHackathon.id;
                  setActiveModalHackathon(null);
                  handleParticipate(hId);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Register for Challenge</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

