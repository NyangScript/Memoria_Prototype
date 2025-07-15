package com.memoria.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;

public class Esp32NativeSettingsActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EditText editText = new EditText(this);
        editText.setHint("ESP32 주소 입력 (예: http://192.168.0.10:8080)");

        Button saveButton = new Button(this);
        saveButton.setText("저장");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.addView(editText);
        layout.addView(saveButton);

        setContentView(layout);

        saveButton.setOnClickListener(v -> {
            String url = editText.getText().toString().trim();
            if (!url.isEmpty()) {
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "http://" + url;
                }
                SharedPreferences prefs = getSharedPreferences("memoria_prefs", MODE_PRIVATE);
                prefs.edit().putString("esp32_url", url).apply();
                finish();
            } else {
                editText.setError("주소를 입력하세요");
            }
        });
    }
} 