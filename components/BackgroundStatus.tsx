import React from 'react';
import { BehaviorLogEntry } from '../types';
import { BEHAVIOR_TYPE_KOREAN, mapDescriptionToCategory } from '../constants';
import { InformationCircleIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon } from './icons';

interface BackgroundStatusProps {
    lastLog: BehaviorLogEntry;
}

const BackgroundStatus: React.FC<BackgroundStatusProps> = ({ lastLog }) => {
    const Icon =
        lastLog.type === 'Abnormal' ? QuestionMarkCircleIcon :
        lastLog.type === 'Dangerous' ? ExclamationTriangleIcon :
        InformationCircleIcon;
    const colorClass = 
        lastLog.type === 'Dangerous' ? 'bg-red-500' : 
        lastLog.type === 'Abnormal' ? 'bg-yellow-500' :
        'bg-sky-500';

    const category = mapDescriptionToCategory(lastLog.description, lastLog.type as any);
    const logText = `${BEHAVIOR_TYPE_KOREAN[lastLog.type]} (${category}): ${lastLog.description}`;
    
    return (
        <div 
            className={`fixed bottom-16 left-0 right-0 ${colorClass} text-white px-4 py-2 shadow-lg-top z-40 transition-transform duration-300 ease-in-out`}
            aria-live="polite"
            role="status"
        >
            <div className="max-w-md mx-auto flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold">백그라운드 모니터링 활성 중...</span>
                </div>
                <span className="truncate" style={{ maxWidth: '50%' }}>
                    {logText}
                </span>
            </div>
        </div>
    );
};

export default BackgroundStatus;
