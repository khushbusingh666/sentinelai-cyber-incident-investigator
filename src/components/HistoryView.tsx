import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  ChevronRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import { Investigation, ThreatSeverity, IncidentStatus } from '../types';
import { deleteInvestigationFromFirestore } from '../lib/firebase';

interface HistoryViewProps {
  investigations: Investigation[];
  onSelectInvestigation: (inv: Investigation) => void;
  onStartNew: () => void;
  onDeleted: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  investigations,
  onSelectInvestigation,
  onStartNew,
  onDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, inv: Investigation) => {
    e.stopPropagation();
    if (!window.confirm(`Delete investigation "${inv.title}" from Cloud Firestore?`)) {
      return;
    }

    setDeletingId(inv.id);
    try {
      await deleteInvestigationFromFirestore(inv.userId, inv.id);
      onDeleted(inv.id);
    } catch (err) {
      console.error('Failed to delete investigation:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredInvestigations = investigations.filter((inv) => {
    const matchesSearch =
      searchQuery === '' ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.likelyAttackType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.analysis.indicatorsOfCompromise.some((ioc) =>
        ioc.value.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSeverity =
      severityFilter === 'All' || inv.threatSeverity === severityFilter;

    const matchesStatus =
      statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-950/80 text-orange-400 border border-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-950/80 text-yellow-400 border border-yellow-800">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Investigation History Repository</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and reopen previous incident triage investigations securely stored in Cloud Firestore.
          </p>
        </div>

        <button
          onClick={onStartNew}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Terminal className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center gap-3 justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by incident title, attack type, or IoC..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <span className="text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Severities</option>
              <option value="Critical" className="bg-slate-900 text-red-400">Critical</option>
              <option value="High" className="bg-slate-900 text-orange-400">High</option>
              <option value="Medium" className="bg-slate-900 text-yellow-400">Medium</option>
              <option value="Low" className="bg-slate-900 text-emerald-400">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Statuses</option>
              <option value="investigated" className="bg-slate-900 text-white">Investigated</option>
              <option value="contained" className="bg-slate-900 text-emerald-300">Contained</option>
              <option value="remediated" className="bg-slate-900 text-cyan-300">Remediated</option>
              <option value="closed" className="bg-slate-900 text-slate-400">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Investigations List */}
      {filteredInvestigations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Investigations Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {investigations.length === 0
              ? "You haven't run any incident investigations yet. Start by triaging your first cybersecurity event."
              : "No investigations matched your filter criteria. Try adjusting your search query or reset filters."}
          </p>
          {investigations.length === 0 && (
            <button
              onClick={onStartNew}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Launch First Investigation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvestigations.map((inv) => (
            <div
              key={inv.id}
              onClick={() => onSelectInvestigation(inv)}
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group shadow-sm"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(inv.threatSeverity)}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {inv.incidentType.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {inv.title}
                  </h3>
                  {inv.isDemoSample && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                      DEMO DATA
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 line-clamp-1">
                  <span className="text-slate-400 font-semibold">Attack: </span>
                  <span className="text-cyan-400 font-medium">{inv.likelyAttackType}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-slate-400">{inv.analysis.indicatorsOfCompromise.length} IoCs extracted</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(inv.createdAt).toLocaleString()}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>Confidence: {inv.confidenceScore}%</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-500 text-[11px]">ID: {inv.id}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center space-x-3 self-end md:self-center">
                <span className={`text-xs font-mono px-2.5 py-1 rounded-lg capitalize ${
                  inv.status === 'contained' || inv.status === 'remediated' || inv.status === 'closed'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {inv.status}
                </span>

                <button
                  onClick={(e) => handleDelete(e, inv)}
                  disabled={deletingId === inv.id}
                  title="Delete from Firestore"
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-750 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors text-xs font-semibold flex items-center space-x-1">
                  <span>Open</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
