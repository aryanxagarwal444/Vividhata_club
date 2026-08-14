import React from 'react';
import { QrCode, Check, Smartphone, ScanLine, Sparkles } from 'lucide-react';

interface RostrLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showAnimation?: boolean;
  className?: string;
  variant?: 'indigo' | 'white' | 'dark';
}

export const RostrLogo: React.FC<RostrLogoProps> = ({
  size = 'md',
  showAnimation = true,
  className = '',
  variant = 'indigo'
}) => {
  // Dimension tokens
  const containerDimensions = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl'
  };

  const iconSizes = {
    sm: {
      phone: 'w-3 h-3',
      qr: 'w-3.5 h-3.5',
      check: 'w-2 h-2',
      badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
      beam: 'w-3',
      sparkle: 'w-1.5 h-1.5'
    },
    md: {
      phone: 'w-3.5 h-3.5',
      qr: 'w-4.5 h-4.5',
      check: 'w-2.5 h-2.5',
      badge: 'w-4.5 h-4.5 -bottom-1 -right-1',
      beam: 'w-4',
      sparkle: 'w-2 h-2'
    },
    lg: {
      phone: 'w-4.5 h-4.5',
      qr: 'w-5.5 h-5.5',
      check: 'w-3.5 h-3.5',
      badge: 'w-5.5 h-5.5 -bottom-1 -right-1',
      beam: 'w-5',
      sparkle: 'w-2.5 h-2.5'
    },
    xl: {
      phone: 'w-6 h-6',
      qr: 'w-7.5 h-7.5',
      check: 'w-4.5 h-4.5',
      badge: 'w-7 h-7 -bottom-1.5 -right-1.5',
      beam: 'w-7',
      sparkle: 'w-3 h-3'
    }
  };

  const current = iconSizes[size];

  // Visual container themes
  const variantClasses = {
    indigo: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40',
    white: 'bg-white text-indigo-600 shadow-md border border-slate-200/80',
    dark: 'bg-slate-900 text-white border border-slate-800 shadow-inner'
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 group ${containerDimensions[size]} ${variantClasses[variant]} ${className}`}
      title="Rostr - Verified QR & Face Attendance"
    >
      {/* Background glow when hovered */}
      <div className="absolute inset-0 rounded-inherit bg-indigo-500/20 blur-xs group-hover:bg-indigo-400/30 transition-all pointer-events-none" />

      {/* Main Composite: Phone Scanner aimed at QR Badge */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Attendee QR Code Badge */}
        <div className="relative flex items-center justify-center">
          <QrCode
            className={`${current.qr} ${
              variant === 'white' ? 'text-indigo-600' : 'text-indigo-100'
            } transition-transform duration-300 group-hover:scale-95`}
          />

          {/* Active Cyan Scanning Laser Beam across QR */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <span className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_#22d3ee] animate-pulse" />
          </div>
        </div>

        {/* Floating Phone / Hand Scanner device in corner */}
        <div className="absolute -top-1 -left-1 p-0.5 rounded-sm bg-slate-950/80 border border-cyan-400/60 shadow-xs flex items-center justify-center text-cyan-300 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
          <Smartphone className={current.phone} />
        </div>
      </div>

      {/* Verified Instant Check-In Tick Badge */}
      <div
        className={`absolute z-20 ${current.badge} bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-full flex items-center justify-center font-black border-2 border-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400/50 ${
          showAnimation ? 'group-hover:scale-115 transition-all duration-300' : ''
        }`}
      >
        <Check className={`${current.check} stroke-[3.5] text-white`} />
      </div>

      {/* Tiny celebratory sparkle badge on top right */}
      <div className="absolute -top-0.5 -right-0.5 text-amber-300 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all pointer-events-none">
        <Sparkles className={current.sparkle} />
      </div>
    </div>
  );
};

