// =================================================================
//        ESP32-S3 AI Camera with Person Detection (YOLO)
// =================================================================

// Standard libraries
#include "esp_camera.h"
#include "WiFi.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "driver/rtc_io.h"
#include <WebServer.h>

// NEW: AI and Deep Learning Libraries
#include "human_face_detect_msr01.hpp"
#include "human_face_detect_mnp01.hpp"
#include "dl_image.hpp"
#include "model/person_detect_model.h" // Our custom model header

// ESP32-S3 AI Camera PIN Map (Same as yours)
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
#define SIOD_GPIO_NUM     8
#define SIOC_GPIO_NUM     9

// Wi-Fi Credentials
const char* ssid = "SL-Meeting";         // CHANGE TO YOUR Wi-Fi SSID
const char* password = "WMS1348B2F"; // CHANGE TO YOUR Wi-Fi PASSWORD

WebServer streamServer(81); // MJPEG streaming server port 81

// Stream constants
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=123456789000000000000987654321";
static const char* _STREAM_BOUNDARY = "\r\n--123456789000000000000987654321\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// NEW: AI Model related variables
static PersonDetect model;
#define DETECTION_THRESHOLD 0.6 // Confidence threshold (60%) for detection

// NEW: Helper function to draw bounding boxes on the image
void draw_boxes(camera_fb_t *fb, std::list<dl::detect::result_t> *results) {
  int x, y, w, h;
  uint32_t color = 0x00FF00; // Green color for the box

  if (fb->format != PIXFORMAT_RGB565) {
    Serial.println("ERROR: Image format must be RGB565 for drawing.");
    return;
  }
  
  for (std::list<dl::detect::result_t>::iterator prediction = results->begin(); prediction != results->end(); prediction++) {
    x = (int)prediction->box[0];
    y = (int)prediction->box[1];
    w = (int)prediction->box[2] - (int)prediction->box[0];
    h = (int)prediction->box[3] - (int)prediction->box[1];
    
    // Draw a rectangle
    dl::image::draw_rectangle((uint16_t *)fb->buf, fb->width, fb->height, x, y, x + w, y + h, color);
  }
}

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

  // IMPORTANT CHANGE:
  // The AI model needs raw pixel data, not JPEG. We'll use RGB565 format.
  // We capture at a lower resolution for faster AI processing.
  config.frame_size = FRAMESIZE_240X240;
  config.pixel_format = PIXFORMAT_RGB565; // Changed from JPEG to RGB565
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12; // This will be used when we convert the frame to JPEG
  config.fb_count = 2; // Use 2 frame buffers for smoother streaming

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  Serial.println("Camera initialized successfully.");

  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    s->set_vflip(s, 1);
    s->set_hmirror(s, 1);
  }
  
  // NEW: Initialize the Person Detection model
  model.set_depth(2); // This configures the YOLO model
  model.set_anchor_prior(true);
  model.set_model_input(get_person_detect_model_input());
  model.set_coefficient(get_person_detect_model_coefficient());
  model.set_threshold(DETECTION_THRESHOLD);
  model.set_nms(0.3); // Non-maximum suppression threshold
  model.set_classes(1); // We are only detecting one class: "person"
  model.apply();
  Serial.println("Person detection model initialized.");
  
  // Wi-Fi connection
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Web server setup
  streamServer.on("/stream", HTTP_GET, handleStream);
  streamServer.onNotFound(handleNotFound);
  streamServer.begin();
  Serial.println("MJPEG stream server started at /stream");
}

void loop() {
  streamServer.handleClient();
  delay(1);
}

void handleStream() {
  WiFiClient client = streamServer.client();
  if (!client.connected()) {
    return;
  }
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: " + String(_STREAM_CONTENT_TYPE) + "\r\n";
  response += "Connection: keep-alive\r\n";
  response += "Access-Control-Allow-Origin: *\r\n";
  response += "\r\n";
  client.print(response);

  while (client.connected()) {
    camera_fb_t *fb = NULL;
    
    // 1. CAPTURE IMAGE
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      delay(100);
      continue;
    }
    
    // 2. RUN AI INFERENCE
    // Convert the RGB565 image to a format the model understands (RGB888 tensor)
    dl::image::Tensor<uint8_t> image;
    image.set_shape({1, fb->height, fb->width, 3}).set_buffer((uint8_t *)fb->buf).set_format(dl::image::FORMAT_RGB565);
    dl::image::Tensor<uint8_t> rgb_image;
    dl::image::resize_image(image, rgb_image, {1, model.get_input_shape()[1], model.get_input_shape()[2], 3});
    
    // Run the model
    std::list<dl::detect::result_t> results;
    model.forward(rgb_image, results);
    
    // 3. DRAW BOUNDING BOXES
    if (!results.empty()) {
      Serial.printf("Person Detected! Count: %d\n", results.size());
      draw_boxes(fb, &results);
    }
    
    // 4. COMPRESS TO JPEG
    uint8_t *jpeg_buf = NULL;
    size_t jpeg_len = 0;
    bool jpeg_converted = frame2jpg(fb, 80, &jpeg_buf, &jpeg_len);
    
    // 5. STREAM VIDEO
    if (jpeg_converted) {
      client.print(_STREAM_BOUNDARY);
      char buf[128];
      sprintf(buf, _STREAM_PART, jpeg_len);
      client.print(buf);
      client.write(jpeg_buf, jpeg_len);
      client.print("\r\n");
    } else {
      Serial.println("JPEG conversion failed");
    }
    
    // Cleanup
    if (jpeg_buf) free(jpeg_buf);
    esp_camera_fb_return(fb);
  }
  
  Serial.println("Client disconnected from stream.");
}

void handleNotFound() {
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += streamServer.uri();
  message += "\nMethod: ";
  message += (streamServer.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: None\n";
  streamServer.send(404, "text/plain", message);
}