"use client";

import { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: (filename: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUploadSuccess(data.filename);
      } else {
        alert("Upload failed. Is FastAPI running?");
      }
    } catch (err) {
      console.error("Upload Error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group w-96 p-10 rounded-3xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-xl hover:border-indigo-500/50 transition-all duration-300 text-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        disabled={isUploading}
      />
      
      <div className="relative flex flex-col items-center z-20 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-indigo-400" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          {isUploading ? "Uploading PDF..." : "Drop your lecture notes"}
        </h3>
        <p className="text-sm text-slate-400 font-medium">
          Powered by local AI inference
        </p>
      </div>
    </div>
  );
}