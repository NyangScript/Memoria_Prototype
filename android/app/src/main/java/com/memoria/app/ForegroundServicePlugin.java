package com.memoria.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

@CapacitorPlugin(name = "ForegroundServicePlugin")
public class ForegroundServicePlugin extends Plugin {

    private static ForegroundServicePlugin instance;

    public ForegroundServicePlugin() {
        instance = this;
    }

    public static ForegroundServicePlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void startForegroundService(PluginCall call) {
        try {
            JSObject data = call.getData();
            String behaviorType = data.getString("behaviorType", "모니터링 중...");
            String description = data.getString("description", "");
            String location = data.getString("location", "");
            String timestamp = data.getString("timestamp", "");

            Intent intent = new Intent(getContext(), ForegroundService.class);
            intent.putExtra("behaviorType", behaviorType);
            intent.putExtra("description", description);
            intent.putExtra("location", location);
            intent.putExtra("timestamp", timestamp);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("포그라운드 서비스 시작 실패", e);
        }
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), ForegroundService.class);
            getContext().stopService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("포그라운드 서비스 중지 실패", e);
        }
    }

    @PluginMethod
    public void setEsp32Url(PluginCall call) {
        String url = call.getString("esp32_url", "");
        Log.d("ForegroundServicePlugin", "setEsp32Url called with: " + url);
        if (!url.isEmpty()) {
            SharedPreferences prefs = getContext().getSharedPreferences("memoria_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("esp32_url", url).apply();
            Log.d("ForegroundServicePlugin", "Saved esp32_url: " + prefs.getString("esp32_url", "null"));
            call.resolve();
        } else {
            call.reject("URL이 비어있음");
        }
    }

    @PluginMethod
    public void getLocalLogs(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("memoria_logs", Context.MODE_PRIVATE);
            JSObject result = new JSObject();
            
            // 모든 로그 키 가져오기
            java.util.Map<String, ?> allPrefs = prefs.getAll();
            java.util.List<String> logs = new java.util.ArrayList<>();
            
            for (java.util.Map.Entry<String, ?> entry : allPrefs.entrySet()) {
                if (entry.getKey().startsWith("log_")) {
                    logs.add(entry.getValue().toString());
                }
            }
            
            result.put("logs", logs);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("로컬 로그 가져오기 실패", e);
        }
    }

    @PluginMethod
    public void clearLocalLogs(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("memoria_logs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            // 모든 로그 키 삭제
            java.util.Map<String, ?> allPrefs = prefs.getAll();
            for (String key : allPrefs.keySet()) {
                if (key.startsWith("log_")) {
                    editor.remove(key);
                }
            }
            editor.apply();
            
            call.resolve();
        } catch (Exception e) {
            call.reject("로컬 로그 삭제 실패", e);
        }
    }

    public void sendAnalysisResultToJS(String behaviorType, String description, String timestamp, String location) {
        JSObject data = new JSObject();
        data.put("behaviorType", behaviorType);
        data.put("description", description);
        data.put("timestamp", timestamp);
        data.put("location", location);
        notifyListeners("analysisResult", data);
    }
} 