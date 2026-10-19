package com.dinedeck.app.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.dinedeck.app.core.designsystem.*

enum class LoginMode {
    EMAIL,
    PHONE
}

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    var loginMode by remember { mutableStateOf(LoginMode.EMAIL) }
    var email by remember { mutableStateOf("alex.vance@dinedeck.io") }
    var phone by remember { mutableStateOf("+91 98201 23456") }
    var password by remember { mutableStateOf("Password123!") }

    // Forgot Password State
    var showForgotPasswordDialog by remember { mutableStateOf(false) }
    var forgotEmail by remember { mutableStateOf(email) }
    var showNewPasswordForm by remember { mutableStateOf(false) }
    var newPassword by remember { mutableStateOf("") }

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onLoginSuccess()
        }
    }

    Scaffold(
        containerColor = DarkBackground
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Official Brand Emblem
            Surface(
                color = Color(0xFF0B1120),
                shape = RoundedCornerShape(18.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, OrangePrimary.copy(alpha = 0.4f)),
                modifier = Modifier.size(68.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(10.dp)) {
                    androidx.compose.foundation.Image(
                        painter = androidx.compose.ui.res.painterResource(id = com.dinedeck.app.R.drawable.dinedeck_emblem),
                        contentDescription = "DineDeck Emblem",
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
            Text(
                text = "Welcome Back",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Sign in to access your DINEDECK dining account",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Dual Option Segmented Switcher: [Email] vs [Phone Number]
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = DarkSurface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp)
                ) {
                    // Option 1: Email
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (loginMode == LoginMode.EMAIL) OrangePrimary else Color.Transparent)
                            .clickable { loginMode = LoginMode.EMAIL; viewModel.clearError() }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Email,
                                contentDescription = null,
                                tint = if (loginMode == LoginMode.EMAIL) TextPrimary else TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Email",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (loginMode == LoginMode.EMAIL) TextPrimary else TextSecondary
                            )
                        }
                    }

                    // Option 2: Phone Number
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (loginMode == LoginMode.PHONE) OrangePrimary else Color.Transparent)
                            .clickable { loginMode = LoginMode.PHONE; viewModel.clearError() }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = if (loginMode == LoginMode.PHONE) TextPrimary else TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Phone Number",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (loginMode == LoginMode.PHONE) TextPrimary else TextSecondary
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (!uiState.errorMessage.isNullOrEmpty()) {
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = RedDanger.copy(alpha = 0.15f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        text = uiState.errorMessage!!,
                        color = RedDanger,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            if (loginMode == LoginMode.EMAIL) {
                // Email Field
                DineDeckTextField(
                    value = email,
                    onValueChange = { email = it; viewModel.clearError() },
                    label = "Email Address",
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )
            } else {
                // Phone Number Field
                DineDeckTextField(
                    value = phone,
                    onValueChange = { phone = it; viewModel.clearError() },
                    label = "Mobile Number",
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = TextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Password Field
            DineDeckTextField(
                value = password,
                onValueChange = { password = it; viewModel.clearError() },
                label = "Password",
                isPassword = true,
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextSecondary) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
            )

            // Forgot Password Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(
                    onClick = {
                        forgotEmail = email
                        showNewPasswordForm = false
                        viewModel.clearResetState()
                        showForgotPasswordDialog = true
                    }
                ) {
                    Text(
                        text = "Forgot Password?",
                        color = OrangePrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Sign In Action Button
            DineDeckButton(
                text = "Sign In",
                onClick = {
                    val identifier = if (loginMode == LoginMode.EMAIL) email else phone
                    viewModel.login(identifier, password)
                },
                isLoading = uiState.isLoading,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Don't have an account?",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyMedium
                )
                TextButton(onClick = onNavigateToRegister) {
                    Text(
                        text = "Register",
                        color = OrangePrimary,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }

    // --- Forgot Password Modal Dialog ---
    if (showForgotPasswordDialog) {
        AlertDialog(
            onDismissRequest = {
                showForgotPasswordDialog = false
                viewModel.clearResetState()
            },
            containerColor = DarkSurface,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = CircleShape,
                        color = OrangePrimary.copy(alpha = 0.15f),
                        modifier = Modifier.size(36.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.LockReset, contentDescription = null, tint = OrangePrimary, modifier = Modifier.size(20.dp))
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (showNewPasswordForm) "Set New Password" else "Reset Password",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    if (uiState.resetLinkSent && !showNewPasswordForm) {
                        // Success confirmation: Link sent to email
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = VegGreen.copy(alpha = 0.15f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = VegGreen, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = uiState.resetLinkMessage ?: "Password reset link sent!",
                                    color = VegGreen,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "A reset link has been dispatched to your email. Click below to simulate opening the reset link:",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Simulation button to open reset form
                        OutlinedButton(
                            onClick = { showNewPasswordForm = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = OrangePrimary),
                            border = androidx.compose.foundation.BorderStroke(1.dp, OrangePrimary)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Open Email Reset Link", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (showNewPasswordForm) {
                        // Step 2: Customer visited the email link and now sets new password
                        Text(
                            text = "Enter your new account password below:",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        DineDeckTextField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            label = "New Password",
                            isPassword = true,
                            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextSecondary) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        DineDeckButton(
                            text = "Save New Password",
                            onClick = {
                                viewModel.resetPassword(forgotEmail, newPassword)
                                password = newPassword
                                showForgotPasswordDialog = false
                            },
                            isLoading = uiState.isLoading,
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        // Step 1: Input email to receive reset link
                        Text(
                            text = "Enter your registered email address to receive a secure password reset link.",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        DineDeckTextField(
                            value = forgotEmail,
                            onValueChange = { forgotEmail = it; viewModel.clearError() },
                            label = "Email Address",
                            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextSecondary) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                        )

                        if (!uiState.errorMessage.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = uiState.errorMessage!!,
                                color = RedDanger,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                if (!uiState.resetLinkSent && !showNewPasswordForm) {
                    Button(
                        onClick = { viewModel.sendPasswordResetLink(forgotEmail) },
                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
                    ) {
                        Text("Send Reset Link", fontWeight = FontWeight.Bold)
                    }
                } else if (uiState.resetLinkSent && !showNewPasswordForm) {
                    TextButton(onClick = { showForgotPasswordDialog = false }) {
                        Text("Close", color = OrangePrimary, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showForgotPasswordDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}
