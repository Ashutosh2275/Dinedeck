# ==============================================================================
# DineDeck Admin App — Production R8 Optimization & Obfuscation Rules
# ==============================================================================

# Production R8 Optimization
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

# Keep OkHttp & Gson Data Models
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes *Annotation*
-dontwarn okhttp3.**
-dontwarn okio.**
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.dinedeck.admin.data.** { *; }
-keepclassmembers enum * { *; }

# Strip all android.util.Log calls in release builds
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
