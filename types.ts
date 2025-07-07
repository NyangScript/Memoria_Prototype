
export enum BehaviorType {
  ABNORMAL = "Abnormal",
  DANGEROUS = "Dangerous",
  NORMAL = "Normal",
}

export enum ChatRole {
  USER = "user",
  MODEL = "model",
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
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
