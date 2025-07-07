
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import { HomeIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, ChatBubbleOvalLeftEllipsisIcon, AdjustmentsHorizontalIcon } from './icons'; 

const navItems = [
  { path: ROUTES.HOME, label: '홈', icon: HomeIcon },
  { path: ROUTES.ABNORMAL_LOG, label: '이상행동', icon: QuestionMarkCircleIcon },
  { path: ROUTES.DANGEROUS_LOG, label: '위험상황', icon: ExclamationTriangleIcon },
  { path: ROUTES.CHAT, label: '채팅', icon: ChatBubbleOvalLeftEllipsisIcon },
  { path: ROUTES.SETTINGS, label: '설정', icon: AdjustmentsHorizontalIcon }, 
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  const noNavRoutes = [ROUTES.REPORT_ERROR, ROUTES.REPORT];
  if (noNavRoutes.includes(location.pathname)) {
    return null;
  }


  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-t border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ease-in-out
                 ${isActive ? 'text-sky-500' : 'text-gray-500 hover:text-sky-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
