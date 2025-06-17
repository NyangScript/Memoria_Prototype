
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import CameraFeed, { CameraFeedHandles } from '../components/CameraFeed';
import BehaviorStatsCard from '../components/BehaviorStatsCard';
import { useBehaviorLogs } from '../contexts/BehaviorLogContext';
import { useUserProfile } from '../contexts/UserProfileContext'; 
import { BehaviorType, AnalysisResponse } from '../types';
import { analyzeBehaviorFromImage } from '../services/geminiService';
import { QuestionMarkCircleIcon, ExclamationTriangleIcon, BellIcon, UserCircleIcon, SparklesIcon, ArrowPathIcon, Cog6ToothIcon } from '../components/icons'; 
import { ROUTES, DEFAULT_ANALYSIS_LOCATION, BEHAVIOR_TYPE_KOREAN, DEFAULT_PATIENT_NAME } from '../constants';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { addLog, abnormalBehaviorCountLastWeek, dangerousBehaviorCountLastWeek } = useBehaviorLogs();
  const { profile, isLoading: isProfileLoading } = useUserProfile(); 
  const cameraFeedRef = useRef<CameraFeedHandles>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnalysis = async () => {
    if (!cameraFeedRef.current) return;

    const frame = cameraFeedRef.current.captureFrame();
    if (!frame) {
      setAnalysisError("카메라 프레임을 캡처할 수 없습니다. 스트림이 올바르게 로드되고 재생 중인지 확인해주세요.");
      setAnalysisResult(null);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      const result = await analyzeBehaviorFromImage(frame, DEFAULT_ANALYSIS_LOCATION);
      setAnalysisResult(result);
      if (result.behaviorType !== BehaviorType.NORMAL) {
        addLog({
          type: result.behaviorType,
          description: result.description,
          location: result.locationGuess || DEFAULT_ANALYSIS_LOCATION,
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setAnalysisError(`분석 오류: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "좋은 아침입니다,";
    if (hour < 18) return "좋은 오후입니다,";
    return "좋은 저녁입니다,";
  }

  const patientDisplayName = isProfileLoading ? "로딩 중..." : (profile.name || DEFAULT_PATIENT_NAME);

  return (
    <PageLayout title="메인 화면">
      <div className="space-y-6">
        {/* User Greeting */}
        <div className="p-5 bg-white rounded-xl shadow-lg flex items-center space-x-4">
          {isProfileLoading ? (
            <UserCircleIcon className="w-16 h-16 text-gray-300 animate-pulse" />
          ) : profile.image ? (
            <img src={profile.image} alt="User" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <UserCircleIcon className="w-16 h-16 text-sky-500" />
          )}
          <div className="flex-grow">
            <p className="text-lg text-gray-600">{getGreeting()}</p>
            <p className="text-2xl font-bold text-sky-700">{patientDisplayName} 님</p>
          </div>
          <button 
            onClick={() => navigate(ROUTES.PROFILE_SETTINGS)} 
            className="p-2 text-gray-500 hover:text-sky-500 transition-colors"
            aria-label="프로필 설정" 
          >
            <Cog6ToothIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Behavior Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BehaviorStatsCard
            title="이상행동 기록"
            count={abnormalBehaviorCountLastWeek}
            icon={<QuestionMarkCircleIcon />}
            linkTo={ROUTES.ABNORMAL_LOG}
            colorClass="text-yellow-500"
          />
          <BehaviorStatsCard
            title="위험상황 기록" // Changed title
            count={dangerousBehaviorCountLastWeek}
            icon={<ExclamationTriangleIcon />}
            linkTo={ROUTES.DANGEROUS_LOG}
            colorClass="text-red-500"
          />
          <BehaviorStatsCard
            title="긴급 신고"
            count={"" as any}
            icon={<BellIcon />}
            linkTo={ROUTES.REPORT}
            colorClass="text-blue-500"
          />
        </div>
        
        {/* Real-time Monitoring & Analysis */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">실시간 촬영 및 분석</h2>
          <CameraFeed ref={cameraFeedRef} />
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-700">정보 및 분석 ({DEFAULT_ANALYSIS_LOCATION})</h3>
              <p className="text-sm text-gray-500">{currentTime.toLocaleTimeString()}</p>
            </div>

            {analysisResult && (
              <div className={`p-3 rounded-md mb-3 text-sm ${
                analysisResult.behaviorType === BehaviorType.DANGEROUS ? 'bg-red-100 text-red-700' :
                analysisResult.behaviorType === BehaviorType.ABNORMAL ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                <strong>분석 결과 ({BEHAVIOR_TYPE_KOREAN[analysisResult.behaviorType]}):</strong> {analysisResult.description}
              </div>
            )}
            {analysisError && (
              <div className="p-3 rounded-md mb-3 bg-red-100 text-red-700 text-sm">
                <strong>오류:</strong> {analysisError}
              </div>
            )}

            <button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  분석 시작
                </>
              )}
            </button>
            {isAnalyzing && <p className="text-xs text-center text-gray-500 mt-2">AI가 화면을 분석하고 있습니다. 잠시만 기다려주세요.</p>}
            {!isAnalyzing && analysisResult && <p className="text-xs text-center text-green-600 mt-2">분석 완료.</p>}
            {!isAnalyzing && !analysisResult && !analysisError && <p className="text-xs text-center text-gray-500 mt-2">버튼을 눌러 화면 분석을 시작하세요.</p>}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MainPage;