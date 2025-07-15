#include "esp_camera.h"
#include "WiFi.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "soc/soc.h"          // Disable brownout problems
#include "soc/rtc_cntl_reg.h" // Disable brownout problems
#include "driver/rtc_io.h"
#include <WebServer.h> // ESP32 WebServer 라이브러리 사용
#include <ESPAsyncWebServer.h> // ESPAsyncWebServer 라이브러리 사용


// WARNING!!! Make sure that public ssh key is changed in examples/ota_verify_ant_rollback/main/ota_verify_example_main.c
// Otherwise OTA verification will fail
#define PART_BOUNDARY "123456789000000000000987654321"

// ESP32-S3 AI Camera PIN Map
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     5
#define Y9_GPIO_NUM       4
#define Y8_GPIO_NUM       6
#define Y7_GPIO_NUM       7
#define Y6_GPIO_NUM       14
#define Y5_GPIO_NUM       17
#define Y4_GPIO_NUM       21
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM       16
#define VSYNC_GPIO_NUM    1
#define HREF_GPIO_NUM     2
#define PCLK_GPIO_NUM     15
#define SIOD_GPIO_NUM  8
#define SIOC_GPIO_NUM  9

// Wi-Fi Credentials
const char* ssid = "2F-CR1_CR2";         // 실제 Wi-Fi SSID로 변경
const char* password = "WMS1348B2F"; // 실제 Wi-Fi 비밀번호로 변경


AsyncWebServer server(80); // HTTP 서버 포트 80번
AsyncWebServer streamServer(81); // MJPEG 스트리밍 서버 포트 81번


static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n"; // Boundary corrected
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";


// Forward declarations
void handleRoot();
void handleStream();
void handleNotFound();
void handleLatestAnalysis();
void handleUpdateAnalysis();


struct AnalysisResult {
  String behaviorType;
  String description;
  String timestamp;
};

AnalysisResult latestResult;


void updateLatestResult(String type, String desc) {
  latestResult.behaviorType = type;
  latestResult.description = desc;
  latestResult.timestamp = String(millis()); // 실제로는 ISO8601 시간 추천
}


void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // 카메라 설정 최적화 (OV2640/OV5640 모두 호환)
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  // 해상도/품질 최적화
  config.frame_size = FRAMESIZE_VGA; // 640x480 (OV2640/OV5640 모두 지원)
  config.pixel_format = PIXFORMAT_JPEG;  // for streaming
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 18; // 15~20 권장 (값이 높을수록 압축률↑, 속도↑, 화질↓)
  config.fb_count = 1;

  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 18;
      config.fb_count = 2;
      config.grab_mode = CAMERA_GRAB_LATEST;
    } else {
      config.frame_size = FRAMESIZE_QVGA; // 320x240 (RAM 부족 시)
      config.fb_location = CAMERA_FB_IN_DRAM;
      config.jpeg_quality = 20;
      config.fb_count = 1;
    }
  } else {
    config.frame_size = FRAMESIZE_240X240;
#if CONFIG_IDF_TARGET_ESP32S3
    config.fb_count = 2;
#endif
  }

#if defined(CAMERA_MODEL_ESP_EYE)
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  // 카메라 초기화
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  Serial.println("카메라 초기화 성공");

  // 카메라 센서 설정
  sensor_t * s = esp_camera_sensor_get();
  if (s) {
    s->set_vflip(s, 1);  // 수직 뒤집기
    s->set_hmirror(s, 1);  // 수평 뒤집기
  }

  // Wi-Fi 연결
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  Serial.print("WiFi 연결 중...");
  
  int wifi_retry = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_retry < 20) {
    delay(500);
    Serial.print(".");
    wifi_retry++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi 연결 실패");
    return;
  }
  
  Serial.println("\nWiFi 연결 성공");
  Serial.print("IP 주소: ");
  Serial.println(WiFi.localIP());

  // 웹 서버 핸들러 설정
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta charset='utf-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'>";
    html += "<title>실시간 촬영 및 분석</title>";
    html += "<style>";
    html += "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }";
    html += "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5; color: #1f2937; line-height: 1.6; }";
    html += ".container { max-width: 600px; margin: 1rem auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); overflow: hidden; }";
    
    html += ".header { background-color: #ffffff; padding: 1.25rem; border-bottom: 1px solid #e5e7eb; text-align: center; }";
    html += ".header h1 { font-size: 1.5rem; font-weight: 600; color: #111827; }";

    html += ".video-container { width: calc(100% - 2.5rem); margin: 1.25rem auto; position: relative; background-color: #111827; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); aspect-ratio: 4/3; }";
    html += "#video-stream { width: 100%; height: 100%; object-fit: cover; display: block; }";

    html += ".info-panel { padding: 0 1.25rem 1.25rem; }";
    html += ".info-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }";
    html += ".info-panel-header h2 { font-size: 1.125rem; font-weight: 600; color: #1f2937; }";
    html += "#current-time { font-size: 0.875rem; color: #4b5563; }";

    html += "#analysis-status, #analysis-result, .explanatory-text { text-align: center; margin-top: 0.75rem; font-size: 0.875rem; }";
    html += "#analysis-status { color: #4b5563; min-height: 1.2em; }";
    html += ".explanatory-text { color: #6b7280; }";
    
    html += "</style>";
    html += "</head><body>";

    html += "<div class='container'>";
    html += "<div class='header'><h1>실시간 촬영 및 분석</h1></div>";
    html += "<div class='video-container'><img id='video-stream' src='http://" + WiFi.localIP().toString() + ":81/stream' crossorigin='anonymous'></div>";
    
    html += "<div class='info-panel'>";
    html += "<div class='info-panel-header'><h2>정보 및 분석 (거실)</h2><span id='current-time'>로딩 중...</span></div>";
    html += "<div id='analysis-status'>초기화 중...</div>";
    html += "<div id='analysis-result'></div>";
    html += "<p class='explanatory-text'>자동 분석이 곧 시작됩니다.</p>";
    html += "</div>";
    
    html += "</div>";

    html += "<script>";
    html += "const GEMINI_API_KEY = 'AIzaSyCK5WE5NxHlCHQGd5agdkl5dZs0KLgFIXM';"; // This should be securely managed
    html += "const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=' + GEMINI_API_KEY;";
    html += "let isAnalyzing = false;";

    html += "function updateTime() { const now = new Date(); document.getElementById('current-time').textContent = now.toLocaleTimeString('ko-KR'); }";
    html += "setInterval(updateTime, 1000); updateTime();";

    html += "function captureFrame() {";
    html += "  const video = document.getElementById('video-stream');";
    html += "  if (!video || !video.naturalWidth || !video.naturalHeight) { return null; }";
    html += "  const canvas = document.createElement('canvas');";
    html += "  canvas.width = video.naturalWidth;";
    html += "  canvas.height = video.naturalHeight;";
    html += "  const context = canvas.getContext('2d');";
    html += "  context.drawImage(video, 0, 0, canvas.width, canvas.height);";
    html += "  return canvas.toDataURL('image/jpeg').split(',')[1];";
    html += "}";

    html += "async function analyzeImage(base64Image) {";
    html += "  try {";
    html += "    const prompt = `환자 위치: 거실.\\n` +";
    html += "      `이미지 속 환자의 행동 및 주요 상황을 분석해주세요.\\n` +";
    html += "      `목표: 이상 행동, 위험 상황(예: 낙상, 화재, 쓰러짐, 배회) 즉시 감지.\\n` +";
    html += "      `분류: 'Abnormal', 'Dangerous', 'Normal' 중 하나로 지정.\\n` +";
    html += "      `설명: 핵심적인 내용만 간결한 한국어로 작성.\\n` +";
    html += "      `경고 메시지: 환자에게 직접 전달할 음성 경고 메시지를 작성. 치매 어르신이 이해하기 쉬운 간단하고 명확한 한국어로 작성.\\n` +";
    html += "      `응답 형식 (JSON만):\\n` +";
    html += "      `{ \\\"behaviorType\\\": \\\"Abnormal\\\" | \\\"Dangerous\\\" | \\\"Normal\\\", \\\"description\\\": \\\"핵심 한국어 설명\\\", \\\"warningMessage\\\": \\\"환자에게 전달할 음성 경고 메시지\\\" }\\n` +";
    html += "      `참고: 사람 없거나 활동/상황 불명확 시 아래처럼 응답:\\n` +";
    html += "      `{ \\\"behaviorType\\\": \\\"Normal\\\", \\\"description\\\": \\\"특정 활동/상황 감지 안됨 또는 사람 불명확.\\\", \\\"warningMessage\\\": \\\"\\\"}`;";

    html += "    const response = await fetch(GEMINI_API_URL, {";
    html += "      method: 'POST',";
    html += "      headers: { 'Content-Type': 'application/json' },";
    html += "      body: JSON.stringify({";
    html += "        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] }]";
    html += "      })";
    html += "    });";

    html += "    if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);";
    
    html += "    const data = await response.json();";
    html += "    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {";
    html += "      let textResponse = data.candidates[0].content.parts[0].text.trim();";
    html += "      if (textResponse.startsWith('```')) { textResponse = textResponse.split('```')[1] || textResponse; }";
    html += "      textResponse = textResponse.replace('json', '').trim();";
    html += "      const result = JSON.parse(textResponse);";
    html += "      // ESP32에 분석 결과 업데이트 요청";
    html += "      fetch('/update_analysis', {";
    html += "        method: 'POST',";
    html += "        headers: { 'Content-Type': 'application/json' },";
    html += "        body: JSON.stringify(result)";
    html += "      }).catch(err => console.log('ESP32 업데이트 실패:', err));";
    html += "      return result;";
    html += "    }";
    html += "    return null;";
    html += "  } catch (error) {";
    html += "    console.error('분석 중 오류 발생:', error); return null;";
    html += "  }";
    html += "}";

    html += "function updateUI(analysisResult) {";
    html += "  const resultDiv = document.getElementById('analysis-result');";
    html += "  resultDiv.innerHTML = '';";
    html += "  if (!analysisResult || !analysisResult.behaviorType || !analysisResult.description) {";
    html += "    resultDiv.innerHTML = '<div style=\"padding:10px;margin:4px 0;border-radius:5px;background-color:#fee2e2;color:#b91c1c;\"><strong>오류:</strong> 잘못된 분석 결과 형식입니다.</div>';";
    html += "    return;";
    html += "  }";
    html += "  const msg = document.createElement('div');";
    html += "  let statusText = '', bgColor = '#f3f4f6', textColor = '#1f2937';";
    html += "  switch (analysisResult.behaviorType) {";
    html += "    case 'Dangerous': statusText = '위험 상황'; bgColor = '#fee2e2'; textColor = '#991b1b'; break;";
    html += "    case 'Abnormal': statusText = '이상 행동'; bgColor = '#fef3c7'; textColor = '#92400e'; break;";
    html += "    case 'Normal': statusText = '정상'; bgColor = '#d1fae5'; textColor = '#065f46'; break;";
    html += "  }";
    html += "  msg.innerHTML = `<strong>분석 결과 (${statusText}):</strong> ${analysisResult.description}`;";
    html += "  msg.style.background = bgColor;";
    html += "  msg.style.color = textColor;";
    html += "  msg.style.padding = '10px';";
    html += "  msg.style.margin = '4px 0';";
    html += "  msg.style.borderRadius = '8px';";
    html += "  resultDiv.appendChild(msg);";
    html += "}";

    html += "async function performAnalysis() {";
    html += "  const statusDiv = document.getElementById('analysis-status');";
    html += "  if (isAnalyzing) return;";
    html += "  isAnalyzing = true;";
    html += "  statusDiv.textContent = '자동 분석 중...';";
    html += "  const base64Image = captureFrame();";
    html += "  if (base64Image) {";
    html += "    try {";
    html += "      const result = await analyzeImage(base64Image);";
    html += "      if (result) {";
    html += "        if (window.parent) {";
    html += "          window.parent.postMessage({ type: 'MEMORIA_ANALYSIS_RESULT', payload: { ...result, locationGuess: '거실' } }, '*');";
    html += "        }";
    html += "        updateUI(result);";
    html += "        statusDiv.textContent = '마지막 분석: ' + new Date().toLocaleTimeString('ko-KR');";
    html += "      } else {";
    html += "        statusDiv.textContent = '분석 실패. 10초 후 재시도...';";
    html += "      }";
    html += "    } catch (error) {";
    html += "      console.error('분석 중 오류:', error);";
    html += "      statusDiv.textContent = '오류 발생. 10초 후 재시도...';";
    html += "    }";
    html += "  } else {";
    html += "    statusDiv.textContent = '이미지 캡처 실패. 10초 후 재시도...';";
    html += "  }";
    html += "  isAnalyzing = false;";
    html += "}";

    html += "window.addEventListener('load', () => {";
    html += "  document.querySelector('.explanatory-text').textContent = '10초마다 자동으로 화면을 분석하고 있습니다.';";
    html += "  setTimeout(performAnalysis, 2000);"; // Initial delay to ensure stream is ready
    html += "  setInterval(performAnalysis, 10000);";
    html += "});";
    html += "</script>";
    html += "</body></html>";
    request->send(200, "text/html", html);
  });

  server.on("/latest_analysis", HTTP_GET, [](AsyncWebServerRequest *request){
    String json = "{";
    json += "\"behaviorType\":\"" + latestResult.behaviorType + "\",";
    json += "\"description\":\"" + latestResult.description + "\",";
    json += "\"timestamp\":\"" + latestResult.timestamp + "\"";
    json += "}";
    request->send(200, "application/json", json);
  });

  // POST 핸들러는 응답만 (body 처리는 onRequestBody에서)
  server.on("/update_analysis", HTTP_POST, [](AsyncWebServerRequest *request){
    // 응답은 onRequestBody에서 처리
  });

  // POST body 데이터 처리 (최상단에 한 번만 등록)
  server.onRequestBody([](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
    if (request->url() == "/update_analysis" && request->method() == HTTP_POST) {
      String jsonData = String((char*)data).substring(0, len);
      Serial.println("받은 분석 데이터: " + jsonData);
      // 간단 JSON 파싱 (기존 방식)
      if (jsonData.indexOf("\"behaviorType\"") != -1) {
        int start = jsonData.indexOf("\"behaviorType\":\"") + 16;
        int end = jsonData.indexOf("\"", start);
        if (start > 15 && end > start) {
          latestResult.behaviorType = jsonData.substring(start, end);
        }
        start = jsonData.indexOf("\"description\":\"") + 15;
        end = jsonData.indexOf("\"", start);
        if (start > 14 && end > start) {
          latestResult.description = jsonData.substring(start, end);
        }
        latestResult.timestamp = String(millis());
        Serial.println("분석 결과 업데이트됨:");
        Serial.println("  Type: " + latestResult.behaviorType);
        Serial.println("  Description: " + latestResult.description);
        Serial.println("  Timestamp: " + latestResult.timestamp);
        request->send(200, "application/json", "{\"status\":\"success\"}");
      } else {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON format\"}");
      }
    }
  });

  // 3. MJPEG 스트림 비동기 구현 (예시)
  streamServer.on("/stream", HTTP_GET, [](AsyncWebServerRequest *request){
    AsyncWebServerResponse *response = request->beginChunkedResponse("multipart/x-mixed-replace; boundary=123456789000000000000987654321", [](uint8_t *buffer, size_t maxLen, size_t index) -> size_t {
      camera_fb_t * fb = esp_camera_fb_get();
      if (!fb) return 0;
      String part = "\r\n--123456789000000000000987654321\r\n";
      part += "Content-Type: image/jpeg\r\nContent-Length: ";
      part += String(fb->len);
      part += "\r\n\r\n";
      size_t headerLen = part.length();
      if (index < headerLen) {
        memcpy(buffer, part.c_str() + index, min(headerLen - index, maxLen));
        if (headerLen - index < maxLen) {
          memcpy(buffer + (headerLen - index), fb->buf, min(fb->len, maxLen - (headerLen - index)));
          esp_camera_fb_return(fb);
          return min(headerLen - index + fb->len, maxLen);
        }
        esp_camera_fb_return(fb);
        return min(headerLen - index, maxLen);
      } else {
        size_t imgIndex = index - headerLen;
        memcpy(buffer, fb->buf + imgIndex, min(fb->len - imgIndex, maxLen));
        esp_camera_fb_return(fb);
        return min(fb->len - imgIndex, maxLen);
      }
    });
    request->send(response);
  });

  server.onNotFound([](AsyncWebServerRequest *request){
    request->send(404, "text/plain", "File Not Found");
  });

  server.begin();
}

void loop() {
  // AsyncWebServer는 loop에서 별도 처리 필요 없음
}
