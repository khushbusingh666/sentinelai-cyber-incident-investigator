import React, { useState } from 'react';
import { 
  Terminal, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Upload, 
  ClipboardPaste, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  ArrowRight,
  Info,
  Cpu
} from 'lucide-react';
import { IncidentSourceType, Investigation, InvestigationAnalysis, DemoSampleIncident } from '../types';
import { DEMO_SAMPLE_INCIDENTS } from '../lib/sampleData';
import { saveInvestigationToFirestore } from '../lib/firebase';

interface NewInvestigationViewProps {
  userId: string;
  onInvestigationComplete: (investigation: Investigation) => void;
  preloadedSample?: DemoSampleIncident | null;
  onClearPreloadedSample?: () => void;
}

export const NewInvestigationView: React.FC<NewInvestigationViewProps> = ({
  userId,
  onInvestigationComplete,
  preloadedSample,
  onClearPreloadedSample,
}) => {
  const [title, setTitle] = useState(preloadedSample?.title || '');
  const [incidentType, setIncidentType] = useState<IncidentSourceType>(
    preloadedSample?.incidentType || 'edr_alert'
  );
  const [rawIncident, setRawIncident] = useState(preloadedSample?.rawIncident || '');
  const [isDemoSample, setIsDemoSample] = useState(!!preloadedSample);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analysisSteps = [
    'Establishing secure channel to SentinelAI Gemini 2.5 Flash Engine...',
    'Parsing raw telemetry, event IDs, headers, and payload decoders...',
    'Correlating anomalies against MITRE ATT&CK framework...',
    'Extracting and classifying Indicators of Compromise (IoCs)...',
    'Reconstructing chronological attack storyline...',
    'Synthesizing prioritized P1-P3 containment & remediation playbooks...'
  ];

  const handleSelectSample = (sample: DemoSampleIncident) => {
    setTitle(sample.title);
    setIncidentType(sample.incidentType);
    setRawIncident(sample.rawIncident);
    setIsDemoSample(true);
    setError(null);
  };

  const handleClear = () => {
    setTitle('');
    setRawIncident('');
    setIsDemoSample(false);
    setError(null);
    if (onClearPreloadedSample) onClearPreloadedSample();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawIncident(text);
        setIsDemoSample(false);
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleRunInvestigation = async (usePrecomputedIfAvailable = false) => {
    if (!rawIncident.trim()) {
      setError('Please paste or load suspicious incident telemetry to investigate.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisStep(0);

    // Dynamic step animation for SOC forensic feel
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      let analysisData: InvestigationAnalysis;

      // If user chooses quick demo inspection with precomputed analysis
      if (usePrecomputedIfAvailable && isDemoSample && preloadedSample?.precomputedAnalysis) {
        // Small delay to show smooth triage transition
        await new Promise((r) => setTimeout(r, 1200));
        analysisData = preloadedSample.precomputedAnalysis;
      } else {
        // Live Gemini API Call to server-side backend
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rawIncident,
            incidentType,
            incidentTitle: title.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Investigation server responded with HTTP ${response.status}`);
        }

        const resData = await response.json();
        if (!resData.success || !resData.data) {
          throw new Error('Analysis completed but did not return valid cybersecurity telemetry.');
        }

        analysisData = resData.data;
      }

      // Generate full investigation object
      const investigationId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newInvestigation: Investigation = {
        id: investigationId,
        userId,
        title: title.trim() || analysisData.likelyAttackType || 'Cyber Incident Investigation',
        incidentType,
        rawIncident,
        analysis: analysisData,
        threatSeverity: analysisData.threatSeverity || 'High',
        likelyAttackType: analysisData.likelyAttackType || 'Suspicious Activity',
        confidenceLevel: analysisData.confidenceLevel || 'High',
        confidenceScore: analysisData.confidenceScore || 90,
        status: 'investigated',
        notes: '',
        tags: [incidentType, analysisData.threatSeverity.toLowerCase()],
        isDemoSample,
        modelUsed: analysisData.modelUsed || (isDemoSample ? 'gemini-2.5-flash (precomputed)' : 'gemini-2.5-flash'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Cloud Firestore
      await saveInvestigationToFirestore(userId, newInvestigation);

      clearInterval(stepInterval);
      setAnalyzing(false);
      onInvestigationComplete(newInvestigation);
    } catch (err: any) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      console.error('Investigation error:', err);
      setError(
        err.message ||
          'Failed to complete cyber investigation. Please verify your telemetry format and try again.'
      );
    }
  };

  const lineCount = rawIncident ? rawIncident.split('\n').length : 0;
  const charCount = rawIncident.length;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-cyan-400" />
            <span>New Incident Triage & Investigation</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit raw logs, IDS alerts, email headers, firewall events, or incident descriptions for AI forensic analysis.
          </p>
        </div>

        {/* Demo data badge if loaded */}
        {isDemoSample && (
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-mono self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Sample Demo Data Loaded</span>
          </div>
        )}
      </div>

      {/* Quick Demo Scenario Loaders */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Quick Demo Incident Scenarios</span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
              DEMO DATA
            </span>
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Click to prefill realistic SOC telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {DEMO_SAMPLE_INCIDENTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                title === sample.title
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-white shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-cyan-400 uppercase truncate">
                {sample.incidentType.replace('_', ' ')}
              </div>
              <div className="text-xs font-medium truncate mt-0.5">{sample.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Incident Title */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Incident Investigation Title (Optional)</span>
              <span className="text-[11px] text-slate-500 font-normal">Auto-assigned if blank</span>
            </label>
            <input
              id="input-incident-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cobalt Strike Beaconing on Host WS-FIN-089"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Incident Source Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Telemetry Source Type
            </label>
            <select
              id="select-incident-type"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value as IncidentSourceType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
            >
              <option value="edr_alert">EDR / Endpoint Alert</option>
              <option value="syslog">Syslog / Windows Event Log</option>
              <option value="phishing_email">Phishing Email / Raw Headers</option>
              <option value="network_firewall">Firewall / IDS / Suricata</option>
              <option value="cloud_audit">CloudTrail / Cloud Audit Logs</option>
              <option value="web_waf">Web Server / WAF Log</option>
              <option value="custom">Custom Incident Description</option>
            </select>
          </div>
        </div>

        {/* Telemetry Input Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Raw Incident Telemetry / Log Content</span>
            </label>

            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span>
                {lineCount} lines • {charCount.toLocaleString()} chars
              </span>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="hover:text-cyan-300 text-slate-400 flex items-center space-x-1 cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Paste</span>
              </button>
              {rawIncident && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hover:text-red-400 text-slate-400 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-cyan-500/60">
            {/* Terminal bar */}
            <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  sentinel-console://telemetry-input
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                {incidentType}
              </span>
            </div>

            <textarea
              id="textarea-raw-incident"
              rows={14}
              value={rawIncident}
              onChange={(e) => {
                setRawIncident(e.target.value);
                setIsDemoSample(false);
              }}
              placeholder={`Paste your suspicious cybersecurity events here...
Examples:
- Windows Event 4688 / 4624 command lines & hashes
- Snort or Suricata alert fast.log lines
- Raw email headers (Received:, Authentication-Results:, DKIM)
- Apache/Nginx access.log with SQLi or traversal patterns
- AWS CloudTrail / GCP Audit JSON logs
- IP connections, netflow dumps, or breach summaries`}
              className="w-full p-4 bg-slate-950 font-mono text-xs sm:text-sm text-cyan-100 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800/90 text-sm text-red-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Investigation Alert</div>
              <div className="text-xs text-red-300 leading-relaxed">{error}</div>
            </div>
          </div>
        )}

        {/* Loading Overlay / Progress Banner */}
        {analyzing && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 space-y-4 shadow-xl shadow-cyan-950/40">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Gemini 2.5 Flash Autonomous SOC Triage in Progress</span>
                  <span className="text-xs font-mono text-cyan-400 animate-pulse">● LIVE</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  {analysisSteps[analysisStep]}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 transition-all duration-500"
                style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero-Shot Deep Reasoning</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>IoC Extraction Matrix</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>MITRE ATT&CK Mapping</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Telemetry will be analyzed server-side and recorded to your Cloud Firestore repository.</span>
          </div>

          <div className="flex items-center space-x-3">
            {isDemoSample && preloadedSample?.precomputedAnalysis && (
              <button
                type="button"
                id="btn-fast-demo-inspect"
                disabled={analyzing}
                onClick={() => handleRunInvestigation(true)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Instant Demo Preview</span>
              </button>
            )}

            <button
              type="button"
              id="btn-run-investigation"
              disabled={analyzing || !rawIncident.trim()}
              onClick={() => handleRunInvestigation(false)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Triaging Incident...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Run Live Gemini Investigation</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
