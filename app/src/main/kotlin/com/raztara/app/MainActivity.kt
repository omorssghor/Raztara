package com.raztara.app

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPermissionRequest: PermissionRequest? = null

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
            val cameraNeeded = pendingPermissionRequest?.resources?.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE) == true
            val micNeeded = pendingPermissionRequest?.resources?.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE) == true
            val granted = (!cameraNeeded || result[Manifest.permission.CAMERA] == true) &&
                    (!micNeeded || result[Manifest.permission.RECORD_AUDIO] == true)
            pendingPermissionRequest?.let { if (granted) it.grant(it.resources) else it.deny() }
            pendingPermissionRequest = null
        }

    private val filePicker =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val callback = fileCallback
            fileCallback = null
            if (callback == null) return@registerForActivityResult
            val uris = if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val clip = data?.clipData
                if (clip != null) Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                else data?.data?.let { arrayOf(it) } ?: emptyArray()
            } else emptyArray()
            callback.onReceiveValue(uris)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                return if (url.startsWith("https://omorssghor.github.io/Raztara/")) false
                else {
                    try { startActivity(Intent(Intent.ACTION_VIEW, request.url)) } catch (_: Exception) {}
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    val missing = mutableListOf<String>()
                    if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE) &&
                        checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.CAMERA)
                    if (request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE) &&
                        checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.RECORD_AUDIO)
                    if (missing.isEmpty()) request.grant(request.resources)
                    else {
                        pendingPermissionRequest = request
                        permissionLauncher.launch(missing.toTypedArray())
                    }
                }
            }

            override fun onShowFileChooser(webView: WebView, filePathCallback: ValueCallback<Array<Uri>>, fileChooserParams: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = filePathCallback
                return try {
                    filePicker.launch(fileChooserParams.createIntent())
                    true
                } catch (_: Exception) {
                    fileCallback = null
                    false
                }
            }
        }

        if (savedInstanceState == null) webView.loadUrl("https://omorssghor.github.io/Raztara/")
        else webView.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
