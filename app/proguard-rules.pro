# ==============================================================================
# DineDeck Customer App — Production R8 Optimization & Obfuscation Rules
# ==============================================================================

# Enable aggressive optimization passes
-optimizationpasses 5
-allowaccessmodification
-mergeinterfacesaggressively

# Keep Android core lifecycle components
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep Jetpack Compose Runtime and UI
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Keep Kotlin Coroutines & Reflection Metadata
-keepclassmembers class * extends kotlin.coroutines.jvm.internal.ContinuationImpl {
    <fields>;
}
-dontwarn kotlinx.coroutines.**

# Keep Dagger / Hilt Dependency Injection
-keep class * extends dagger.hilt.internal.GeneratedComponentManager { *; }
-keep class * extends dagger.hilt.internal.UnsafeCasts { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }
-keep @dagger.hilt.EntryPoint class * { *; }
-keep @dagger.Module class * { *; }
-dontwarn dagger.hilt.**

# Keep Retrofit & OkHttp
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes *Annotation*
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Gson Serialized Data Models & Enums
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.dinedeck.app.data.remote.** { *; }
-keep class com.dinedeck.app.domain.model.** { *; }
-keepclassmembers enum * { *; }

# Keep Room Database Entities & DAOs
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-dontwarn androidx.room.**

# Keep Coil Image Loader
-keep class coil.** { *; }
-dontwarn coil.**

# Strip all android.util.Log calls in release builds for proprietary IP protection & speed
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}

# Obfuscate source file names and line numbers
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
