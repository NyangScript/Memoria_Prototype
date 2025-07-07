


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useBehaviorLogs } from '../contexts/BehaviorLogContext';
import { useUserProfile } from '../contexts/UserProfileContext'; 
import { QuestionMarkCircleIcon, ExclamationTriangleIcon, BellIcon, UserCircleIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, InformationCircleIcon, Cog6ToothIcon } from '../components/icons'; 
import { ROUTES, DEFAULT_PATIENT_NAME, DEFAULT_ANALYSIS_LOCATION } from '../constants';
import BehaviorStatsCard from '../components/BehaviorStatsCard';
import { useEsp32Config } from '../contexts/Esp32ConfigContext';
import { AnalysisResponse, BehaviorType } from '../types';

const QuickActions: React.FC<{
  abnormalCount: number;
  dangerousCount: number;
}> = ({ abnormalCount, dangerousCount }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
       <BehaviorStatsCard
        title="이상행동"
        count={abnormalCount}
        icon={<QuestionMarkCircleIcon />}
        linkTo={ROUTES.ABNORMAL_LOG}
        colorClass="text-yellow-500"
      />
      <BehaviorStatsCard
        title="위험상황"
        count={dangerousCount}
        icon={<ExclamationTriangleIcon />}
        linkTo={ROUTES.DANGEROUS_LOG}
        colorClass="text-red-500"
      />
      <BehaviorStatsCard
        title="긴급 신고"
        count=""
        icon={<BellIcon />}
        linkTo={ROUTES.REPORT}
        colorClass="text-blue-500"
      />
    </div>
  );
};


const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { addLog, abnormalBehaviorCountLastWeek, dangerousBehaviorCountLastWeek } = useBehaviorLogs();
  const { profile, isLoading: isProfileLoading } = useUserProfile(); 
  const [currentTime, setCurrentTime] = useState(new Date());

  const { esp32Url, isLoading: isLoadingConfig, isDefaultUrl } = useEsp32Config();
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
        try {
            // Very basic origin check. A production app should be more specific.
            if (new URL(event.origin).origin !== new URL(esp32Url).origin) {
                return;
            }
        } catch (e) {
            return; // Ignore if URLs are invalid
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
    return () => {
        window.removeEventListener('message', handleIframeMessage);
    };
  }, [addLog, esp32Url]);


  const handleReload = useCallback(() => {
    if (isDefaultUrl || isLoadingConfig) return;
    setIsIframeLoading(true);
    setError(null);
    setIframeKey(Date.now());
  }, [isDefaultUrl, isLoadingConfig]);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    setError(null);
  };

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsIframeLoading(false);
    setError(`ESP32 웹 페이지(${esp32Url})를 불러오는데 실패했습니다. 다음을 확인해주세요:
      1. ESP32가 켜져 있고 네트워크에 연결되어 있는지.
      2. 설정된 URL이 올바른지 (현재 URL: ${esp32Url}).
      3. 앱과 ESP32가 동일 네트워크에 있는지.`);
  };

  useEffect(() => {
    if (!isLoadingConfig && !isDefaultUrl) {
        setIsIframeLoading(true); // Assume iframe will start loading
        setError(null);
    } else if (!isLoadingConfig && isDefaultUrl) {
        setIsIframeLoading(false); // No iframe to load if URL is default/placeholder
    }
  }, [esp32Url, isLoadingConfig, isDefaultUrl]);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "좋은 아침입니다,";
    if (hour < 18) return "좋은 오후입니다,";
    return "좋은 저녁입니다,";
  }

  const patientDisplayName = isProfileLoading ? "로딩 중..." : (profile.name || DEFAULT_PATIENT_NAME);

  return (
    <PageLayout title="메인 화면">
      <div className="space-y-4">
        {/* User Greeting */}
        <div className="p-5 bg-white rounded-xl shadow-lg flex items-center space-x-4">
          {isProfileLoading ? (
            <UserCircleIcon className="w-14 h-14 text-gray-300 animate-pulse flex-shrink-0" />
          ) : profile.image ? (
            <img src={profile.image} alt="User" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <UserCircleIcon className="w-14 h-14 text-sky-500 flex-shrink-0" />
          )}
          <div className="flex-grow min-w-0">
            <p className="text-lg text-gray-600">{getGreeting()}</p>
            <p className="text-2xl font-bold text-sky-700 whitespace-nowrap overflow-hidden text-ellipsis">{patientDisplayName} 님</p>
          </div>
          <button 
            onClick={() => navigate(ROUTES.SETTINGS)} 
            className="p-3 text-gray-500 hover:bg-gray-100 hover:text-sky-500 rounded-full transition-colors flex-shrink-0"
            aria-label="설정" 
          >
            <AdjustmentsHorizontalIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Quick Actions */}
        <QuickActions 
          abnormalCount={abnormalBehaviorCountLastWeek} 
          dangerousCount={dangerousBehaviorCountLastWeek} 
        />
        
        {/* ESP32 Web View */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-700">실시간 촬영 및 분석 (ESP32)</h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={handleReload}
                disabled={isIframeLoading || isDefaultUrl || isLoadingConfig}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="ESP32 웹 페이지 새로고침"
              >
                <ArrowPathIcon className={`w-5 h-5 mr-2 ${isIframeLoading && !isDefaultUrl ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>

          {isDefaultUrl ? (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
              <div className="flex items-start">
                <InformationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">ESP32 서버 주소 설정 필요</p>
                  <p className="text-sm">
                    ESP32 웹 서버의 주소가 설정되지 않았습니다. '{esp32Url}'는 유효한 주소가 아닙니다. 
                    설정 메뉴를 통해 올바른 주소를 입력해주세요.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.ESP32_URL_SETTINGS)}
                    className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-1.5" />
                    지금 URL 설정하기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-[80vh] border border-gray-300 rounded-md overflow-hidden bg-gray-100">
              {(isIframeLoading && !error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-85 z-10">
                  <ArrowPathIcon className="w-12 h-12 text-sky-500 animate-spin mb-3" />
                  <p className="text-gray-600">ESP32 페이지 로딩 중...</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{esp32Url}</p>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4 text-center z-10">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
                  <p className="text-red-700 font-semibold">오류 발생</p>
                  <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
                   <button
                    onClick={() => navigate(ROUTES.ESP32_URL_SETTINGS)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                    URL 설정 확인/변경
                  </button>
                </div>
              )}
              {!isDefaultUrl && (
                 <iframe
                    key={iframeKey}
                    src={error ? 'about:blank' : esp32Url}
                    className={`w-full h-full border-0 ${isIframeLoading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    title="ESP32 Web Page"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads"
                  />
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MainPage;
