import React, { useState, useRef } from "react";
import { UploadCloud, Loader2, X, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ImageUploader({ onUpload, currentImage, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return toast.error("Please select a valid image file");
    }

    setUploading(true);
    try {
      // 1. Compress
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 2. Upload
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.url) {
        onUpload(res.data.url);
        toast.success("Image uploaded successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {currentImage ? (
        <div className="relative rounded-xl border border-greyc overflow-hidden group">
          <img
            src={currentImage}
            alt="Uploaded"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onUpload("")}
              className="bg-white text-destructive p-2 rounded-full hover:scale-105 transition-transform"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            drag ? "border-gold bg-gold/5" : "border-greyc hover:border-gold/50"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="animate-spin mb-2 text-gold" size={24} />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
                <UploadCloud size={20} />
              </div>
              <p className="text-sm font-semibold text-ink">Click or drag image here</p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 5MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
