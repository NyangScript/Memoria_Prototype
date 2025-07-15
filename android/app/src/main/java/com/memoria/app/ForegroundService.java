package com.memoria.app;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import android.app.PendingIntent;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.json.JSONObject;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.memoria.app.ForegroundServicePlugin;
import android.util.Log;

public class ForegroundService extends Service {

    private static final int NOTIFICATION_ID = 1;
    private static final String NOTIFICATION_NAME = "Memoria";
    private static final String CHANNEL_ID = "memoria_channel_id";

    private final Handler handler = new Handler();
    private final int interval = 10000; // 10초

    private boolean isForegroundStarted = false;
    private String lastAnalysisResult = ""; // 중복 방지를 위한 마지막 결과 저장

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @SuppressLint("ObsoleteSdkInt")
    private void createNotificationChannel() {
        if(Build.VERSION_CODES.O <= Build.VERSION.SDK_INT) {
            NotificationChannel notiChannel = new NotificationChannel(
                    CHANNEL_ID,
                    NOTIFICATION_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            // 진동, 사운드, LED 등 부가 효과 제거
            notiChannel.enableVibration(false);
            notiChannel.setVibrationPattern(new long[]{0L});
            notiChannel.setSound(null, null);
            notiChannel.enableLights(false);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(notiChannel);
        }
    }

    @SuppressLint("ObsoleteSdkInt")
    @Override
    public int onStartCommand(Intent intent, int flag, int startId) {
        createNotificationChannel();
        startEsp32Polling();

        // intent에서 BehaviorLog 데이터 가져오기
        String behaviorType = "모니터링 중...";
        String description = "";
        String location = "";
        String timestampStr = "";
        
        if (intent != null) {
            if (intent.hasExtra("behaviorType")) {
                behaviorType = intent.getStringExtra("behaviorType");
            }
            if (intent.hasExtra("description")) {
                description = intent.getStringExtra("description");
            }
            if (intent.hasExtra("location")) {
                location = intent.getStringExtra("location");
            }
            if (intent.hasExtra("timestamp")) {
                timestampStr = intent.getStringExtra("timestamp");
            }
        }
        
        // timestampStr이 있으면 해당 시간, 없으면 현재 시간
        String currentTime;
        if (timestampStr != null && !timestampStr.isEmpty()) {
            try {
                java.text.SimpleDateFormat isoFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault());
                java.util.Date logDate = isoFormat.parse(timestampStr);
                currentTime = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(logDate);
            } catch (Exception e) {
                currentTime = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
            }
        } else {
            currentTime = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
        }

        // 알림 텍스트 구성
        String notificationText;
        if (!description.isEmpty()) {
            notificationText = currentTime + "\n" + behaviorType + ": " + description;
            if (!location.isEmpty()) {
                notificationText += "\n위치: " + location;
            }
        } else {
            notificationText = currentTime + "\n" + behaviorType;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Memoria 모니터링 진행중...")
                .setContentText(notificationText)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(notificationText));

        // 주소 미설정 시 "주소 설정" 버튼 추가
        if ("주소 미설정".equals(behaviorType)) {
            Intent settingsIntent = new Intent(this, Esp32NativeSettingsActivity.class);
            settingsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, settingsIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(
                android.R.drawable.ic_menu_edit,
                "주소 설정",
                pendingIntent
            );
        }

        Notification noti = builder.build();

        if(Build.VERSION_CODES.O <= Build.VERSION.SDK_INT) {
            startForeground(NOTIFICATION_ID, noti);
        }

        return START_STICKY;
    }

    private void startEsp32Polling() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                fetchEsp32Analysis();
                handler.postDelayed(this, interval);
            }
        }, interval);
    }

    private String getEsp32Url() {
        SharedPreferences prefs = getApplicationContext().getSharedPreferences("memoria_prefs", MODE_PRIVATE);
        String url = prefs.getString("esp32_url", null);
        Log.d("ForegroundService", "getEsp32Url: " + url);
        if (url == null || url.isEmpty()) {
            return null;
        }
        return url;
    }

    private void fetchEsp32Analysis() {
        new Thread(() -> {
            try {
                String baseUrl = getEsp32Url();
                Log.d("ForegroundService", "fetchEsp32Analysis() - baseUrl: " + baseUrl);
                if (baseUrl == null) {
                    updateNotificationWithAnalysis("{\"behaviorType\":\"주소 미설정\",\"description\":\"ESP32 주소를 앱에서 설정하세요.\",\"timestamp\":\"\"}");
                    return;
                }
                Log.d("ForegroundService", "Polling ESP32: " + baseUrl + "/latest_analysis");
                URL url = new URL(baseUrl + "/latest_analysis");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(2000);
                conn.setReadTimeout(2000);

                int responseCode = conn.getResponseCode();
                Log.d("ForegroundService", "ESP32 response code: " + responseCode);
                if (responseCode == 200) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    String inputLine;
                    StringBuilder response = new StringBuilder();
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();
                    String responseStr = response.toString();
                    Log.d("ForegroundService", "ESP32 response: " + responseStr);
                    
                    // 중복 방지: 동일한 결과는 처리하지 않음
                    if (!responseStr.equals(lastAnalysisResult)) {
                        lastAnalysisResult = responseStr;
                        updateNotificationWithAnalysis(responseStr);
                    }
                } else {
                    updateNotificationWithAnalysis("{\"behaviorType\":\"ESP32 연결 실패\",\"description\":\"응답 코드: " + responseCode + "\",\"timestamp\":\"\"}");
                }
            } catch (Exception e) {
                Log.e("ForegroundService", "ESP32 fetch error", e);
                updateNotificationWithAnalysis("{\"behaviorType\":\"ESP32 연결 실패\",\"description\":\"" + e.getMessage() + "\",\"timestamp\":\"\"}");
            }
        }).start();
    }

    private void updateNotificationWithAnalysis(String json) {
        try {
            JSONObject obj = new JSONObject(json);
            String behaviorType = obj.optString("behaviorType", "모니터링 중...");
            String description = obj.optString("description", "");
            String timestamp = obj.optString("timestamp", "");

            // 시간 포맷 변환 (millis → HH:mm:ss)
            String currentTime;
            try {
                long millis = Long.parseLong(timestamp);
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault());
                currentTime = sdf.format(new java.util.Date(millis));
            } catch (Exception e) {
                currentTime = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
            }

            // 알림 텍스트 구성
            String notificationText = "마지막 분석: " + currentTime;
            if (!description.isEmpty()) {
                notificationText += "\n" + behaviorType + ": " + description;
            } else {
                notificationText += "\n" + behaviorType;
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("Memoria 모니터링 진행중...")
                    .setContentText(notificationText)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(notificationText));

            if ("주소 미설정".equals(behaviorType)) {
                Intent settingsIntent = new Intent(this, Esp32NativeSettingsActivity.class);
                settingsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    this, 0, settingsIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                builder.addAction(
                    android.R.drawable.ic_menu_edit,
                    "주소 설정",
                    pendingIntent
                );
            }
            Notification noti = builder.build();

            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            nm.notify(NOTIFICATION_ID, noti);

            if (!isForegroundStarted) {
                startForeground(NOTIFICATION_ID, noti);
                isForegroundStarted = true;
            }

            // 이상/위험행동이면 JS로 이벤트 전송하여 앱 로그에 저장
            if ("Abnormal".equals(behaviorType) || "Dangerous".equals(behaviorType)) {
                // 현재 시간을 ISO 형식으로 변환
                String isoTime = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
                
                ForegroundServicePlugin plugin = ForegroundServicePlugin.getInstance();
                if (plugin != null) {
                    plugin.sendAnalysisResultToJS(behaviorType, description, isoTime, "거실");
                }
                
                // 로컬 저장소에도 저장 (앱이 꺼져있어도)
                saveAnalysisResultLocally(behaviorType, description, isoTime, "거실");
            }
        } catch (Exception e) {
            Log.e("ForegroundService", "updateNotificationWithAnalysis error", e);
        }
    }

    private void saveAnalysisResultLocally(String behaviorType, String description, String timestamp, String location) {
        try {
            SharedPreferences prefs = getSharedPreferences("memoria_logs", MODE_PRIVATE);
            String key = "log_" + System.currentTimeMillis();
            
            JSONObject logEntry = new JSONObject();
            logEntry.put("id", key);
            logEntry.put("type", behaviorType);
            logEntry.put("description", description);
            logEntry.put("location", location);
            logEntry.put("timestamp", timestamp);
            
            prefs.edit().putString(key, logEntry.toString()).apply();
            Log.d("ForegroundService", "Saved analysis result locally: " + logEntry.toString());
        } catch (Exception e) {
            Log.e("ForegroundService", "Failed to save analysis result locally", e);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}