"use client";

import { useRef, useState } from 'react';
import { Layers, Plus, Loader2, MessageSquare } from 'lucide-react';

export default function Sidebar({ sessions, onUploadSuccess }: { sessions: any[], onUploadSuccess: (f: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... same upload logic as before ...
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', { method: 'POST', body: formData });
      if (response.ok) onUploadSuccess((await response.json()).filename);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-300">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />

      {/* Playful, friendly branding */}
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-400 p-1.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Layers className="text-white" size={18} />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Flowww</span>
        </h1>
      </div>

      {/* Pill-shaped action button */}
      <div className="px-5 py-2">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all duration-300 disabled:opacity-50 shadow-sm border border-white/5 font-medium"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : <Plus size={18} className="text-indigo-400" />}
          {isUploading ? "Processing..." : "New Canvas"}
        </button>
      </div>

      {/* Soft rounded list items */}
      <div className="flex-grow overflow-y-auto px-3 mt-6 space-y-1">
        <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-3">Your Library</p>
        {sessions.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/5 cursor-pointer group text-slate-400 transition-all">
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
              <MessageSquare size={14} className="group-hover:text-indigo-300" />
            </div>
            <span className="truncate text-sm group-hover:text-slate-200">{s.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}