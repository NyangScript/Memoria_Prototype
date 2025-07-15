package com.memoria.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.memoria.app.ForegroundServicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 커스텀 플러그인 등록
        registerPlugin(ForegroundServicePlugin.class);

        // 앱 시작 시 포그라운드 서비스 실행
        Intent serviceIntent = new Intent(this, ForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("openEsp32Settings", false)) {
            JSObject data = new JSObject();
            data.put("openEsp32Settings", true);
            this.bridge.triggerWindowJSEvent("openEsp32Settings", data.toString());
        }
    }
}
