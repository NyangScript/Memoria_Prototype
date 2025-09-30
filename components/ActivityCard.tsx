import React from 'react';
import { BehaviorLogEntry, BehaviorType } from '../types';
import { QuestionMarkCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './icons';
import { BEHAVIOR_TYPE_KOREAN, mapDescriptionToCategory } from '../constants';

interface ActivityCardProps {
  log: BehaviorLogEntry;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ log }) => {
  const Icon = log.type === BehaviorType.ABNORMAL ? QuestionMarkCircleIcon : 
               log.type === BehaviorType.DANGEROUS ? ExclamationTriangleIcon : 
               InformationCircleIcon;
  const colorClass = log.type === BehaviorType.ABNORMAL ? 'border-yellow-500 bg-yellow-50' :
                     log.type === BehaviorType.DANGEROUS ? 'border-red-500 bg-red-50' :
                     'border-blue-500 bg-blue-50';
  const iconColorClass = log.type === BehaviorType.ABNORMAL ? 'text-yellow-600' :
                         log.type === BehaviorType.DANGEROUS ? 'text-red-600' :
                         'text-blue-600';

  let displayTextPrefix: string;

  if (log.type === BehaviorType.NORMAL) {
    displayTextPrefix = BEHAVIOR_TYPE_KOREAN[log.type];
  } else {
    // For ABNORMAL or DANGEROUS, use mapDescriptionToCategory
    // Type assertion is safe here as we've checked for NORMAL type.
    displayTextPrefix = mapDescriptionToCategory(log.description, log.type as BehaviorType.ABNORMAL | BehaviorType.DANGEROUS);
  }

  return (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${colorClass} mb-3`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 mt-1 flex-shrink-0 ${iconColorClass}`} />
        <div>
          <p className="font-semibold text-gray-800">
            {displayTextPrefix}: <span className="font-normal">{log.description}</span>
          </p>
          <p className="text-sm text-gray-500">
            {log.timestamp.toLocaleString('ko-KR')} - {log.location}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;