
import { GoogleGenAI, GenerateContentResponse, Chat, Content } from "@google/genai";
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
    if (error instanceof Error) {
        // errorMessage = `AI 분석 오류: ${error.message}`; // For developer logging if needed
    }
    return { behaviorType: BehaviorType.NORMAL, description: "AI 분석 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요." };
  }
};


const CHAT_SYSTEM_INSTRUCTION = `You are a friendly and empathetic AI assistant for caregivers. Provide helpful advice, emotional support, and information related to caregiving for patients with conditions like dementia. Your name is Memoria Assistant. Please always answer in Korean.`;

export async function* streamChat(history: Content[], newMessage: string) {
    if (!ai) {
        const mockMessage = "AI 응답 기능이 비활성화 상태입니다. Gemini API 키를 확인해주세요.";
        for (let i = 0; i < mockMessage.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 30));
            yield mockMessage.substring(0, i + 1);
        }
        return;
    }

    try {
        const chat = ai.chats.create({
            model: GEMINI_TEXT_MODEL,
            history,
            config: {
              systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            }
        });

        const result = await chat.sendMessageStream({ message: newMessage });

        for await (const chunk of result) {
            yield chunk.text;
        }
    } catch(error) {
        console.error("Gemini chat error:", error);
        yield "죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.";
    }
}
