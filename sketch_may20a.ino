#include "esp_camera.h"
#include "WiFi.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "driver/rtc_io.h"
#include <WebServer.h>

// --- Pinout for ESP32-S3 AI Camera ---
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     5
#define SIOC_GPIO_NUM     9
#define SIOD_GPIO_NUM     8
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

// --- Wi-Fi Credentials ---
const char* ssid = "2F-CR1_CR2";     // Your Wi-Fi SSID
const char* password = "WMS1348B2F"; // Your Wi-Fi Password

WebServer streamServer(81); // Use port 81 for the MJPEG streaming server

// --- MJPEG Streaming Constants ---
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=123456789000000000000987654321";
static const char* _STREAM_BOUNDARY = "\r\n--123456789000000000000987654321\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// --- Function Prototypes ---
void handleStream();
void handleNotFound();

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

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
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 18;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_DRAM;

  // If PSRAM is available, use it for better performance
  if (psramFound()) {
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST; // Discard old frames for lower latency
  }

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  Serial.println("Camera initialized successfully.");

  sensor_t * s = esp_camera_sensor_get();
  if (s) {
    s->set_vflip(s, 1);   // Flip vertically
    s->set_hmirror(s, 1); // Flip horizontally
  }

  // Wi-Fi connection
  WiFi.begin(ssid, password);
  WiFi.setSleep(false); // Disable WiFi power save mode for low latency streaming
  
  Serial.print("Connecting to WiFi...");
  int wifi_retry_count = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_retry_count < 20) {
    delay(500);
    Serial.print(".");
    wifi_retry_count++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi.");
    return;
  }
  Serial.println("\nWiFi connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Setup web server handlers
  streamServer.on("/stream", HTTP_GET, handleStream);
  streamServer.onNotFound(handleNotFound);
  streamServer.begin();
  Serial.println("MJPEG stream server started on port 81 at /stream");
}

void loop() {
  streamServer.handleClient();
  delay(1); // Yield to other tasks
}

// Optimized handler for MJPEG streaming
// This function avoids using the String class to prevent memory fragmentation and improve performance.
void handleStream() {
  WiFiClient client = streamServer.client();
  if (!client.connected()) {
    return;
  }

  // Send the HTTP header for the multipart stream
  client.print("HTTP/1.1 200 OK\r\n");
  client.print("Content-Type: ");
  client.print(_STREAM_CONTENT_TYPE);
  client.print("\r\n");
  client.print("Connection: keep-alive\r\n");
  client.print("Access-Control-Allow-Origin: *\r\n");
  client.print("\r\n");

  // Stream frames continuously
  while (client.connected()) {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      delay(10); // Wait a bit before retrying
      continue;
    }
    
    // Check if the format is JPEG (it should be, based on config)
    if (fb->format != PIXFORMAT_JPEG) {
      esp_camera_fb_return(fb);
      continue;
    }

    // Write the boundary and content header
    client.print(_STREAM_BOUNDARY);
    char part_buf[128];
    sprintf(part_buf, _STREAM_PART, fb->len);
    client.print(part_buf);
    
    // Write the JPEG image data
    client.write(fb->buf, fb->len);
    client.print("\r\n");
    
    // Return the frame buffer to be reused
    esp_camera_fb_return(fb);
  }
  Serial.println("Client disconnected from stream.");
}

// Handler for 404 Not Found errors
void handleNotFound() {
  const char* message = "File Not Found\n\nURI: /stream\nMethod: GET\n";
  streamServer.send(404, "text/plain", message);
}