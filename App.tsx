
import React, { useState, useEffect } from 'react';
import { HashRouter, useLocation } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AbnormalLogPage from './pages/AbnormalLogPage';
import DangerousLogPage from './pages/DangerousLogPage';
import ReportEmergencyPage from './pages/ReportEmergencyPage';
import ReportErrorPage from './pages/ReportErrorPage';
import SettingsPage from './pages/SettingsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage'; 
import CameraSettingsPage from './pages/CameraSettingsPage';   
import Esp32UrlSettingsPage from './pages/Esp32UrlSettingsPage';
import ChatPage from './pages/ChatPage';
import BottomNav from './components/BottomNav';
import { BehaviorLogProvider, useBehaviorLogs } from './contexts/BehaviorLogContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { CameraSettingsProvider } from './contexts/CameraSettingsContext'; 
import { Esp32ConfigProvider, useEsp32Config } from './contexts/Esp32ConfigContext';
import { ChatHistoryProvider } from './contexts/ChatHistoryContext';
import { ROUTES, DEFAULT_ANALYSIS_LOCATION } from './constants';
import { AnalysisResponse, BehaviorType } from './types';

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

const PageComponentMap: { [key: string]: React.ReactElement } = {
  [ROUTES.HOME]: <MainPage />,
  [ROUTES.ABNORMAL_LOG]: <AbnormalLogPage />,
  [ROUTES.DANGEROUS_LOG]: <DangerousLogPage />,
  [ROUTES.CHAT]: <ChatPage />,
  [ROUTES.REPORT]: <ReportEmergencyPage />,
  [ROUTES.REPORT_ERROR]: <ReportErrorPage />,
  [ROUTES.SETTINGS]: <SettingsPage />,
  [ROUTES.PROFILE_SETTINGS]: <ProfileSettingsPage />,
  [ROUTES.CAMERA_SETTINGS]: <CameraSettingsPage />,
  [ROUTES.ESP32_URL_SETTINGS]: <Esp32UrlSettingsPage />,
};


const AppContent: React.FC = () => {
  const { addLog } = useBehaviorLogs();
  const { esp32Url, isDefaultUrl } = useEsp32Config();
  const location = useLocation();

  useEffect(() => {
    // Do not set up listener if URL is not configured
    if (isDefaultUrl) return;

    const handleIframeMessage = (event: MessageEvent) => {
      try {
        // More robust origin check: only compare hostnames to avoid port conflicts.
        if (event.origin !== window.origin && new URL(event.origin).hostname !== new URL(esp32Url).hostname) {
          return;
        }
      } catch (e) {
        console.warn("Could not validate message origin:", event.origin);
        return; // Ignore if URLs are invalid and cannot be parsed
      }

      if (event.data && event.data.type === 'MEMORIA_ANALYSIS_RESULT') {
        const result = event.data.payload as AnalysisResponse;

        if (result && result.behaviorType && result.description) {
          // Log only if it's not a normal, generic "no activity" message.
          if (result.behaviorType !== BehaviorType.NORMAL || !result.description.includes("특정 활동/상황 감지 안됨")) {
            addLog({
              type: result.behaviorType,
              description: result.description,
              location: result.locationGuess || DEFAULT_ANALYSIS_LOCATION,
            });
          }
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [addLog, esp32Url, isDefaultUrl]);


  return (
    <div className="flex flex-col min-h-screen bg-sky-50">
       <div className="flex-grow pb-16" style={{ position: 'relative' }}>
        {Object.entries(PageComponentMap).map(([path, component]) => (
          <div
            key={path}
            style={{ display: location.pathname === path ? 'block' : 'none' }}
            className="page-container h-full w-full"
          >
            {component}
          </div>
        ))}
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
