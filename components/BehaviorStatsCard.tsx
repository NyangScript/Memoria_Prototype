import React from 'react';
import { Link } from 'react-router-dom';

interface BehaviorStatsCardProps {
  title: string;
  count: number | string; // Allow string for cases like "긴급 신고" where count is not a number
  icon: React.ReactElement<{ className?: string }>; // Changed: More specific type for icon
  linkTo: string;
  colorClass: string; // e.g., text-yellow-500, bg-yellow-100
}

const BehaviorStatsCard: React.FC<BehaviorStatsCardProps> = ({ title, count, icon, linkTo, colorClass }) => {
  return (
    <Link to={linkTo} className={`flex-1 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col items-center text-center transform hover:scale-105`}>
      <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('500', '100')} mb-3`}>
        {/* Changed: Removed 'as React.ReactElement' cast, className prop is now known */}
        {React.cloneElement(icon, { className: `w-7 h-7 ${colorClass}` })}
      </div>
      <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${colorClass}`}>{count === "" ? "\u00A0" : count}</p> {/* Handle empty string for count */}
      { title !== "긴급 신고" && <p className="text-xs text-gray-400 mt-1">지난 1주</p> }
      { title === "긴급 신고" && <p className="text-xs text-gray-400 mt-1 invisible">Placeholder</p> } {/* Keep height consistent */}
    </Link>
  );
};

export default BehaviorStatsCard;
