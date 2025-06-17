
export enum BehaviorType {
  ABNORMAL = "Abnormal",
  DANGEROUS = "Dangerous",
  NORMAL = "Normal",
}

export interface BehaviorLogEntry {
  id: string;
  timestamp: Date;
  type: BehaviorType;
  description: string;
  location: string; 
}

export interface EmergencyContact {
  name: string;
  number: string;
  icon: React.ReactNode;
}

export interface LocationActivity {
  location: string;
  count: number;
}

// Renamed from BehaviorDescriptionActivity and field changed from description to category
export interface CategoryActivityData {
  category: string;
  count: number;
}

export interface AnalysisResponse {
  behaviorType: BehaviorType;
  description: string;
  locationGuess?: string; 
}

export interface UserProfile {
  name: string;
  image?: string; // Base64 encoded image string
}