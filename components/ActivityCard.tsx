
import React from 'react';
import { BehaviorLogEntry, BehaviorType } from '../types';
import { BEHAVIOR_TYPE_KOREAN, mapDescriptionToCategory } from '../constants';

interface ActivityCardProps {
  log: BehaviorLogEntry;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ log }) => {
  const { type, description, location, timestamp } = log;
  
  const category = mapDescriptionToCategory(description, type as BehaviorType.ABNORMAL | BehaviorType.DANGEROUS);
  const typeKorean = BEHAVIOR_TYPE_KOREAN[type];
  
  const formatTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dangerous':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Abnormal':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
  }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(type)}`}>
            {typeKorean}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {category}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {formatTime(timestamp)}
        </span>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">위치: {location}</span>
      </div>
    </div>
  );
};

export default ActivityCard;