import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw } from "lucide-react";

interface ImageUploaderProps {
  imageFile: File | null;
  onImageSelected: (file: File | null) => void;
}

const MAX_SIZE_MB = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  onImageSelected,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format. Please upload JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageSelected(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-900 group shadow-lg">
          <img
            src={previewUrl}
            alt="Source Preview"
            className="w-full max-h-80 object-contain mx-auto block"
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Change Image
            </button>
            <button
              onClick={handleRemove}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" /> Remove Image
            </button>
          </div>
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-300">
            <span className="truncate max-w-[200px]">{imageFile?.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Change
              </button>
              <span>•</span>
              <button
                onClick={handleRemove}
                className="text-red-400 hover:text-red-300 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            dragActive
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-slate-700 hover:border-indigo-500/50 bg-slate-900/60"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-100">Upload Image</p>
            <p className="text-xs text-slate-400 mt-1">
              Tap to browse, capture with camera, or drag & drop
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPG, PNG, WEBP • Max {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400 mt-2 text-center font-medium">{error}</p>
      )}
    </div>
  );
};
