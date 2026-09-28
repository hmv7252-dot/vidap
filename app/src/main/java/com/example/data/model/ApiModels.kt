package com.example.data.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class HealthResponse(
    @Json(name = "status") val status: String = "",
    @Json(name = "gpu_available") val gpuAvailable: Boolean = false,
    @Json(name = "gpu_name") val gpuName: String? = null,
    @Json(name = "model_loaded") val modelLoaded: Boolean = false,
    @Json(name = "model_name") val modelName: String = "",
    @Json(name = "active_jobs") val activeJobs: Int = 0
)

@JsonClass(generateAdapter = true)
data class UserRegisterRequest(
    @Json(name = "device_id") val deviceId: String
)

@JsonClass(generateAdapter = true)
data class UserProfileResponse(
    @Json(name = "user_id") val userId: Int = 0,
    @Json(name = "device_id") val deviceId: String = "",
    @Json(name = "free_credits") val freeCredits: Int = 3,
    @Json(name = "paid_credits") val paidCredits: Int = 0,
    @Json(name = "total_credits") val totalCredits: Int = 3,
    @Json(name = "daily_free_available") val dailyFreeAvailable: Boolean = true,
    @Json(name = "created_at") val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class GenerateResponse(
    @Json(name = "job_id") val jobId: String,
    @Json(name = "status") val status: String,
    @Json(name = "message") val message: String
)

@JsonClass(generateAdapter = true)
data class JobStatusResponse(
    @Json(name = "job_id") val jobId: String = "",
    @Json(name = "status") val status: String = "queued",
    @Json(name = "progress") val progress: Int = 0,
    @Json(name = "message") val message: String = "",
    @Json(name = "video_url") val videoUrl: String? = null,
    @Json(name = "thumbnail_url") val thumbnailUrl: String? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class GenerationHistoryItem(
    @Json(name = "id") val id: Int,
    @Json(name = "job_id") val jobId: String,
    @Json(name = "prompt") val prompt: String,
    @Json(name = "status") val status: String,
    @Json(name = "video_url") val videoUrl: String? = null,
    @Json(name = "thumbnail_url") val thumbnailUrl: String? = null,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "completed_at") val completedAt: String? = null
)

@JsonClass(generateAdapter = true)
data class PaymentPackage(
    @Json(name = "id") val id: String,
    @Json(name = "credits") val credits: Int,
    @Json(name = "name") val name: String,
    @Json(name = "description") val description: String,
    @Json(name = "price_cents") val priceCents: Int,
    @Json(name = "currency") val currency: String
)
