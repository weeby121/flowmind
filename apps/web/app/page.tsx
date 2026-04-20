"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, Zap, TestTube, FileText, Sparkles } from 'lucide-react';

export default function LandingPage() {
  // Framer Motion variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Background Ambient Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-3xl rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-400 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Layers className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">
            Flowwmind
          </span>
        </div>
        <Link href="/Dashboard">
          <button className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all backdrop-blur-md">
            Sign In
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Playful Badge */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>AI-Powered Study Architect</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Turn hours of lectures into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-gradient-x">
              seconds of insight.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
            Upload massive PDFs or paste two-hour YouTube lectures. Flowwmind instantly generates interactive mind maps and a dedicated AI tutor so you can master any concept at lightning speed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Link href="/Dashboard">
              <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                Enter the Canvas <ArrowRight size={20} />
              </button>
            </Link>
            <button className="px-8 py-4 rounded-full bg-[#1A1C23] hover:bg-[#252833] border border-white/10 font-bold text-lg text-slate-300 transition-all">
              about us
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Feature Cards (Bento Grid Style) */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-[#1A1C23]/80 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Deep PDF Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Drop in research papers or slide decks. Our local vector engine processes thousands of pages without breaking a sweat.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-[#1A1C23]/80 backdrop-blur-xl border border-white/5 hover:border-rose-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
              <TestTube size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">YouTube to Mind-Map</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Paste a link to any lecture. Flowwmind rips the transcript and architects a visual network of every concept discussed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-[#1A1C23]/80 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast RAG</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Chat instantly with your documents. Powered by Gemini Flash and Groq 70B for zero-latency, high-accuracy answers.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 AI Lab project. Built for the future of learning.</p>
      </footer>
    </div>
  );
}