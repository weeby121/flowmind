"use client";

import { Layers, Plus, MessageSquare } from 'lucide-react';
import { UserButton } from "@clerk/nextjs";

interface SidebarProps {
  sessions: any[];
  onNewCanvas: () => void;
  onSessionSelect: (id: string) => void;
  currentSessionId?: string | null;
  mode: 'personal' | 'group'; // NEW
  setMode: (mode: 'personal' | 'group') => void; // NEW
}

export default function Sidebar({ 
  sessions, 
  onNewCanvas, 
  onSessionSelect,
  currentSessionId,
  mode,
  setMode
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full text-slate-300">
      {/* Branding */}
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-400 p-1.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Layers className="text-white" size={18} />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Flowww</span>
        </h1>
      </div>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-black/20 rounded-xl mb-6 mx-5 border border-white/5">
        <button 
          onClick={() => setMode('personal')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'personal' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Personal
        </button>
        <button 
          onClick={() => setMode('group')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'group' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Battle Room
        </button>
      </div>

      {/* Conditional Rendering: Only show personal tools if in personal mode */}
      {mode === 'personal' ? (
        <>
          {/* NEW CANVAS BUTTON */}
          <div className="px-5 py-2">
            <button 
              onClick={onNewCanvas}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all duration-300 shadow-sm border border-white/5 font-medium group"
            >
              <Plus size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              New Canvas
            </button>
          </div>

          {/* Library List */}
          <div className="flex-grow overflow-y-auto px-3 mt-6 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-3">Your Library</p>
            
            {sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div 
                  key={s.id} 
                  onClick={() => onSessionSelect(s.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer group transition-all ${
                    isActive ? 'bg-indigo-500/10 text-indigo-200' : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-500/20' : 'bg-white/5 group-hover:bg-indigo-500/20'}`}>
                    <MessageSquare size={14} className={isActive ? 'text-indigo-300' : 'group-hover:text-indigo-300'} />
                  </div>
                  <span className="truncate text-sm">{s.title}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State for Group Mode Sidebar */
        <div className="flex-grow overflow-y-auto px-5 mt-4 text-center">
          <p className="text-xs text-slate-500 leading-relaxed italic">
            Join or host a squad to see your active battle rooms here.
          </p>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
          <UserButton />
          <span className="text-sm font-medium text-slate-300">My Account</span>
        </div>
      </div>
    </div>
  );
}