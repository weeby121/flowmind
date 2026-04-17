"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import FlowCanvas from '@/components/FlowCanvas';
import StudyPanel from '@/components/StudyPanel';
import FileUpload from '@/components/FileUpload';

export default function Dashboard() {
  const [researchData, setResearchData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [activePanelData, setActivePanelData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [sessions, setSessions] = useState([{ id: '1', title: 'Latex Compilation Basics' }]);

  const handleUploadSuccess = async (filename: string) => {
    setStatus('analyzing');
    setResearchData(null);
    setGraphData(null);
    setActivePanelData(null);

    try {
      const response = await fetch(`/api/generate-flow?topic=Main Concepts`);
      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      const mainSummary = { type: 'main', title: 'Document Overview', content: data.summary };
      
      setResearchData(mainSummary);
      setActivePanelData(mainSummary);
      setGraphData(data);
      
      setStatus('complete');
      setSessions(prev => [{ id: Date.now().toString(), title: filename }, ...prev]);

    } catch (error) {
      console.error("Error:", error);
      setStatus('idle');
    }
  };

  return (
    // Rich, dark slate base instead of stark black
    <div className="flex h-screen w-full bg-[#0B0C10] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar: Soft blur, borderless feel */}
      <aside className="w-[280px] flex-shrink-0 bg-[#12131A] border-r border-white/5 z-40 flex flex-col relative shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <Sidebar sessions={sessions} onUploadSuccess={handleUploadSuccess} />
      </aside>

      {/* Main Stage with subtle ambient mesh glow */}
      <main className="relative flex-grow h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0B0C10] to-[#0B0C10]">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-10">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </motion.div>
          )}

          {status === 'analyzing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center z-10">
               <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
               <p className="text-indigo-200 text-sm font-medium tracking-wide">Mapping concepts...</p>
            </motion.div>
          )}

          {status === 'complete' && (
            <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-0">
              <FlowCanvas data={graphData} onNodeSelect={(node: any) => setActivePanelData({ type: 'node', ...node })} onPaneClick={() => setActivePanelData(researchData)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Panel: Floating glass effect */}
      <AnimatePresence>
        {status === 'complete' && (
          <motion.section 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="w-[420px] flex-shrink-0 bg-[#12131A]/90 backdrop-blur-xl border-l border-white/5 z-30 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.3)]"
          >
            <StudyPanel data={activePanelData} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}