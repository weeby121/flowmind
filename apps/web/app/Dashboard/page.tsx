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
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'revealing_summary' | 'complete'>('idle');
  const [sessions, setSessions] = useState([{ id: '1', title: 'Latex Compilation Basics' }]);

  const handleUploadSuccess = async (filename: string) => {
    setStatus('analyzing');
    setResearchData(null);
    setGraphData(null);
    setActivePanelData(null);

    try {
      const response = await fetch(`/api/generate-flow?topic=Main Concepts`);
      if (!response.ok) throw new Error("AI Generation failed");

      const data = await response.json();

      const mainSummary = { type: 'main', title: 'Document Overview', content: data.summary };
      setResearchData(mainSummary);
      setActivePanelData(mainSummary);
      setGraphData(data);
      
      setStatus('revealing_summary');

      setTimeout(() => {
        setStatus('complete');
        setSessions(prev => [{ id: Date.now().toString(), title: filename }, ...prev]);
      }, 2000);

    } catch (error) {
      console.error("Dashboard Error:", error);
      setStatus('idle');
      alert("AI Generation failed. Check the Python terminal.");
    }
  };

  const handleNodeSelect = (node: any) => {
    setActivePanelData({
      type: 'node',
      title: node.label,
      summary: node.summary,
      content: node.content
    });
  };

  const handlePaneClick = () => {
    if (researchData) setActivePanelData(researchData);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans">
      
      {/* FIX: Fixed width sidebar (w-72) for stability, no more squished text */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0a0a0c] z-40 flex flex-col">
        <Sidebar sessions={sessions} onUploadSuccess={handleUploadSuccess} />
      </aside>

      <main className="relative flex-grow h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-[#050505] to-black">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.5, type: "spring" }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </motion.div>
          )}

          {status === 'analyzing' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
            >
               <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
               <p className="text-indigo-400 font-medium tracking-widest uppercase text-sm animate-pulse">Groq is synthesizing data...</p>
            </motion.div>
          )}

          {status === 'complete' && (
            <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
              <FlowCanvas data={graphData} onNodeSelect={handleNodeSelect} onPaneClick={handlePaneClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {(status === 'revealing_summary' || status === 'complete') && (
          <motion.section 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-[450px] flex-shrink-0 border-l border-white/10 bg-[#0a0a0c]/90 backdrop-blur-2xl z-30 shadow-2xl"
          >
            <StudyPanel data={activePanelData} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}