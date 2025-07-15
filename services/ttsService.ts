import { TextToSpeech } from '@capacitor-community/text-to-speech';

export async function playNativeTTS(text: string) {
  await TextToSpeech.speak({
    text,
    lang: 'ko-KR',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    category: 'ambient'
  });
} 