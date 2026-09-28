# Privacy Policy - AI Video Generator

Last updated: September 2026

## 1. Information We Collect
- **Uploaded Images:** We only collect and store image files that you voluntarily upload for the purpose of generating animated videos.
- **Anonymous Device Identifier:** For anonymous access without registration, our application generates an anonymous random installation identifier stored on your local device. We do not collect names, email addresses, phone numbers, or passwords.
- **Generation Parameters:** We store the prompt text, selected aspect ratio, and video duration associated with your generation request.

## 2. How Your Images and Videos Are Processed
- **Local GPU Inference:** Uploaded images are passed strictly through the local open-source Stable Video Diffusion neural network to compute latent motion representations.
- **No Third-Party AI Data Sharing:** Your images are NOT transmitted to third-party commercial AI providers (such as OpenAI, Runway, or Google Gemini).
- **No Model Retraining:** Your uploaded images and prompts are never used to train or fine-tune artificial intelligence models.

## 3. Temporary Storage & Automatic Deletion
- All uploaded image files and rendered MP4 video files are stored temporarily on the server in dedicated storage directories (`uploads/` and `generated/`).
- **Automatic 24-Hour Purge:** Our automated cleanup routine automatically purges and permanently deletes all files older than 24 hours from the server storage.

## 4. Video Credits and Fraud Prevention
- Video credits (both free initial allocations and daily free credits) are tracked against your anonymous device identifier in our server-side database.
- Generation transactions reserve a credit before inference and refund the credit immediately if an error occurs.

## 5. Third-Party Advertising and Payments
- If an ad network is enabled in the future, rewarded credits will require legitimate server-side verification tokens. We do not transmit your images to advertising networks.
- Payment processing for optional paid credit packs is handled securely through PCI-DSS compliant payment gateways. We never store payment card credentials on our servers.
