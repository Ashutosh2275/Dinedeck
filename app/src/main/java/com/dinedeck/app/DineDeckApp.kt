package com.dinedeck.app

import android.app.Application
import android.content.ComponentCallbacks2
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.util.DebugLogger
import dagger.hilt.android.HiltAndroidApp
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

@HiltAndroidApp
class DineDeckApp : Application(), ImageLoaderFactory {

    private var imageLoaderInstance: ImageLoader? = null

    override fun newImageLoader(): ImageLoader {
        return imageLoaderInstance ?: synchronized(this) {
            imageLoaderInstance ?: ImageLoader.Builder(this)
                .memoryCache {
                    MemoryCache.Builder(this)
                        // Bounded to 20% of max heap for smooth performance on 1GB/2GB low-end devices
                        .maxSizePercent(0.20)
                        .build()
                }
                .diskCache {
                    DiskCache.Builder()
                        .directory(cacheDir.resolve("image_cache"))
                        // Hard budget of 25MB disk cache to avoid unbounded growth on 32GB/64GB storage
                        .maxSizeBytes(25L * 1024 * 1024)
                        .build()
                }
                .okHttpClient {
                    OkHttpClient.Builder()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(15, TimeUnit.SECONDS)
                        .build()
                }
                .crossfade(true)
                .respectCacheHeaders(false)
                .build().also {
                    imageLoaderInstance = it
                }
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
            imageLoaderInstance?.memoryCache?.clear()
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        imageLoaderInstance?.memoryCache?.clear()
    }
}

