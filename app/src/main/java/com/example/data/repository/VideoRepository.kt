package com.example.data.repository

import android.content.Context
import android.net.Uri
import com.example.data.api.ApiService
import com.example.data.model.*
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.TimeUnit

class VideoRepository(private val context: Context) {

    private val prefs = context.getSharedPreferences("ai_video_prefs", Context.MODE_PRIVATE)

    companion object {
        const val PREF_KEY_SERVER_URL = "server_url"
        const val PREF_KEY_DEVICE_ID = "device_id"
        // 10.0.2.2 is the special alias to host loopback interface in Android Emulator
        const val DEFAULT_EMULATOR_URL = "http://10.0.2.2:8000"
        const val DEFAULT_LOCALHOST_URL = "http://localhost:8000"
    }

    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private var currentBaseUrl: String = prefs.getString(PREF_KEY_SERVER_URL, DEFAULT_EMULATOR_URL) ?: DEFAULT_EMULATOR_URL
    private var apiService: ApiService = buildApiService(currentBaseUrl)

    private fun buildApiService(baseUrl: String): ApiService {
        val safeUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(safeUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(ApiService::class.java)
    }

    fun getServerUrl(): String = currentBaseUrl

    fun updateServerUrl(newUrl: String) {
        val formatted = newUrl.trim()
        currentBaseUrl = formatted
        prefs.edit().putString(PREF_KEY_SERVER_URL, formatted).apply()
        apiService = buildApiService(formatted)
    }

    fun getDeviceId(): String {
        var id = prefs.getString(PREF_KEY_DEVICE_ID, null)
        if (id == null) {
            id = "android_" + UUID.randomUUID().toString().replace("-", "").take(12)
            prefs.edit().putString(PREF_KEY_DEVICE_ID, id).apply()
        }
        return id
    }

    fun getFullVideoUrl(pathOrUrl: String): String {
        if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
            return pathOrUrl
        }
        val cleanBase = if (currentBaseUrl.endsWith("/")) currentBaseUrl.dropLast(1) else currentBaseUrl
        val cleanPath = if (pathOrUrl.startsWith("/")) pathOrUrl else "/$pathOrUrl"
        return "$cleanBase$cleanPath"
    }

    suspend fun getHealth(): HealthResponse = withContext(Dispatchers.IO) {
        apiService.getHealth()
    }

    suspend fun getUserProfile(): UserProfileResponse = withContext(Dispatchers.IO) {
        val deviceId = getDeviceId()
        apiService.getUserProfile(UserRegisterRequest(deviceId))
    }

    suspend fun getUserHistory(): List<GenerationHistoryItem> = withContext(Dispatchers.IO) {
        val deviceId = getDeviceId()
        apiService.getUserHistory(deviceId)
    }

    suspend fun getCreditPackages(): List<PaymentPackage> = withContext(Dispatchers.IO) {
        apiService.getCreditPackages()
    }

    suspend fun generateVideo(
        imageUri: Uri,
        prompt: String,
        negativePrompt: String?,
        duration: Int,
        aspectRatio: String,
        resolution: String
    ): GenerateResponse = withContext(Dispatchers.IO) {
        val contentResolver = context.contentResolver

        // Check image file size
        var sizeBytes = 0L
        contentResolver.openInputStream(imageUri)?.use { input ->
            sizeBytes = input.available().toLong()
        }

        val maxAllowed = 20 * 1024 * 1024 // 20 MB
        if (sizeBytes > maxAllowed) {
            throw IllegalArgumentException("Image size exceeds 20MB maximum limit.")
        }

        val bytes = contentResolver.openInputStream(imageUri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Could not read image content.")

        val mimeType = contentResolver.getType(imageUri) ?: "image/jpeg"
        val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val imagePart = MultipartBody.Part.createFormData("image", "source_image.jpg", requestBody)

        val promptBody = prompt.toRequestBody("text/plain".toMediaTypeOrNull())
        val negPromptBody = negativePrompt?.takeIf { it.isNotBlank() }?.toRequestBody("text/plain".toMediaTypeOrNull())
        val durationBody = duration.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val aspectBody = aspectRatio.toRequestBody("text/plain".toMediaTypeOrNull())
        val resBody = resolution.toRequestBody("text/plain".toMediaTypeOrNull())
        val deviceIdBody = getDeviceId().toRequestBody("text/plain".toMediaTypeOrNull())

        apiService.generateVideo(
            image = imagePart,
            prompt = promptBody,
            negativePrompt = negPromptBody,
            duration = durationBody,
            aspectRatio = aspectBody,
            resolution = resBody,
            deviceId = deviceIdBody
        )
    }

    suspend fun getJobStatus(jobId: String): JobStatusResponse = withContext(Dispatchers.IO) {
        apiService.getJobStatus(jobId)
    }
}
