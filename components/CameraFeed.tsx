import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon, ExclamationTriangleIcon, Cog6ToothIcon, ArrowPathIcon } from './icons';
import { useCameraSettings } from '../contexts/CameraSettingsContext';
import { useEsp32Config } from '../contexts/Esp32ConfigContext';
import { DEFAULT_CAMERA_SOURCE, ROUTES } from '../constants';

export interface CameraFeedHandles {
  captureFrame: () => string | null;
}

interface CameraFeedProps {}

type CameraStatus = 
  | 'idle' 
  | 'loadingSettings' 
  | 'loadingEsp32Config'
  | 'esp32UrlNotConfigured'
  | 'needsInteraction' 
  | 'initializing' 
  | 'streaming' 
  | 'error';

const CameraFeed = forwardRef<CameraFeedHandles, CameraFeedProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cameraSource, isLoading: isLoadingSettings } = useCameraSettings();
  const { esp32Url, isLoading: isLoadingEsp32Config, isDefaultUrl } = useEsp32Config();
  const navigate = useNavigate();

  const currentStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessageLocal] = useState<string | null>(null);

  const setError = useCallback((message: string | null) => {
    setErrorMessageLocal(message);
    setStatus(message ? 'error' : 'idle');
  }, [setErrorMessageLocal, setStatus]); // Corrected dependencies

  const cleanupPreviousStream = useCallback(() => {
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
    }
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.src = "";
      videoElement.srcObject = null;
      videoElement.oncanplay = null;
      videoElement.onerror = null;
      videoElement.load();
    }
  }, []);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    cleanupPreviousStream();
    setError(null); // Resets error message and sets status to 'idle'

    if (isLoadingSettings) {
      setStatus('loadingSettings');
      return;
    }

    if (cameraSource === 'esp32') {
      if (isLoadingEsp32Config) {
        setStatus('loadingEsp32Config');
        return;
      }
      if (isDefaultUrl) {
        setStatus('esp32UrlNotConfigured');
        return;
      }

      setStatus('initializing');
      videoElement.src = esp32Url;
      
      const handleCanPlayEsp = () => {
        setStatus('streaming');
        videoElement.play().catch(playError => {
          console.warn(`ESP32 Stream (${esp32Url}) play prevented:`, playError);
          setError(`ESP32 스트림 자동 재생에 실패했습니다.`); // Use setError
        });
      };
      const handleErrorEsp = () => {
        setError(`ESP32 영상 스트림(${esp32Url})을 불러올 수 없습니다. URL 및 ESP32 연결 상태를 확인해주세요.`); // Use setError
      };

      videoElement.addEventListener('canplay', handleCanPlayEsp);
      videoElement.addEventListener('error', handleErrorEsp);
      videoElement.load();

      return () => {
        videoElement.removeEventListener('canplay', handleCanPlayEsp);
        videoElement.removeEventListener('error', handleErrorEsp);
        cleanupPreviousStream();
      };

    } else if (cameraSource === 'device') {
      setStatus('needsInteraction');
    } else {
      setError(`알 수 없는 카메라 소스: ${cameraSource}. 기본값(${DEFAULT_CAMERA_SOURCE})으로 시도합니다.`); // Use setError
    }
  }, [cameraSource, isLoadingSettings, esp32Url, isLoadingEsp32Config, isDefaultUrl, cleanupPreviousStream, setError, setStatus]); // Added setStatus


  const initializeDeviceCamera = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      setError("비디오 요소를 찾을 수 없습니다.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("브라우저에서 카메라 접근 기능을 지원하지 않습니다.");
      return;
    }

    setStatus('initializing'); 
    // setError(null) was called at the start of the main effect, so specific error reset here might not be needed unless this function is called out of that flow.
    // For safety, ensuring no previous error message persists if initialization starts:
    setErrorMessageLocal(null);


    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      currentStreamRef.current = stream;
      videoElement.srcObject = stream;
      
      videoElement.oncanplay = () => {
        setStatus('streaming');
        videoElement.play().catch(playError => {
          console.warn("Device camera play prevented:", playError);
          setError("기기 카메라 재생에 실패했습니다. 권한을 확인해주세요.");
        });
      };
      videoElement.onerror = () => {
        setError("기기 카메라 스트림에 문제가 발생했습니다.");
      };

    } catch (err: any) {
      console.error("Error accessing device camera:", err);
      let msg = `기기 카메라 오류: ${err.message}`;
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "사용 가능한 카메라를 찾을 수 없습니다.";
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "카메라 접근 권한이 거부되었습니다. 앱의 권한 설정을 확인하고, 카메라 시작 버튼을 다시 눌러주세요.";
      } else if (err.name === "NotReadableError") {
        msg = "카메라를 사용할 수 없습니다. 다른 앱에서 사용 중이거나 하드웨어 문제일 수 있습니다.";
      }
      setError(msg);
    }
  }, [setError, setStatus, setErrorMessageLocal]); // Added setStatus, setErrorMessageLocal

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (videoRef.current && canvasRef.current && status === 'streaming' && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; 
        }
      }
      if (status !== 'streaming') {
         console.warn("Capture frame called but camera is not streaming. Status:", status);
      } else if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)){
         console.warn("Capture frame called but video dimensions are zero.");
      } else if (videoRef.current && videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
         console.warn("Capture frame called but video not ready (readyState).");
      }
      return null;
    }
  }), [status]);

  return (
    <div className="relative w-full aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        crossOrigin="anonymous" 
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {status === 'loadingSettings' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-85 text-white p-4 text-center">
          <VideoCameraIcon className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
          <p className="text-lg">카메라 설정 로딩 중...</p>
        </div>
      )}

      {status === 'loadingEsp32Config' && cameraSource === 'esp32' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-85 text-white p-4 text-center">
          <ArrowPathIcon className="w-16 h-16 mb-4 opacity-50 animate-spin" />
          <p className="text-lg">ESP32 서버 주소 로딩 중...</p>
        </div>
      )}

      {status === 'esp32UrlNotConfigured' && cameraSource === 'esp32' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-100 text-yellow-800 p-4 text-center">
          <Cog6ToothIcon className="w-16 h-16 mb-4 opacity-75" />
          <p className="text-lg font-semibold mb-2">ESP32 서버 주소 필요</p>
          <p className="text-sm mb-4">ESP32 카메라 스트림을 사용하려면 먼저 ESP32의 웹 서버 주소를 설정해야 합니다.</p>
          <button
            onClick={() => navigate(ROUTES.ESP32_URL_SETTINGS)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-colors text-base"
            aria-label="ESP32 서버 주소 설정으로 이동"
          >
            주소 설정하기
          </button>
        </div>
      )}

      {status === 'needsInteraction' && cameraSource === 'device' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-90 text-white p-4 text-center z-10">
          <VideoCameraIcon className="w-16 h-16 mb-4 opacity-75" />
          <p className="text-lg mb-4">기기 카메라를 사용하려면 시작 버튼을 눌러주세요.</p>
          <p className="text-xs mb-4 text-gray-300">카메라 접근 권한 요청이 표시될 수 있습니다.</p>
          <button
            onClick={initializeDeviceCamera}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-colors text-base"
            aria-label="기기 카메라 시작"
          >
            카메라 시작
          </button>
        </div>
      )}
      
      {status === 'initializing' && !isLoadingSettings && !isLoadingEsp32Config && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-85 text-white p-4 text-center">
          <VideoCameraIcon className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
          <p className="text-lg">
            {cameraSource === 'esp32' ? 
              `ESP32 스트림 로딩 중...` : 
              "기기 카메라 시작 중..."}
          </p>
          {cameraSource === 'esp32' && <p className="text-sm mt-1 text-gray-300">URL: {esp32Url}</p>}
          {cameraSource === 'esp32' && <p className="text-xs mt-1 text-gray-400">ESP32 모듈 연결 및 스트림 활성화를 확인하세요.</p>}
          {cameraSource === 'device' && <p className="text-xs mt-1 text-gray-400">카메라 권한을 허용해주세요.</p>}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 text-red-700 p-4 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 mb-3" />
          <p className="font-semibold">카메라 오류</p>
          <p className="text-sm mt-1 mb-3">{errorMessage}</p>
          {cameraSource === 'device' && errorMessage.includes("권한") && (
             <button
                onClick={initializeDeviceCamera}
                className="mt-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm"
                aria-label="카메라 시작 재시도"
             >
              재시도
            </button>
          )}
           {cameraSource === 'esp32' && ( // Show config button for any ESP32 error
             <button
                onClick={() => navigate(ROUTES.ESP32_URL_SETTINGS)}
                className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm"
                aria-label="ESP32 서버 주소 설정 확인"
             >
              URL 설정 확인
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default CameraFeed;