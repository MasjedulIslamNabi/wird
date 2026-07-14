package com.wird.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Optimize WebView for performance
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Enable DOM storage + database (needed for localStorage)
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            // Enable JS + caching
            settings.setJavaScriptEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            // Geolocation
            settings.setGeolocationEnabled(true);
            // Allow file access for local assets
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            // Mixed content (in case of HTTP resources)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
    }
}
