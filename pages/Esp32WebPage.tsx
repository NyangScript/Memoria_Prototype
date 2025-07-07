import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useEsp32Config } from '../contexts/Esp32ConfigContext'; // Use new context
import { ROUTES } from '../constants';
import { ArrowPathIcon, ExclamationTriangleIcon, InformationCircleIcon, Cog6ToothIcon } from '../components/icons';

const Esp32WebPage: React.FC = () => {
  const navigate = useNavigate();
  const { esp32Url, isLoading: isLoadingConfig, isDefaultUrl } = useEsp32Config();
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isIframeLoading, setIsIframeLoading] = useState(true); // For iframe's own loading state
  const [error, setError] = useState<string | null>(null);

  const handleReload = useCallback(() => {
    if (isDefaultUrl || isLoadingConfig) return; // Don't reload if URL not set or config is loading
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
    // Basic error, specific errors might depend on browser/server
    setError(`ESP32 웹 페이지(${esp32Url})를 불러오는데 실패했습니다. 다음을 확인해주세요:
      1. ESP32가 켜져 있고 네트워크에 연결되어 있는지.
      2. 설정된 URL이 올바른지 (현재 URL: ${esp32Url}).
      3. 앱과 ESP32가 동일 네트워크에 있는지.`);
  };

  useEffect(() => {
    // This effect primarily handles the initial display state based on config loading and URL validity
    if (!isLoadingConfig && !isDefaultUrl) {
        setIsIframeLoading(true); // Assume iframe will start loading
        setError(null);
    } else if (!isLoadingConfig && isDefaultUrl) {
        setIsIframeLoading(false); // No iframe to load if URL is default/placeholder
    }
  }, [esp32Url, isLoadingConfig, isDefaultUrl]);

  if (isLoadingConfig) {
    return (
      <PageLayout title="ESP32 웹 페이지" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
        <div className="text-center p-10 text-gray-500">ESP32 설정을 불러오는 중...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="ESP32 웹 페이지" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
      <div className="space-y-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-700">ESP32 서버 화면</h2>
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
              {isDefaultUrl && (
                 <button
                    onClick={() => navigate(ROUTES.ESP32_URL_SETTINGS)}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm transition-colors duration-150"
                  >
                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                    URL 설정
                  </button>
              )}
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
                    아래 'URL 설정' 버튼 또는 설정 메뉴를 통해 올바른 주소를 입력해주세요.
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
              {/* Iframe is always in the DOM if not default URL, visibility controlled by opacity and error state overlay */}
              {!isDefaultUrl && (
                 <iframe
                    key={iframeKey}
                    src={error ? 'about:blank' : esp32Url} // Load blank on error to stop potential retries or error messages from iframe itself
                    className={`w-full h-full border-0 ${isIframeLoading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    title="ESP32 Web Page"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads" // Slightly more permissive sandbox
                  />
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Esp32WebPage;