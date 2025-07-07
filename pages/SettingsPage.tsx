import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { ROUTES } from '../constants';
import { UserCircleIcon, ChevronRightIcon, VideoCameraIcon, ServerStackIcon } from '../components/icons';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      label: '프로필 정보 수정',
      icon: UserCircleIcon,
      route: ROUTES.PROFILE_SETTINGS,
      description: '사용자 이름 및 프로필 사진을 변경합니다.'
    },
    {
      label: '카메라 설정',
      icon: VideoCameraIcon, 
      route: ROUTES.CAMERA_SETTINGS,
      description: '기본 카메라 소스를 선택합니다 (ESP32 또는 기기 카메라).'
    },
    {
      label: 'ESP32 서버 주소 설정', // New setting item
      icon: ServerStackIcon,
      route: ROUTES.ESP32_URL_SETTINGS,
      description: 'ESP32 웹 서버의 주소(URL)를 설정합니다.'
    },
    // Add more settings categories here if needed in the future
  ];

  return (
    <PageLayout title="설정" showBackButton={true} onBack={() => navigate(ROUTES.HOME)}>
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl max-w-lg mx-auto">
        <ul className="divide-y divide-gray-200">
          {settingsOptions.map((option, index) => (
            <li key={index} 
                className="py-4 hover:bg-gray-50 transition-colors duration-150 rounded-md -mx-2 px-2 cursor-pointer"
                onClick={() => navigate(option.route)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(option.route);}}
                aria-label={option.label}
            >
              <div className="flex items-center space-x-4">
                <option.icon className="w-6 h-6 text-sky-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-md font-medium text-gray-800 truncate">{option.label}</p>
                  <p className="text-sm text-gray-500 truncate">{option.description}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
