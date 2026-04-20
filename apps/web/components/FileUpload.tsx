"use client";

import { useState, useRef } from 'react';
import { UploadCloud, TestTube, Link as LinkIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: (filename: string, isYoutube?: boolean) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- YOUTUBE HANDLER ---
  const handleYoutubeSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!youtubeUrl.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Pass the URL and the 'true' flag to the orchestrator in page.tsx
      onUploadSuccess(youtubeUrl, true); 
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // --- PDF HANDLERS ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Pass the filename and 'false' flag to the orchestrator
        onUploadSuccess(data.filename, false);
      } else {
        alert("Upload failed. Is the Python server running?");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. The PDF Dropzone */}
      <div 
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 text-center cursor-pointer bg-[#1A1C23]/50 backdrop-blur-sm
          ${isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-[#1A1C23]'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
        
        <div className="w-16 h-16 mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
          {isProcessing && !youtubeUrl ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Upload a PDF</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Drag and drop your lecture slides, research papers, or study notes.
        </p>
      </div>

      {/* The Divider */}
      <div className="flex items-center gap-4 py-2 opacity-60">
        <div className="h-px flex-grow bg-white/10"></div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
        <div className="h-px flex-grow bg-white/10"></div>
      </div>

      {/* 2. The YouTube Input Box */}
      <form onSubmit={handleYoutubeSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <TestTube size={20} className="text-rose-500 group-focus-within:text-rose-400 transition-colors" />
        </div>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="Paste a YouTube lecture link..."
          className="w-full bg-[#1A1C23] border border-white/10 rounded-full pl-12 pr-32 py-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-lg"
        />
        <button 
          type="submit"
          disabled={!youtubeUrl.trim() || isProcessing}
          className="absolute inset-y-1.5 right-1.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 border border-white/5 flex items-center gap-2 shadow-md"
        >
          {isProcessing && youtubeUrl ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
          Import
        </button>
      </form>

    </div>
  );
}