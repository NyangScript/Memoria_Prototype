import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AbnormalLogPage from './pages/AbnormalLogPage';
import DangerousLogPage from './pages/DangerousLogPage';
import ReportEmergencyPage from './pages/ReportEmergencyPage';
import ReportErrorPage from './pages/ReportErrorPage';
import SettingsPage from './pages/SettingsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage'; 
import CameraSettingsPage from './pages/CameraSettingsPage';   
import Esp32UrlSettingsPage from './pages/Esp32UrlSettingsPage';
import ChatPage from './pages/ChatPage'; // Import new Chat page
import BottomNav from './components/BottomNav';
import { BehaviorLogProvider } from './contexts/BehaviorLogContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { CameraSettingsProvider } from './contexts/CameraSettingsContext'; 
import { Esp32ConfigProvider } from './contexts/Esp32ConfigContext';
import { ChatHistoryProvider } from './contexts/ChatHistoryContext'; // Import new Chat history provider
import { ROUTES } from './constants';

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-sky-400 to-cyan-300 z-[100]">
    <svg className="w-24 h-24 text-white mb-6 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 5C25.16 5 5 25.16 5 50s20.16 45 45 45 45-20.16 45-45S74.84 5 50 5zm0 82.5c-20.68 0-37.5-16.82-37.5-37.5S29.32 12.5 50 12.5s37.5 16.82 37.5 37.5-16.82 37.5-37.5 37.5z"/>
        <path d="M50 22.5c-3.45 0-6.25 2.8-6.25 6.25s2.8 6.25 6.25 6.25 6.25-2.8 6.25-6.25-2.8-6.25-6.25-6.25zm0 30c-10.35 0-18.75 8.4-18.75 18.75h37.5c0-10.35-8.4-18.75-18.75-18.75z"/>
    </svg>
    <h1 className="text-3xl font-bold text-white">Memoria</h1>
    <p className="text-white text-opacity-80 mt-2">보호자용 어플리케이션</p>
  </div>
);

const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-sky-50">
      <div className="flex-grow pb-16"> {/* Padding bottom for BottomNav */}
        <Routes>
          <Route path={ROUTES.HOME} element={<MainPage />} />
          <Route path={ROUTES.ABNORMAL_LOG} element={<AbnormalLogPage />} />
          <Route path={ROUTES.DANGEROUS_LOG} element={<DangerousLogPage />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.REPORT} element={<ReportEmergencyPage />} />
          <Route path={ROUTES.REPORT_ERROR} element={<ReportErrorPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.PROFILE_SETTINGS} element={<ProfileSettingsPage />} /> 
          <Route path={ROUTES.CAMERA_SETTINGS} element={<CameraSettingsPage />} />   
          <Route path={ROUTES.ESP32_URL_SETTINGS} element={<Esp32UrlSettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // Simulate loading time
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <UserProfileProvider>
      <BehaviorLogProvider>
        <CameraSettingsProvider> 
          <Esp32ConfigProvider>
            <ChatHistoryProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </ChatHistoryProvider>
          </Esp32ConfigProvider>
        </CameraSettingsProvider>
      </BehaviorLogProvider>
    </UserProfileProvider>
  );
};

export default App;
