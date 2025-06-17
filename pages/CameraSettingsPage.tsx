import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useCameraSettings } from '../contexts/CameraSettingsContext';
import { ROUTES, CameraSource, DEFAULT_CAMERA_SOURCE } from '../constants';
import { VideoCameraIcon, Cog6ToothIcon } from '../components/icons'; // Using Cog6ToothIcon as a generic icon for ESP32

const CameraSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cameraSource: currentSource, updateCameraSource, isLoading: isLoadingSettings } = useCameraSettings();
  const [selectedSource, setSelectedSource] = useState<CameraSource>(DEFAULT_CAMERA_SOURCE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isLoadingSettings) {
      setSelectedSource(currentSource);
    }
  }, [currentSource, isLoadingSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    updateCameraSource(selectedSource);

    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate save delay
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
        setSaveSuccess(false);
    }, 2500);
  };

  if (isLoadingSettings) {
    return (
      <PageLayout title="카메라 설정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
        <div className="text-center p-10 text-gray-500">카메라 설정을 불러오는 중...</div>
      </PageLayout>
    );
  }
  
  const cameraOptions: { value: CameraSource, label: string, description: string, icon: React.FC<any> }[] = [
    { value: 'esp32', label: 'ESP32 카메라 스트림', description: '외부 ESP32 카메라 모듈의 영상 스트림을 사용합니다.', icon: Cog6ToothIcon },
    { value: 'device', label: '기기 내장 카메라', description: '현재 사용 중인 기기의 내장 카메라를 사용합니다.', icon: VideoCameraIcon },
  ];

  return (
    <PageLayout title="카메라 설정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">카메라 소스 선택</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">앱에서 사용할 기본 카메라를 선택해주세요.</p>
        
        <fieldset className="space-y-4">
          <legend className="sr-only">카메라 소스</legend>
          {cameraOptions.map((option) => (
            <div key={option.value} 
                 className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-150 ${selectedSource === option.value ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
                 onClick={() => setSelectedSource(option.value)}
                 onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSource(option.value);}}
                 tabIndex={0}
                 role="radio"
                 aria-checked={selectedSource === option.value}
            >
              <div className="flex items-center h-5 mr-3">
                <input
                  id={`camera-source-${option.value}`}
                  name="camera-source"
                  type="radio"
                  value={option.value}
                  checked={selectedSource === option.value}
                  onChange={() => setSelectedSource(option.value)}
                  className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300"
                  aria-describedby={`camera-source-${option.value}-description`}
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <label htmlFor={`camera-source-${option.value}`} className="font-medium text-gray-800 flex items-center">
                  <option.icon className={`w-5 h-5 mr-2 ${selectedSource === option.value ? 'text-sky-600' : 'text-gray-500'}`} />
                  {option.label}
                </label>
                <p id={`camera-source-${option.value}-description`} className="text-gray-500 text-xs mt-1">{option.description}</p>
              </div>
               {selectedSource === option.value && (
                <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-sky-100 bg-sky-500 rounded-full">선택됨</span>
              )}
            </div>
          ))}
        </fieldset>

        {selectedSource === 'device' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-700 text-sm">
                <p><strong>참고:</strong> 기기 카메라 사용 시 브라우저에서 카메라 접근 권한 요청이 표시될 수 있습니다. 원활한 사용을 위해 권한을 허용해주세요.</p>
            </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || isLoadingSettings || currentSource === selectedSource}
          className="w-full mt-8 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          aria-live="polite"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              설정 저장 중...
            </>
          ) : (
            '선택사항 저장'
          )}
        </button>
        {saveSuccess && (
          <p className="text-sm text-green-600 text-center mt-3" role="status">카메라 설정이 성공적으로 저장되었습니다!</p>
        )}
         { !isSaving && !saveSuccess && currentSource === selectedSource &&
           <p className="text-sm text-gray-500 text-center mt-3">현재 설정과 동일합니다.</p>
         }
      </div>
    </PageLayout>
  );
};

export default CameraSettingsPage;