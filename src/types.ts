export type ThreatSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'investigated' | 'contained' | 'remediated' | 'closed';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type IncidentSourceType = 
  | 'syslog' 
  | 'edr_alert' 
  | 'phishing_email' 
  | 'network_firewall' 
  | 'cloud_audit' 
  | 'web_waf' 
  | 'custom';

export interface IndicatorOfCompromise {
  type: 'IP' | 'Domain' | 'URL' | 'Hash' | 'File' | 'Email' | 'Registry' | 'Command';
  value: string;
  reputation: 'Malicious' | 'Suspicious' | 'Unknown';
  context: string;
}

export interface StorylineStep {
  step: number;
  phase: string;
  timestamp: string;
  description: string;
  techniqueId?: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
}

export interface ResponseAction {
  priority: 'P1 - Immediate' | 'P2 - Containment' | 'P3 - Eradication & Recovery';
  action: string;
  description: string;
  suggestedCommand?: string | null;
  completed?: boolean;
}

export interface InvestigationAnalysis {
  threatSeverity: ThreatSeverity;
  threatScore: number;
  likelyAttackType: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  executiveSummary: string;
  whySuspicious: string;
  attackStoryline: StorylineStep[];
  mitreAttackTechniques?: MitreTechnique[];
  indicatorsOfCompromise: IndicatorOfCompromise[];
  recommendedResponseActions: ResponseAction[];
  affectedAssets?: string[];
  attackVector?: string;
  modelUsed?: string;
}

export interface Investigation {
  id: string;
  userId: string;
  title: string;
  incidentType: IncidentSourceType;
  rawIncident: string;
  analysis: InvestigationAnalysis;
  threatSeverity: ThreatSeverity;
  likelyAttackType: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  status: IncidentStatus;
  notes?: string;
  tags?: string[];
  isDemoSample?: boolean;
  modelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSampleIncident {
  id: string;
  title: string;
  incidentType: IncidentSourceType;
  category: string;
  description: string;
  rawIncident: string;
  precomputedAnalysis?: InvestigationAnalysis;
}
