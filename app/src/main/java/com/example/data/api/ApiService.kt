package com.example.data.api

import com.example.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.*

interface ApiService {
    @GET("api/health")
    suspend fun getHealth(): HealthResponse

    @POST("api/users/profile")
    suspend fun getUserProfile(
        @Body body: UserRegisterRequest
    ): UserProfileResponse

    @GET("api/users/history/{deviceId}")
    suspend fun getUserHistory(
        @Path("deviceId") deviceId: String
    ): List<GenerationHistoryItem>

    @GET("api/credits/packages")
    suspend fun getCreditPackages(): List<PaymentPackage>

    @Multipart
    @POST("api/generate")
    suspend fun generateVideo(
        @Part image: MultipartBody.Part,
        @Part("prompt") prompt: RequestBody,
        @Part("negative_prompt") negativePrompt: RequestBody?,
        @Part("duration") duration: RequestBody,
        @Part("aspect_ratio") aspectRatio: RequestBody,
        @Part("resolution") resolution: RequestBody,
        @Part("device_id") deviceId: RequestBody
    ): GenerateResponse

    @GET("api/status/{jobId}")
    suspend fun getJobStatus(
        @Path("jobId") jobId: String
    ): JobStatusResponse
}
