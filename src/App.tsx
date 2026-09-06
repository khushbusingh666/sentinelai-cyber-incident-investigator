/**
 * SentinelAI – AI Cyber Incident Investigator
 * Full-stack cybersecurity triage application with Firebase Auth, Cloud Firestore, and Gemini 2.5 Flash
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, logOut, subscribeUserInvestigations } from './lib/firebase';
import { Investigation, DemoSampleIncident, AppUser } from './types';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { NewInvestigationView } from './components/NewInvestigationView';
import { HistoryView } from './components/HistoryView';
import { InvestigationDetailView } from './components/InvestigationDetailView';
import { Loader2, ShieldAlert, Cpu, Database } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | AppUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-investigation' | 'history' | 'investigation-detail'>('dashboard');
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [preloadedSample, setPreloadedSample] = useState<DemoSampleIncident | null>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore investigations under authenticated user UID
  useEffect(() => {
    if (!currentUser) {
      setInvestigations([]);
      return;
    }

    const unsubscribe = subscribeUserInvestigations(
      currentUser.uid,
      (data) => {
        setInvestigations(data);
        // If current selected item was updated, keep it in sync
        setSelectedInvestigation((prev) => {
          if (!prev) return null;
          const matched = data.find((i) => i.id === prev.id);
          return matched || prev;
        });
      },
      (error) => {
        console.warn('Firestore subscription status:', error.message);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setSelectedInvestigation(null);
      setActiveTab('dashboard');
    }
  };

  const handleInvestigationComplete = (newInvestigation: Investigation) => {
    setSelectedInvestigation(newInvestigation);
    setActiveTab('investigation-detail');
  };

  const handleSelectInvestigation = (inv: Investigation) => {
    setSelectedInvestigation(inv);
    setActiveTab('investigation-detail');
  };

  const handleLoadSample = (sample: DemoSampleIncident) => {
    setPreloadedSample(sample);
    setActiveTab('new-investigation');
  };

  const handleDeletedInvestigation = (id: string) => {
    setInvestigations((prev) => prev.filter((i) => i.id !== id));
    if (selectedInvestigation?.id === id) {
      setSelectedInvestigation(null);
      setActiveTab('dashboard');
    }
  };

  const handleUpdatedInvestigation = (updated: Investigation) => {
    setInvestigations((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
    if (selectedInvestigation?.id === updated.id) {
      setSelectedInvestigation(updated);
    }
  };

  // Auth Loading State
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
          <ShieldAlert className="w-8 h-8 animate-pulse text-cyan-400" />
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-cyan-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying SentinelAI SOC Credentials...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated State -> Show Auth Screen
  if (!currentUser) {
    return (
      <AuthScreen
        onSuccess={(user) => {
          if (user) {
            setCurrentUser(user);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'new-investigation') {
            setPreloadedSample(null);
          }
        }}
        onLogout={handleLogout}
        investigationCount={investigations.length}
      />

      {/* Main App Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            investigations={investigations}
            onStartNew={() => {
              setPreloadedSample(null);
              setActiveTab('new-investigation');
            }}
            onOpenHistory={() => setActiveTab('history')}
            onSelectInvestigation={handleSelectInvestigation}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'new-investigation' && (
          <NewInvestigationView
            userId={currentUser.uid}
            onInvestigationComplete={handleInvestigationComplete}
            preloadedSample={preloadedSample}
            onClearPreloadedSample={() => setPreloadedSample(null)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            investigations={investigations}
            onSelectInvestigation={handleSelectInvestigation}
            onStartNew={() => {
              setPreloadedSample(null);
              setActiveTab('new-investigation');
            }}
            onDeleted={handleDeletedInvestigation}
          />
        )}

        {activeTab === 'investigation-detail' && selectedInvestigation && (
          <InvestigationDetailView
            investigation={selectedInvestigation}
            onBack={() => setActiveTab('dashboard')}
            onDeleted={handleDeletedInvestigation}
            onUpdated={handleUpdatedInvestigation}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">SentinelAI SOC Core Online</span>
          </div>
          <div>
            UID-Partitioned Cloud Firestore • Server-Side Gemini 2.5 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
