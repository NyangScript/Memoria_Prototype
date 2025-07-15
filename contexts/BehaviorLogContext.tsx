
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { BehaviorLogEntry, BehaviorType, LocationActivity, CategoryActivityData } from '../types';
import { LOCATIONS, BEHAVIOR_CATEGORIES_MAP, DEFAULT_ABNORMAL_CATEGORY_NAME, DEFAULT_DANGEROUS_CATEGORY_NAME, BEHAVIOR_TYPE_KOREAN, mapDescriptionToCategory } from '../constants';

interface BehaviorLogContextType {
  logs: BehaviorLogEntry[];
  addLog: (logData: Omit<BehaviorLogEntry, 'id' | 'timestamp'>) => void;
  abnormalBehaviorCountLastWeek: number;
  dangerousBehaviorCountLastWeek: number;
  getLogsByType: (type: BehaviorType) => BehaviorLogEntry[];
  getLocationActivity: (type: BehaviorType) => LocationActivity[];
  getBehaviorCategoryActivity: (type: BehaviorType) => CategoryActivityData[];
}

const BehaviorLogContext = createContext<BehaviorLogContextType | undefined>(undefined);

// mapDescriptionToCategory is now imported from constants.ts

export const BehaviorLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<BehaviorLogEntry[]>(() => {
    try {
      const savedLogs = localStorage.getItem('behaviorLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        return parsedLogs.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) }));
      }
    } catch (error) {
      console.error("Failed to load logs from localStorage", error);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('behaviorLogs', JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to save logs to localStorage", error);
    }
  }, [logs]);

  const addLog = useCallback((log: Omit<BehaviorLogEntry, 'id' | 'timestamp'>) => {
    const newLog: BehaviorLogEntry = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substring(2,9), // More unique ID
      timestamp: new Date(),
    };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100)); // Keep max 100 logs
  }, []);

  const getCountsLastWeek = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let abnormalCount = 0;
    let dangerousCount = 0;

    logs.forEach(log => {
      if (log.timestamp > oneWeekAgo) {
        if (log.type === BehaviorType.ABNORMAL) abnormalCount++;
        if (log.type === BehaviorType.DANGEROUS) dangerousCount++;
      }
    });
    return { abnormalCount, dangerousCount };
  }, [logs]);

  const { abnormalCount: abnormalBehaviorCountLastWeek, dangerousCount: dangerousBehaviorCountLastWeek } = getCountsLastWeek();

  const getLogsByType = useCallback((type: BehaviorType) => {
    return logs.filter(log => log.type === type).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs]);

  const getLocationActivity = useCallback((type: BehaviorType) => {
    const activityByLocation: { [key: string]: number } = {};
    LOCATIONS.forEach(loc => activityByLocation[loc] = 0);

    logs.filter(log => log.type === type).forEach(log => {
      if (activityByLocation[log.location] !== undefined) {
        activityByLocation[log.location]++;
      } else {
         if (!activityByLocation["Other"]) activityByLocation["Other"] = 0;
         activityByLocation["Other"]++;
      }
    });
    return Object.entries(activityByLocation)
                 .map(([location, count]) => ({ location, count }))
                 .filter(item => item.count > 0) 
                 .sort((a,b) => b.count - a.count); 
  }, [logs]);

  const getBehaviorCategoryActivity = useCallback((type: BehaviorType) => {
    const activityByCategory: { [key: string]: number } = {};
    
    // Ensure all predefined categories for the type (including default) are initialized to 0
    // This makes sure they appear in the chart even if count is 0, if desired (currently filtered by count > 0 below)
    // const predefinedCategories = Object.keys(BEHAVIOR_CATEGORIES_MAP[type as BehaviorType.ABNORMAL | BehaviorType.DANGEROUS]);
    // predefinedCategories.forEach(cat => activityByCategory[cat] = 0);


    logs
      .filter(log => log.type === type)
      .forEach(log => {
        const category = mapDescriptionToCategory(log.description, type as BehaviorType.ABNORMAL | BehaviorType.DANGEROUS);
        if (activityByCategory[category]) {
          activityByCategory[category]++;
        } else {
          activityByCategory[category] = 1;
        }
      });
  
    return Object.entries(activityByCategory)
      .map(([category, count]) => ({ category, count }))
      .filter(item => item.count > 0) // Optionally, include categories with 0 count if they should always be shown
      .sort((a, b) => b.count - a.count); 
  }, [logs]);

  return (
    <BehaviorLogContext.Provider value={{ 
        logs, 
        addLog, 
        abnormalBehaviorCountLastWeek, 
        dangerousBehaviorCountLastWeek, 
        getLogsByType, 
        getLocationActivity,
        getBehaviorCategoryActivity // Changed from getBehaviorDescriptionActivity
      }}>
      {children}
    </BehaviorLogContext.Provider>
  );
};

export const useBehaviorLogs = (): BehaviorLogContextType => {
  const context = useContext(BehaviorLogContext);
  if (context === undefined) {
    throw new Error('useBehaviorLogs must be used within a BehaviorLogProvider');
  }
  return context;
};