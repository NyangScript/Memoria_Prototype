import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useEsp32Config } from '../contexts/Esp32ConfigContext';
import { ROUTES } from '../constants';
import { ServerStackIcon } from '../components/icons';

const Esp32UrlSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { esp32Url: currentUrl, updateEsp32Url, isLoading: isLoadingConfig } = useEsp32Config();
  const [urlInput, setUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingConfig) {
      setUrlInput(currentUrl);
    }
  }, [currentUrl, isLoadingConfig]);

  const isValidHttpUrl = (string: string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  };

  const handleSave = async () => {
    setError(null);
    if (!urlInput.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }
    if (!isValidHttpUrl(urlInput.trim())) {
      setError("유효한 URL 형식이 아닙니다. (예: http://192.168.1.100)");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    
    updateEsp32Url(urlInput.trim());

    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate save delay
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
        setSaveSuccess(false);
    }, 2500);
  };

  if (isLoadingConfig) {
    return (
      <PageLayout title="ESP32 서버 주소 설정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
        <div className="text-center p-10 text-gray-500">설정 정보를 불러오는 중...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="ESP32 서버 주소 설정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
            <ServerStackIcon className="w-16 h-16 text-sky-500 mb-3" />
            <h2 className="text-xl font-semibold text-gray-800">ESP32 웹 서버 주소</h2>
            <p className="text-sm text-gray-500 mt-1">ESP32에서 실행 중인 웹 서버의 전체 URL을 입력하세요.</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="esp32Url" className="block text-sm font-medium text-gray-700 mb-1">
              서버 URL (예: http://192.168.1.123)
            </label>
            <input
              type="url"
              id="esp32Url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors"
              placeholder="http://YOUR_ESP32_IP_ADDRESS"
              disabled={isSaving}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || isLoadingConfig || urlInput === currentUrl}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            aria-live="polite"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              '주소 저장'
            )}
          </button>
          {saveSuccess && (
            <p className="text-sm text-green-600 text-center mt-2" role="status">ESP32 서버 주소가 성공적으로 저장되었습니다!</p>
          )}
          {!isSaving && !saveSuccess && !error && urlInput === currentUrl && (
             <p className="text-sm text-gray-500 text-center mt-2">현재 저장된 주소와 동일합니다.</p>
          )}
        </div>
        <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p><strong>참고:</strong> ESP32 장치가 Memoria 앱을 실행하는 기기와 동일한 Wi-Fi 네트워크에 연결되어 있는지 확인해주세요.</p>
            <p className="mt-1">URL은 프로토콜(http:// 또는 https://)을 포함해야 합니다. 일반적으로 ESP32는 http://를 사용합니다.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Esp32UrlSettingsPage;