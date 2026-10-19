package com.dinedeck.app.core.security

import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Build
import android.os.Debug
import java.io.File

/**
 * AppIntegrityManager — Layered Defense-in-Depth Device & Runtime Integrity Inspector
 *
 * Implements client-side tamper detection, root presence verification, and runtime
 * debugger inspection. These signals provide defense-in-depth telemetry for server-side
 * risk-based evaluation, without destructive behavior that would impact legitimate users.
 */
object AppIntegrityManager {

    data class IntegrityReport(
        val isDebuggable: Boolean,
        val isDebuggerAttached: Boolean,
        val hasRootBinaries: Boolean,
        val isTestKeysBuild: Boolean,
        val isTampered: Boolean
    )

    private val KNOWN_ROOT_PATHS = arrayOf(
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su"
    )

    /**
     * Inspects common su binary paths across internal directories
     */
    fun hasRootBinaries(): Boolean {
        return try {
            KNOWN_ROOT_PATHS.any { path -> File(path).exists() }
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Checks if OS build was signed with unofficial test keys
     */
    fun isTestKeysBuild(): Boolean {
        val tags = Build.TAGS
        return tags != null && tags.contains("test-keys")
    }

    /**
     * Inspects whether debugger is actively attached
     */
    fun isDebuggerAttached(): Boolean {
        return Debug.isDebuggerConnected() || Debug.waitingForDebugger()
    }

    /**
     * Inspects whether the application manifest flag allows debugging
     */
    fun isAppDebuggable(context: Context): Boolean {
        return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    }

    /**
     * Generates a comprehensive integrity snapshot for security diagnostics
     */
    fun checkIntegrity(context: Context): IntegrityReport {
        val debuggable = isAppDebuggable(context)
        val debugger = isDebuggerAttached()
        val root = hasRootBinaries()
        val testKeys = isTestKeysBuild()
        val tampered = (debuggable && !Build.TYPE.equals("userdebug", ignoreCase = true)) || (root && debugger)

        return IntegrityReport(
            isDebuggable = debuggable,
            isDebuggerAttached = debugger,
            hasRootBinaries = root,
            isTestKeysBuild = testKeys,
            isTampered = tampered
        )
    }
}
