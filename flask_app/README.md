# Memoria Flask 서버

이 서버는 ESP32 카메라의 영상 스트림을 받아 실시간 분석 및 보호자 앱 UI를 제공합니다.

## 구조
- `app.py` : Flask 메인 서버, UI 및 분석 결과 API 제공
- `templates/index.html` : ESP32 웹서버 UI를 그대로 이전한 메인 페이지

## 사용법
1. `ESP32_HOST` 환경변수에 ESP32의 IP 주소를 지정하세요. (예: `export ESP32_HOST=192.168.0.101`)
2. `python app.py`로 서버를 실행하세요.
3. 브라우저에서 `http://<Flask서버IP>:5000/` 접속 시 ESP32의 실시간 스트림과 분석 UI가 표시됩니다.

## ESP32 연동
- ESP32는 기존처럼 :81 포트로 MJPEG 스트림(`/stream`)만 제공합니다.
- 분석/기록/알림 등 모든 로직은 Flask 서버에서 처리합니다.

## API
- `/update_analysis` : 분석 결과를 POST로 저장
- `/latest_analysis` : 최신 분석 결과를 GET으로 반환 