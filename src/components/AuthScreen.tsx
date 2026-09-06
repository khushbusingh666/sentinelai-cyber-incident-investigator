import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Cpu, 
  Database, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Search,
  FileCode2,
  KeyRound
} from 'lucide-react';
import { signInWithGoogle, signInDemoAnalyst } from '../lib/firebase';
import { AppUser } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthScreenProps {
  onSuccess: (user?: FirebaseUser | AppUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      onSuccess(user);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please complete the Google login dialog.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this window or use the Demo Analyst access below.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setDemoLoading(true);
      setError(null);
      const user = await signInDemoAnalyst();
      onSuccess(user);
    } catch (err: any) {
      console.error('Demo sign-in error:', err);
      setError('Could not initialize demo analyst. Please use Google Sign In.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Cyber Grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Banner */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Sentinel<span className="text-cyan-400">AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                CYBER FORENSICS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">AI Cyber Incident Investigator</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SOC Systems Operational</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Column: Product Value & Capabilities */}
        <div className="flex-1 space-y-6 text-left max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini 2.5 Flash + Cloud Firestore Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous AI Cyber Incident <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Forensics & Triage</span>
          </h2>

          <p className="text-base text-slate-300 leading-relaxed">
            Accelerate SOC triage from hours to seconds. Paste suspicious raw syslogs, EDR alerts, phishing headers, or firewall drops to instantly derive severity scores, MITRE ATT&CK techniques, extracted IoCs, and step-by-step incident storylines.
          </p>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Threat Severity Matrix</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Critical, High, Medium, Low scoring with confidence ratings.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 mt-0.5">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">IoC Extraction & Context</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Classifies malicious IPs, C2 URLs, hashes, and polyglots.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400 mt-0.5">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Response Runbooks</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">P1-P3 containment checklists with ready-to-run shell commands.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Per-User Data Isolation</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Secured in Cloud Firestore under authenticated user UID.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="w-full max-w-md">
          <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                SOC Analyst Portal
              </h3>
              <p className="text-xs text-slate-400">
                Authenticate using Google to access your secure Cloud Firestore incident repository.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                id="btn-google-signin"
                onClick={handleGoogleSignIn}
                disabled={loading || demoLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center space-x-3 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[11px] uppercase font-mono text-slate-500">or for demo judging</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Demo Analyst Instant Access */}
              <button
                id="btn-demo-analyst"
                onClick={handleDemoSignIn}
                disabled={loading || demoLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-medium text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>{demoLoading ? 'Initializing Demo Workspace...' : 'Instant Demo Analyst Access'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Security Compliance note */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero-Trust: You only see your own investigations</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Server-Side Gemini API Key (Never exposed in frontend)</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Persistent real-time Cloud Firestore synchronization</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        SentinelAI v2.5 – SOC Incident Response & Threat Intelligence Engine | Built with Gemini & Firebase
      </footer>
    </div>
  );
};
