package com.example.ui

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.VideoRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    val repository = VideoRepository(application)

    private val _serverUrl = MutableStateFlow(repository.getServerUrl())
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _health = MutableStateFlow<HealthResponse?>(null)
    val health: StateFlow<HealthResponse?> = _health.asStateFlow()

    private val _isCheckingHealth = MutableStateFlow(false)
    val isCheckingHealth: StateFlow<Boolean> = _isCheckingHealth.asStateFlow()

    private val _userProfile = MutableStateFlow<UserProfileResponse?>(null)
    val userProfile: StateFlow<UserProfileResponse?> = _userProfile.asStateFlow()

    // Generation Input State
    private val _selectedImageUri = MutableStateFlow<Uri?>(null)
    val selectedImageUri: StateFlow<Uri?> = _selectedImageUri.asStateFlow()

    private val _prompt = MutableStateFlow("")
    val prompt: StateFlow<String> = _prompt.asStateFlow()

    private val _negativePrompt = MutableStateFlow("")
    val negativePrompt: StateFlow<String> = _negativePrompt.asStateFlow()

    private val _durationSec = MutableStateFlow(3)
    val durationSec: StateFlow<Int> = _durationSec.asStateFlow()

    private val _aspectRatio = MutableStateFlow("9:16")
    val aspectRatio: StateFlow<String> = _aspectRatio.asStateFlow()

    // Generation Progress & Result
    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _currentJob = MutableStateFlow<JobStatusResponse?>(null)
    val currentJob: StateFlow<JobStatusResponse?> = _currentJob.asStateFlow()

    private val _completedVideoUrl = MutableStateFlow<String?>(null)
    val completedVideoUrl: StateFlow<String?> = _completedVideoUrl.asStateFlow()

    private val _completedThumbnailUrl = MutableStateFlow<String?>(null)
    val completedThumbnailUrl: StateFlow<String?> = _completedThumbnailUrl.asStateFlow()

    // History & Packages
    private val _history = MutableStateFlow<List<GenerationHistoryItem>>(emptyList())
    val history: StateFlow<List<GenerationHistoryItem>> = _history.asStateFlow()

    private val _packages = MutableStateFlow<List<PaymentPackage>>(emptyList())
    val packages: StateFlow<List<PaymentPackage>> = _packages.asStateFlow()

    // Status messages
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    private var pollingJob: Job? = null

    init {
        refreshHealth()
        refreshProfile()
        loadHistory()
        loadPackages()
    }

    fun setServerUrl(newUrl: String) {
        repository.updateServerUrl(newUrl)
        _serverUrl.value = repository.getServerUrl()
        refreshHealth()
        refreshProfile()
    }

    fun refreshHealth() {
        viewModelScope.launch {
            _isCheckingHealth.value = true
            try {
                _health.value = repository.getHealth()
            } catch (e: Exception) {
                _health.value = null
            } finally {
                _isCheckingHealth.value = false
            }
        }
    }

    fun refreshProfile() {
        viewModelScope.launch {
            try {
                _userProfile.value = repository.getUserProfile()
            } catch (e: Exception) {
                // Keep default or previous
            }
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            try {
                _history.value = repository.getUserHistory()
            } catch (e: Exception) {
                // Handle silently
            }
        }
    }

    private fun loadPackages() {
        viewModelScope.launch {
            try {
                _packages.value = repository.getCreditPackages()
            } catch (e: Exception) {
                // Handle silently
            }
        }
    }

    fun onImageSelected(uri: Uri?) {
        _selectedImageUri.value = uri
        _errorMessage.value = null
    }

    fun onPromptChanged(newPrompt: String) {
        _prompt.value = newPrompt
        _errorMessage.value = null
    }

    fun onNegativePromptChanged(newNegPrompt: String) {
        _negativePrompt.value = newNegPrompt
    }

    fun onDurationChanged(newDuration: Int) {
        _durationSec.value = newDuration
    }

    fun onAspectRatioChanged(newRatio: String) {
        _aspectRatio.value = newRatio
    }

    fun clearMessages() {
        _errorMessage.value = null
        _successMessage.value = null
    }

    fun startGeneration() {
        val imageUri = _selectedImageUri.value
        val promptText = _prompt.value.trim()
        val healthInfo = _health.value
        val profile = _userProfile.value

        if (imageUri == null) {
            _errorMessage.value = "Please upload an image first."
            return
        }
        if (promptText.isEmpty()) {
            _errorMessage.value = "Please describe how the image should animate in the motion prompt."
            return
        }
        if (healthInfo == null) {
            _errorMessage.value = "Cannot connect to GPU Backend at ${_serverUrl.value}. Check Server Settings."
            return
        }
        if (!healthInfo.gpuAvailable) {
            _errorMessage.value = "GPU server is required for AI video generation. CUDA device not found on server."
            return
        }
        if (profile != null && profile.totalCredits <= 0) {
            _errorMessage.value = "You have 0 video credits remaining. Please check the Credits tab."
            return
        }

        viewModelScope.launch {
            _isSubmitting.value = true
            _completedVideoUrl.value = null
            _completedThumbnailUrl.value = null
            _errorMessage.value = null
            _currentJob.value = JobStatusResponse(
                jobId = "",
                status = "queued",
                progress = 5,
                message = "Uploading image..."
            )

            try {
                val resolution = when (_aspectRatio.value) {
                    "16:9" -> "1024x576"
                    "1:1" -> "576x576"
                    else -> "576x1024"
                }

                val response = repository.generateVideo(
                    imageUri = imageUri,
                    prompt = promptText,
                    negativePrompt = _negativePrompt.value.trim().takeIf { it.isNotBlank() },
                    duration = _durationSec.value,
                    aspectRatio = _aspectRatio.value,
                    resolution = resolution
                )

                _currentJob.value = JobStatusResponse(
                    jobId = response.jobId,
                    status = response.status,
                    progress = 10,
                    message = response.message
                )

                startPollingJob(response.jobId)

            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "Failed to submit video generation request."
                _currentJob.value = null
                _isSubmitting.value = false
            }
        }
    }

    private fun startPollingJob(jobId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            var finished = false
            while (!finished) {
                delay(2500)
                try {
                    val status = repository.getJobStatus(jobId)
                    _currentJob.value = status

                    if (status.status == "completed") {
                        finished = true
                        _isSubmitting.value = false
                        status.videoUrl?.let {
                            _completedVideoUrl.value = repository.getFullVideoUrl(it)
                        }
                        status.thumbnailUrl?.let {
                            _completedThumbnailUrl.value = repository.getFullVideoUrl(it)
                        }
                        refreshProfile()
                        loadHistory()
                    } else if (status.status == "failed") {
                        finished = true
                        _isSubmitting.value = false
                        _errorMessage.value = status.error ?: "Generation failed on GPU server."
                        refreshProfile()
                    }
                } catch (e: Exception) {
                    // Transient network poll error, will retry in next loop
                }
            }
        }
    }

    fun resetForNewGeneration() {
        pollingJob?.cancel()
        _currentJob.value = null
        _completedVideoUrl.value = null
        _completedThumbnailUrl.value = null
        _isSubmitting.value = false
    }

    fun shareVideo(videoUrl: String) {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Check out my AI Generated Video!")
            putExtra(Intent.EXTRA_TEXT, "Generated with AI Video Generator: $videoUrl")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val chooser = Intent.createChooser(shareIntent, "Share AI Video").apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        getApplication<Application>().startActivity(chooser)
    }
}
