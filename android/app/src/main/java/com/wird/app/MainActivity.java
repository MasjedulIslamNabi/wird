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
            // Enable hardware acceleration + DOM storage
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            // Enable JS + caching
            settings.setJavaScriptEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setAppCacheEnabled(true);
            // Geolocation
            settings.setGeolocationEnabled(true);
            // Reduce motion: disable some rendering optimizations that cause jank
            settings.setRenderFps(60);
            // Allow file access for local assets
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            // Mixed content (in case of HTTP resources)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
    }
}
