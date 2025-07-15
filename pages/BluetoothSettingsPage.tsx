import React from 'react';
import PageLayout from '../components/PageLayout';
import { BluetoothIcon } from '../components/icons';
import { ROUTES } from '../constants';
import { useNavigate } from 'react-router-dom';

const openAndroidBluetoothSettings = () => {
  // 정확한 인텐트 URI 사용
  if (window && /Android/i.test(navigator.userAgent)) {
    window.location.href = 'intent://com.android.settings#Intent;action=android.settings.BLUETOOTH_SETTINGS;end';
  } else {
    alert('이 기능은 안드로이드 기기에서만 지원됩니다.');
  }
};

const BluetoothSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <PageLayout title="블루투스 기기 연결" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <BluetoothIcon className="w-16 h-16 text-sky-500 mb-3" />
          <h2 className="text-xl font-semibold text-gray-800">블루투스 기기 연결</h2>
          <p className="text-sm text-gray-500 mt-1">경고를 송출할 블루투스 스피커를 연결하려면 아래 버튼을 눌러 안드로이드 설정에서 기기를 연결하세요.</p>
        </div>
        <button
          onClick={openAndroidBluetoothSettings}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out mb-2"
        >
          안드로이드 블루투스 설정 열기
        </button>
        <div className="text-xs text-gray-400 text-center mt-2">설정에서 기기 연결 후 앱으로 돌아오세요.</div>
      </div>
    </PageLayout>
  );
};

export default BluetoothSettingsPage; 