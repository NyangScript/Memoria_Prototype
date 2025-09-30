import { registerPlugin } from '@capacitor/core';
import { BehaviorLogEntry, BehaviorType } from '../types';

export interface ForegroundServicePlugin {
  startForegroundService(logData?: {
    behaviorType?: string;
    description?: string;
    location?: string;
    timestamp?: string;
  }): Promise<void>;
  stopForegroundService(): Promise<void>;
  setFlaskUrl(options: { flask_url: string }): Promise<void>;
  getLocalLogs(): Promise<{ logs: string[] }>;
  clearLocalLogs(): Promise<void>;
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<void>;
}

const ForegroundService = registerPlugin<ForegroundServicePlugin>('ForegroundServicePlugin');

export default ForegroundService;

export const addAnalysisResultListener = (callback: (data: any) => void) =>
  ForegroundService.addListener('analysisResult', callback);
