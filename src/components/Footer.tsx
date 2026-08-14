import React from 'react';
import { Shield, Heart, Info, FileText, ShieldCheck, HelpCircle } from 'lucide-react';
import { RostrLogo } from './RostrLogo';
import { InfoModalTab } from './InfoModal';

interface FooterProps {
  setCurrentView: (view: string) => void;
  openInfoModal: (tab: InfoModalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView, openInfoModal }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-100">
          
          {/* Col 1: Brand & Description (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
              title="Go to Homepage"
            >
              <RostrLogo size="md" />
              <div>
                <span className="text-slate-900 font-extrabold tracking-wide text-base block">Rostr 2026</span>
                <p className="text-xs text-indigo-600 font-semibold">QR Attendance & Event Pass Platform</p>
              </div>
            </button>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Premier digital event check-in and delegate pass platform for developer summits, competitive hackathons, and technology buildathons.
            </p>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => setCurrentView('landing')} 
                  className="hover:text-indigo-600 transition-colors font-medium cursor-pointer"
                >
                  Hackathon Discovery
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('register')} 
                  className="hover:text-indigo-600 transition-colors font-medium cursor-pointer"
                >
                  Register for Event
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('admin-login')} 
                  className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer text-slate-700"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" /> Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Information (4 cols) */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">About & Compliance</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <button 
                onClick={() => openInfoModal('about')} 
                className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-indigo-500" /> About Us
              </button>
              <button 
                onClick={() => openInfoModal('terms')} 
                className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Terms & Conditions
              </button>
              <button 
                onClick={() => openInfoModal('privacy')} 
                className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Privacy Policy
              </button>
              <button 
                onClick={() => openInfoModal('faq')} 
                className="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> FAQ & Help
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-2">
          <p>© 2026 Rostr Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 font-medium">
            <span>Built for Seamless Event Check-In</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500 ml-0.5" />
          </div>
        </div>

      </div>
    </footer>
  );
};

