/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, LogIn, ShieldAlert, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (email?: string, name?: string) => void;
  userEmail: string;
}

export default function LoginScreen({ onLoginSuccess, userEmail }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === 'admin') {
      onLoginSuccess(userEmail, 'Authorized Supervisor');
    } else {
      setErrorMsg('Invalid Secure Pin! Try default pin "1234"');
      setPin('');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleGoogleLoginSimulate = () => {
    // Simulate successful Google OAuth redirect validation
    onLoginSuccess(userEmail, 'Fida Huxain');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative Blueprint Grid Background in Core theme */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Dynamic Ambient Glowing Orb */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative z-10 space-y-8 text-center animate-fade-in">
        
        {/* Animated Security Badge */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-display">
            CONSTRUCT<span className="text-orange-500 font-extrabold">SYNC</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
            Corporate Site Supervisor Console
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-mono">
            <span>Client Ingress Secure Port</span>
          </div>
        </div>

        {/* Form elements */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
              Supervisor Security Key / PIN
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter Pin (Default: 1234)"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-2xl outline-none text-xs tracking-widest font-bold placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-600"
                required
              />
            </div>
            
            {errorMsg && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400 font-bold bg-rose-950/20 p-2 rounded-xl border border-rose-900/30 animate-shake">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/15 border-0"
          >
            <LogIn className="w-4 h-4" />
            <span>AUTHENTICATE AND ENTER</span>
          </button>
        </form>

        {/* Elegant visual separation */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
          <span className="h-px bg-slate-800 flex-1"></span>
          <span className="px-3">or authorize with</span>
          <span className="h-px bg-slate-800 flex-1"></span>
        </div>

        {/* Beautiful Custom Google Login button with exact vector logo */}
        <button
          type="button"
          onClick={handleGoogleLoginSimulate}
          className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all border border-slate-200 cursor-pointer shadow-sm active:scale-95"
        >
          {/* Official Google Vector G Logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.99 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.96 3.07C6.31 7.41 8.92 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.74-4.86 3.74-8.49z"
            />
            <path
              fill="#FBBC05"
              d="M5.35 10.63c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.39 3.02C.5 4.81 0 6.84 0 9s.5 4.19 1.39 5.98l3.96-3.35z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.63-2.82c-1.01.68-2.3 1.09-3.96 1.09-3.08 0-5.69-2.37-6.65-5.59L1.39 16.14C3.37 20.35 7.35 23 12 23z"
            />
          </svg>
          <span>Sign In as {userEmail}</span>
        </button>

        <div className="text-[10px] text-slate-500 font-mono text-center">
          Authorized Client ID (fidahuxain@gmail.com) • Session Secure
        </div>

      </div>
    </div>
  );
}
