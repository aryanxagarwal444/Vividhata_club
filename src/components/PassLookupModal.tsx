import React, { useState } from 'react';
import { findParticipant } from '../lib/firebase';
import { Participant } from '../types';
import { useToast } from './Toast';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { RostrLogo } from './RostrLogo';

interface PassLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFound: (participant: Participant) => void;
}

export const PassLookupModal: React.FC<PassLookupModalProps> = ({ isOpen, onClose, onFound }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const result = await findParticipant(query);
      if (result) {
        showToast('Pass Found!', `Found event pass for ${result.name}`, 'success');
        onFound(result);
        onClose();
      } else {
        showToast('Not Found', 'No registration found for the provided Email or Participant ID.', 'error');
      }
    } catch (err) {
      showToast('Search Error', 'Failed to search pass. Please check your query.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center flex flex-col items-center">
          <RostrLogo size="lg" />
          <h3 className="text-xl font-extrabold text-slate-900">Find Your Delegate Pass</h3>
          <p className="text-xs text-slate-500">
            Enter your Email Address or Participant ID (e.g. EVT-2026-00124) to retrieve your QR Pass.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="aryan@example.com or EVT-2026-00124"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="w-full py-3.5 rounded-lg font-bold text-white uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 transition-all text-xs"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Database...</span>
              </>
            ) : (
              <>
                <span>Retrieve Pass</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
