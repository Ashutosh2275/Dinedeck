package com.dinedeck.app.core.session

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.dinedeck.app.domain.model.User
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "dinedeck_prefs")

@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    companion object {
        private val KEY_AUTH_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_JSON = stringPreferencesKey("user_json")
        private val KEY_ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        private val KEY_ACTIVE_SESSION_ID = stringPreferencesKey("active_session_id")
        private val KEY_ACTIVE_RESTAURANT_ID = stringPreferencesKey("active_restaurant_id")
        private val KEY_ACTIVE_TABLE_NUMBER = stringPreferencesKey("active_table_number")
        private val KEY_ACTIVE_TABLE_TIMESTAMP = longPreferencesKey("active_table_timestamp")
        private val KEY_THEME_MODE = stringPreferencesKey("theme_mode") // "SYSTEM", "LIGHT", "DARK"
        private const val TABLE_SESSION_VALIDITY_MS = 90 * 60 * 1000L // 90 minutes
    }

    val authTokenFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTH_TOKEN]
    }

    val userFlow: Flow<User?> = context.dataStore.data.map { prefs ->
        val json = prefs[KEY_USER_JSON]
        if (!json.isNullOrEmpty()) {
            try {
                gson.fromJson(json, User::class.java)
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }

    val onboardingCompletedFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_ONBOARDING_COMPLETED] ?: false
    }

    val activeSessionIdFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_ACTIVE_SESSION_ID]
    }

    val activeRestaurantIdFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_ACTIVE_RESTAURANT_ID]
    }

    val isTableSessionValidFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        val table = prefs[KEY_ACTIVE_TABLE_NUMBER]?.toIntOrNull() ?: 0
        val timestamp = prefs[KEY_ACTIVE_TABLE_TIMESTAMP] ?: 0L
        table > 0 && (System.currentTimeMillis() - timestamp < TABLE_SESSION_VALIDITY_MS)
    }

    val activeTableNumberFlow: Flow<Int> = context.dataStore.data.map { prefs ->
        val table = prefs[KEY_ACTIVE_TABLE_NUMBER]?.toIntOrNull() ?: 0
        val timestamp = prefs[KEY_ACTIVE_TABLE_TIMESTAMP] ?: 0L
        if (table > 0 && (System.currentTimeMillis() - timestamp < TABLE_SESSION_VALIDITY_MS)) {
            table
        } else {
            0
        }
    }

    val themeModeFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_THEME_MODE] ?: "DARK"
    }

    suspend fun saveAuthSession(token: String, user: User) {
        context.dataStore.edit { prefs ->
            prefs[KEY_AUTH_TOKEN] = token
            prefs[KEY_USER_JSON] = gson.toJson(user)
        }
    }

    suspend fun setOnboardingCompleted(completed: Boolean = true) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun setActiveTableSession(sessionId: String, restaurantId: String, tableNumber: Int) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACTIVE_SESSION_ID] = sessionId
            prefs[KEY_ACTIVE_RESTAURANT_ID] = restaurantId
            prefs[KEY_ACTIVE_TABLE_NUMBER] = tableNumber.toString()
            prefs[KEY_ACTIVE_TABLE_TIMESTAMP] = System.currentTimeMillis()
        }
    }

    suspend fun setThemeMode(mode: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_THEME_MODE] = mode
        }
    }

    suspend fun clearTableSession() {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_ACTIVE_SESSION_ID)
            prefs.remove(KEY_ACTIVE_RESTAURANT_ID)
            prefs.remove(KEY_ACTIVE_TABLE_NUMBER)
            prefs.remove(KEY_ACTIVE_TABLE_TIMESTAMP)
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_AUTH_TOKEN)
            prefs.remove(KEY_USER_JSON)
            prefs.remove(KEY_ACTIVE_SESSION_ID)
            prefs.remove(KEY_ACTIVE_RESTAURANT_ID)
            prefs.remove(KEY_ACTIVE_TABLE_NUMBER)
            prefs.remove(KEY_ACTIVE_TABLE_TIMESTAMP)
        }
    }
}
