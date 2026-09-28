package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.MainViewModel

@Composable
fun SettingsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentUrl by viewModel.serverUrl.collectAsState()
    val health by viewModel.health.collectAsState()
    val isChecking by viewModel.isCheckingHealth.collectAsState()
    val scrollState = rememberScrollState()

    var inputUrl by remember(currentUrl) { mutableStateOf(currentUrl) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "GPU Server & Settings",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        // Server URL Configuration Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Python FastAPI Backend URL",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium
                )

                OutlinedTextField(
                    value = inputUrl,
                    onValueChange = { inputUrl = it },
                    label = { Text("Server Base URL") },
                    placeholder = { Text("http://10.0.2.2:8000") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("server_url_input"),
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = {
                        if (inputUrl != currentUrl) {
                            IconButton(onClick = {
                                viewModel.setServerUrl(inputUrl)
                                Toast.makeText(context, "Server URL updated", Toast.LENGTH_SHORT).show()
                            }) {
                                Icon(Icons.Default.Check, contentDescription = "Save")
                            }
                        }
                    }
                )

                // Quick presets
                Text(text = "Quick Presets:", style = MaterialTheme.typography.labelSmall)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SuggestionChip(
                        onClick = {
                            inputUrl = "http://10.0.2.2:8000"
                            viewModel.setServerUrl("http://10.0.2.2:8000")
                        },
                        label = { Text("Emulator (10.0.2.2)") },
                        modifier = Modifier.weight(1f)
                    )

                    SuggestionChip(
                        onClick = {
                            inputUrl = "http://localhost:8000"
                            viewModel.setServerUrl("http://localhost:8000")
                        },
                        label = { Text("Localhost") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Button(
                    onClick = {
                        viewModel.setServerUrl(inputUrl)
                        viewModel.refreshHealth()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("test_connection_button"),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    if (isChecking) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Connecting...")
                    } else {
                        Icon(Icons.Default.NetworkCheck, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Test Server Connection")
                    }
                }
            }
        }

        // Live Health Status Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (health?.gpuAvailable == true) {
                    MaterialTheme.colorScheme.surfaceVariant
                } else {
                    MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                }
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "GPU Server Status",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )

                    Badge(
                        containerColor = if (health != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                    ) {
                        Text(if (health != null) "ONLINE" else "OFFLINE")
                    }
                }

                if (health != null) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text(text = "NVIDIA CUDA:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                text = if (health!!.gpuAvailable) "Available (Active)" else "Unavailable",
                                fontWeight = FontWeight.Bold,
                                color = if (health!!.gpuAvailable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                        health!!.gpuName?.let { name ->
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                Text(text = "GPU Name:", style = MaterialTheme.typography.bodySmall)
                                Text(text = name, fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodySmall)
                            }
                        }

                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text(text = "Model Loaded:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                text = if (health!!.modelLoaded) "Yes (In VRAM)" else "On-Demand (Ready)",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text(text = "Model Name:", style = MaterialTheme.typography.bodySmall)
                            Text(text = health!!.modelName, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                } else {
                    Text(
                        text = "Could not reach FastAPI server at $currentUrl. Please ensure the Python server is running (`uvicorn app.main:app --host 0.0.0.0 --port 8000`).",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }

        // Physical Phone LAN Guide
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.PhoneAndroid, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "Physical Phone Connection Guide",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Text(
                    text = "When running this APK on a physical Android phone, 'localhost' refers to the phone itself. To connect to your Python GPU server on your PC:",
                    style = MaterialTheme.typography.labelSmall
                )
                Text(
                    text = "1. Connect both PC and Phone to the same Wi-Fi network.\n" +
                           "2. Find your PC's LAN IP (run 'ipconfig' on Windows or 'ifconfig/ip a' on Linux/macOS, e.g. 192.168.1.100).\n" +
                           "3. Enter 'http://192.168.1.100:8000' in the Server Base URL field above and tap Test Connection.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Privacy Policy Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Shield, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "Privacy Policy",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                Text(
                    text = "• Uploaded Images: Processed strictly to generate motion frames on the local GPU backend. Never shared or sold.\n" +
                           "• Temporary Storage: All uploaded images and generated MP4 files are automatically purged from the server after 24 hours.\n" +
                           "• Anonymous Device ID: Used purely to manage credit allocation without requiring personal logins.\n" +
                           "• Open-Source Inference: All AI computation runs on local open-source models (Stable Video Diffusion). No external commercial AI APIs are invoked.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
