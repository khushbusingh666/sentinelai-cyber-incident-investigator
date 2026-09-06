import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Terminal, 
  History, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Clock, 
  Search, 
  ChevronRight,
  ShieldCheck,
  FileCode2,
  Database,
  Cpu
} from 'lucide-react';
import { Investigation, DemoSampleIncident, ThreatSeverity } from '../types';
import { DEMO_SAMPLE_INCIDENTS } from '../lib/sampleData';

interface DashboardViewProps {
  investigations: Investigation[];
  onStartNew: () => void;
  onOpenHistory: () => void;
  onSelectInvestigation: (inv: Investigation) => void;
  onLoadSample: (sample: DemoSampleIncident) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  investigations,
  onStartNew,
  onOpenHistory,
  onSelectInvestigation,
  onLoadSample,
}) => {
  // Compute analytics
  const total = investigations.length;
  const criticalCount = investigations.filter((i) => i.threatSeverity === 'Critical').length;
  const highCount = investigations.filter((i) => i.threatSeverity === 'High').length;
  const mediumCount = investigations.filter((i) => i.threatSeverity === 'Medium').length;
  const lowCount = investigations.filter((i) => i.threatSeverity === 'Low').length;
  const containedCount = investigations.filter((i) => i.status === 'contained' || i.status === 'remediated' || i.status === 'closed').length;

  const avgConfidence = total > 0
    ? Math.round(investigations.reduce((acc, curr) => acc + (curr.confidenceScore || 90), 0) / total)
    : 95;

  const getSeverityBadge = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-950/80 text-yellow-400 border border-yellow-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome / Status Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>SOC Operations Center Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Cyber Threat Telemetry & Investigation Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Submit raw logs, EDR notifications, network alerts, or email artifacts for rapid AI-powered threat triage, indicator extraction, and automated mitigation playbooks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-btn-new"
              onClick={onStartNew}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>New Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="dash-btn-history"
              onClick={onOpenHistory}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center space-x-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>View History ({total})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investigations */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Investigations</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{total}</h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              <Database className="w-3 h-3 text-cyan-400 mr-1" />
              Synced to Cloud Firestore
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical Severity</p>
            <h3 className="text-3xl font-extrabold text-red-400 mt-1">{criticalCount}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Requires urgent containment</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* High & Medium */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">High & Medium</p>
            <h3 className="text-3xl font-extrabold text-orange-400 mt-1">{highCount + mediumCount}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              High: {highCount} | Med: {mediumCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Contained & Confidence */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Avg Confidence</p>
            <h3 className="text-3xl font-extrabold text-cyan-400 mt-1">{avgConfidence}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {containedCount} Incident{containedCount !== 1 ? 's' : ''} Contained
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      {total > 0 && (
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Threat Severity Distribution</span>
            <span className="text-slate-400 font-mono">
              Critical ({criticalCount}) • High ({highCount}) • Medium ({mediumCount}) • Low ({lowCount})
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
            {criticalCount > 0 && (
              <div
                style={{ width: `${(criticalCount / total) * 100}%` }}
                className="bg-red-500 h-full transition-all"
                title={`Critical: ${criticalCount}`}
              />
            )}
            {highCount > 0 && (
              <div
                style={{ width: `${(highCount / total) * 100}%` }}
                className="bg-orange-500 h-full transition-all"
                title={`High: ${highCount}`}
              />
            )}
            {mediumCount > 0 && (
              <div
                style={{ width: `${(mediumCount / total) * 100}%` }}
                className="bg-yellow-500 h-full transition-all"
                title={`Medium: ${mediumCount}`}
              />
            )}
            {lowCount > 0 && (
              <div
                style={{ width: `${(lowCount / total) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Low: ${lowCount}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Demonstration Data Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Realistic Cybersecurity Scenarios</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-normal">
                DEMO DATA
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pre-packaged realistic SOC telemetry to test and demonstrate live Gemini forensic triage in competition presentations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_SAMPLE_INCIDENTS.map((sample) => (
            <div
              key={sample.id}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {sample.category}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                    SAMPLE DEMO
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {sample.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  {sample.rawIncident.split('\n').length} telemetry lines
                </span>
                <button
                  onClick={() => onLoadSample(sample)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 hover:text-white border border-cyan-800/60 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>Load into Investigator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Investigations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Recent Incident Triage Reports</span>
            </h2>
            <p className="text-xs text-slate-400">
              Your recent investigations securely persisted in Cloud Firestore under your UID.
            </p>
          </div>
          {investigations.length > 5 && (
            <button
              onClick={onOpenHistory}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View all ({investigations.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {investigations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <Terminal className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-white">No Investigations Yet</h3>
              <p className="text-xs text-slate-400">
                You haven't analyzed any incidents yet. Paste raw telemetry or load one of our realistic sample incidents above.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onStartNew}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Launch First Investigation
              </button>
              <button
                onClick={() => onLoadSample(DEMO_SAMPLE_INCIDENTS[0])}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Load Sample Incident
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="divide-y divide-slate-800">
              {investigations.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvestigation(inv)}
                  className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(inv.threatSeverity)}
                      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {inv.title}
                      </h4>
                      {inv.isDemoSample && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50">
                          DEMO
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="text-cyan-400/90 font-medium truncate max-w-xs">
                        {inv.likelyAttackType}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(inv.createdAt).toLocaleString()}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>Confidence: {inv.confidenceScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded capitalize ${
                      inv.status === 'contained' || inv.status === 'remediated' || inv.status === 'closed'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                    <button className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
