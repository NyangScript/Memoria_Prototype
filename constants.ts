import { BehaviorType } from './types';

export const ROUTES = {
  HOME: '/',
  ABNORMAL_LOG: '/abnormal-log',
  DANGEROUS_LOG: '/dangerous-log', // Route path remains for simplicity
  CHAT: '/chat', // New route for Chat
  REPORT: '/report',
  REPORT_ERROR: '/report-error',
  SETTINGS: '/settings',
  PROFILE_SETTINGS: '/settings/profile', 
  BLUETOOTH_SETTINGS: '/settings/bluetooth', // 추가
  CAMERA_SETTINGS: '/settings/camera',
  ESP32_URL_SETTINGS: '/settings/esp32-url-config', // New route for ESP32 URL configuration
  WARNING_TEST: '/settings/warning-test', // 경고 테스트 페이지
};

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const DEFAULT_PATIENT_NAME = "환자 이름"; 

export const LOCATIONS = ["Living Room", "Kitchen", "Hallway", "Utility Room", "Bedroom"];
export const DEFAULT_ANALYSIS_LOCATION = "거실"; 

// IMPORTANT: This URL serves as an initial default. Users will configure their specific URL in the app settings.
export const ESP32_WEB_SERVER_URL_DEFAULT = 'http://192.168.0.100';
export const ESP32_URL_STORAGE_KEY = 'memoriaEsp32Url';
export const FLASK_SERVER_URL_DEFAULT = 'http://192.168.0.200:5000';
export const FLASK_URL_STORAGE_KEY = 'memoriaFlaskUrl';


export const GEMINI_ANALYSIS_PROMPT_TEMPLATE = (location: string): string => 
`환자 위치: ${location}.
이미지 속 환자의 행동 및 주요 상황을 분석해주세요.
목표: 이상 행동, 위험 상황(예: 낙상, 화재, 쓰러짐, 배회) 즉시 감지.
분류: 'Abnormal', 'Dangerous', 'Normal' 중 하나로 지정.
설명: 핵심적인 내용만 간결한 한국어로 작성.
응답 형식 (JSON만):
{ "behaviorType": "Abnormal" | "Dangerous" | "Normal", "description": "핵심 한국어 설명" }
참고: 사람 없거나 활동/상황 불명확 시 아래처럼 응답:
{ "behaviorType": "Normal", "description": "특정 활동/상황 감지 안됨 또는 사람 불명확." }`;

export const BEHAVIOR_TYPE_KOREAN: { [key in BehaviorType]: string } = {
  [BehaviorType.ABNORMAL]: "이상 행동",
  [BehaviorType.DANGEROUS]: "위험 상황", // Changed from "위험 행동"
  [BehaviorType.NORMAL]: "정상",
};

export type CameraSource = 'device' | 'esp32';
export const DEFAULT_CAMERA_SOURCE: CameraSource = 'esp32';
export const CAMERA_SOURCE_KEY = 'memoriaCameraSource';

export const DEFAULT_ABNORMAL_CATEGORY_NAME = "기타 이상행동";
export const DEFAULT_DANGEROUS_CATEGORY_NAME = "기타 위험상황"; // Changed from "기타 위험행동"

export const BEHAVIOR_CATEGORIES_MAP: {
  [key in BehaviorType.ABNORMAL | BehaviorType.DANGEROUS]: { [category: string]: string[] }
} = {
  [BehaviorType.ABNORMAL]: {
    "배회/반복": ["배회", "반복적", "서성", "왔다 갔다", "두리번"],
    "수면 문제": ["잠들지 못함", "깨어 있음", "밤새", "잠을 안 자고", "뒤척"],
    "식사/섭식 문제": ["식사 거부", "음식 흘림", "먹지 않음", "삼키지 못함", "사레"],
    "정서적 불안": ["불안", "초조", "슬퍼 보임", "화", "고함", "울음"],
    "인지 혼란": ["혼란", "멍하니", "낯선 사람처럼", "엉뚱한 말", "못 알아봄"],
    [DEFAULT_ABNORMAL_CATEGORY_NAME]: [] 
  },
  [BehaviorType.DANGEROUS]: {
    "낙상/넘어짐": ["낙상", "넘어짐", "쓰러짐", "바닥에", "넘어져", "미끄러짐"],
    "자해/타해": ["자해", "때림", "머리 박음", "할큄", "공격", "폭력적", "물건 던짐"],
    "무반응/응급": ["무반응", "의식 없음", "숨쉬기 어려움", "움직임 없음", "경련", "호흡 곤란"],
    "위험 환경/물건": ["칼", "가위", "뜨거운", "약물", "삼킴", "화기", "위험한 물건"],
    "화재/연기": ["화재", "불", "연기", "타는 냄새", "그을음", "불꽃"], // Added Fire/Smoke category
    [DEFAULT_DANGEROUS_CATEGORY_NAME]: [] 
  }
};

export const mapDescriptionToCategory = (description: string, type: BehaviorType.ABNORMAL | BehaviorType.DANGEROUS): string => {
  const categories = BEHAVIOR_CATEGORIES_MAP[type];
  for (const [categoryName, keywords] of Object.entries(categories)) {
    // Skip the placeholder for default category (empty keywords array) during keyword matching phase
    if (keywords.length === 0 && (categoryName === DEFAULT_ABNORMAL_CATEGORY_NAME || categoryName === DEFAULT_DANGEROUS_CATEGORY_NAME)) {
      continue;
    }
    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        return categoryName;
      }
    }
  }
  return type === BehaviorType.ABNORMAL ? DEFAULT_ABNORMAL_CATEGORY_NAME : DEFAULT_DANGEROUS_CATEGORY_NAME;
};
