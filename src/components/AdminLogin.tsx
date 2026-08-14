import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useToast } from './Toast';
import { Shield, Lock, Mail, Loader2, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('admin@event.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      // Attempt Firebase authentication
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('Admin Authenticated', 'Welcome back to the Admin Dashboard!', 'success');
      onSuccess();
    } catch (err: any) {
      console.warn('Firebase Auth notice:', err.code);

      // For demo convenience, allow standard admin credentials fallback if account isn't initialized in Auth
      if (email.trim().toLowerCase() === 'admin@event.com' && password === 'admin123') {
        showToast('Demo Admin Access Granted', 'Signed in as Lead Event Administrator.', 'success');
        // Store demo session flag
        sessionStorage.setItem('admin_authenticated', 'true');
        onSuccess();
      } else {
        showToast('Authentication Failed', err.message || 'Invalid email or password.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setEmail('admin@event.com');
    setPassword('admin123');
    sessionStorage.setItem('admin_authenticated', 'true');
    showToast('Demo Admin Access Granted', 'Signed in as Lead Event Administrator.', 'success');
    onSuccess();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      
      <div className="max-w-md w-full space-y-6">
        
        {/* Back Button */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Landing</span>
        </button>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Admin Portal Access</h2>
            <p className="text-xs text-slate-500">
              Authorized event organizers & gate scanning staff
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-slate-900 text-sm focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-lg text-slate-900 text-sm focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-medium">Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg font-bold text-white uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 transition-all text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In To Admin Dashboard</span>
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Demo Credentials</p>
            <button
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Admin Login (admin@event.com)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
