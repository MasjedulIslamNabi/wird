package com.wird.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();

            // ── Performance optimizations ──
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Aggressive caching: load from cache when available, fetch in background
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Enable GPU compositing + hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

            // Allow file access for local assets (Capacitor serves from file://)
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);

            // Geolocation
            settings.setGeolocationEnabled(true);

            // Mixed content compatibility
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

            // Disable user gestures check for media (helps autoplay)
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Enable WebView debugging in debug builds (so we can use chrome://inspect)
            if (BuildConfig.DEBUG) {
                WebView.setWebContentsDebuggingEnabled(true);
            }

            // Preemptive: scroll smoothly + use wider viewport
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
        }
    }
}
