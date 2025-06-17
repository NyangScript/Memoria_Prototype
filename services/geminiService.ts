
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_ANALYSIS_PROMPT_TEMPLATE } from '../constants';
import { AnalysisResponse, BehaviorType } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API 키가 설정되지 않았습니다. AI 기능이 비활성화됩니다.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const analyzeBehaviorFromImage = async (
  base64ImageData: string, // Expects base64 string without data:image/jpeg;base64,
  location: string
): Promise<AnalysisResponse> => {
  if (!ai) {
    console.warn("Gemini AI 클라이언트가 API 키 누락으로 초기화되지 않았습니다. 모의 응답을 사용합니다.");
    // Fallback to a default response or simulate analysis
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const mockResponses: AnalysisResponse[] = [
        { behaviorType: BehaviorType.NORMAL, description: "환자가 편안하게 쉬고 있습니다." },
        { behaviorType: BehaviorType.ABNORMAL, description: "환자가 목적 없이 배회하는 것처럼 보입니다." },
        { behaviorType: BehaviorType.DANGEROUS, description: "환자가 테이블 근처에서 넘어졌습니다." },
    ];
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData,
    },
  };

  const textPart = {
    text: GEMINI_ANALYSIS_PROMPT_TEMPLATE(location),
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } // Added for lower latency
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as AnalysisResponse;
    
    if (parsedData && Object.values(BehaviorType).includes(parsedData.behaviorType) && typeof parsedData.description === 'string') {
        return parsedData;
    } else {
        console.error("Gemini로부터 예상치 못한 JSON 구조:", parsedData);
        return { behaviorType: BehaviorType.NORMAL, description: "AI로부터 예상치 못한 데이터 형식을 받았습니다." };
    }
  } catch (error) {
    console.error("Gemini 이미지 분석 오류:", error);
    // let errorMessage = "행동 분석에 실패했습니다. 다시 시도해주세요."; // Original variable, can be kept or removed if not used below directly for return
    if (error instanceof Error) {
        // errorMessage = `AI 분석 오류: ${error.message}`; // For developer logging if needed
    }
    return { behaviorType: BehaviorType.NORMAL, description: "AI 분석 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요." };
  }
};