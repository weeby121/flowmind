"use client";

import { useRef, useState, useEffect } from 'react';
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TestTube, User, LogOut, Swords, Users, Layers, Plus, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import FlowCanvas from '@/components/FlowCanvas';
import StudyPanel from '@/components/StudyPanel';
import FileUpload from '@/components/FileUpload';

// Helper to extract YouTube ID so frontend matches backend's saved .txt file
const getYoutubeVideoId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

// Dynamic Backend URL for Deployment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();

  // --- Core App Mode ---
  const [appMode, setAppMode] = useState<'personal' | 'group'>('personal');

  // --- Personal Mode States ---
  const [researchData, setResearchData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [activePanelData, setActivePanelData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState('');
  const [activeSessionFiles, setActiveSessionFiles] = useState<string[]>([]); // Tracks active files for RAG isolation

  // --- Group Mode States ---
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isGroupActionLoading, setIsGroupActionLoading] = useState(false);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const [groupDocs, setGroupDocs] = useState<any[]>([]);
  const [quizData, setQuizData] = useState<any[] | null>(null);

  // --- Quiz Player States ---
  const [isQuizPlaying, setIsQuizPlaying] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]); 

  // --- Logic: Host a Room ---
  const handleHostRoom = async () => {
    setIsGroupActionLoading(true);
    try {
      const res = await fetch('/api/groups', { method: 'POST' });
      if (!res.ok) throw new Error("Failed to create room");
      const groupData = await res.json();
      setActiveGroup(groupData);
    } catch (error) {
      console.error(error);
      alert("Failed to create the Battle Room.");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  // --- Logic: Join a Room ---
  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) return;
    setIsGroupActionLoading(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCodeInput.toUpperCase() })
      });
      if (!res.ok) throw new Error("Invalid invite code");
      const groupData = await res.json();
      setActiveGroup(groupData);
    } catch (error) {
      console.error(error);
      alert("Could not join the squad. Check the invite code!");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  // --- Logic: Initiate Quiz ---
  const handleInitiateQuiz = async () => {
    if (groupDocs.length === 0) {
      alert("You need to add at least one document to the pool first!");
      return;
    }

    setIsGroupActionLoading(true);
    try {
      const filenames = groupDocs.map(doc => doc.fileName);
      
      const res = await fetch(`${BACKEND_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames })
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      
      await fetch(`/api/groups/${activeGroup.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData: data.questions })
      });

      setQuizData(data.questions);
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      alert("The AI failed to create the quiz. Make sure your Python server is running!");
    } finally {
      setIsGroupActionLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer || !quizData) return;
    setSelectedAnswer(option);
    const correctAnswer = quizData[currentQIdx].answer;
    if (option === correctAnswer) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQIdx < quizData.length - 1) {
        setCurrentQIdx(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setIsQuizFinished(true);
      }
    }, 1500);
  };
  
  const handleLeaveRoom = () => {
    setActiveGroup(null);
    setJoinCodeInput('');
    setQuizData(null); 
    setIsQuizPlaying(false);
    setCurrentQIdx(0);
    setScore(0);
    setIsQuizFinished(false);
    setSelectedAnswer(null);
    setLeaderboard([]);
  };

  const handleGroupFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroup) return;

    setIsGroupActionLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const pythonRes = await fetch(`${BACKEND_URL}/api/upload`, { 
        method: 'POST', 
        body: formData 
      });
      if (!pythonRes.ok) throw new Error("Python upload failed");
      const { filename } = await pythonRes.json();

      const dbRes = await fetch(`/api/groups/${activeGroup.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: filename })
      });

      if (dbRes.ok) {
        const newDoc = await dbRes.json();
        setGroupDocs(prev => [...prev, newDoc]);
      }
    } catch (error) {
      console.error("Group upload error:", error);
      alert("Failed to add document to the pool.");
    } finally {
      setIsGroupActionLoading(false);
      if (groupFileInputRef.current) groupFileInputRef.current.value = "";
    }
  };

  // Submit Score when Finished
  useEffect(() => {
    if (isQuizFinished && activeGroup) {
      const submitScore = async () => {
        try {
          await fetch(`/api/groups/${activeGroup.id}/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
          });
        } catch (error) {
          console.error("Failed to submit score", error);
        }
      };
      submitScore();
    }
  }, [isQuizFinished, activeGroup, score]);

  // Fetch Session History (Personal)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) setSessions(await res.json());
      } catch (error) {
        console.error("Failed to fetch history", error);
      }
    };
    fetchSessions();
  }, []);

  // --- UNIFIED CACHE-BUSTING HEARTBEAT ---
  useEffect(() => {
    if (!activeGroup) return;

    const pollDatabase = async () => {
      try {
        const timestamp = Date.now();
        
        if (!isQuizPlaying && !isQuizFinished) {
          const docRes = await fetch(`/api/groups/${activeGroup.id}/documents?t=${timestamp}`);
          if (docRes.ok) setGroupDocs(await docRes.json());

          if (!quizData) {
            const syncRes = await fetch(`/api/groups/${activeGroup.id}/sync?t=${timestamp}`);
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.isQuizActive && syncData.quizData) {
                setQuizData(syncData.quizData);
              }
            }
          }
        }

        if (isQuizFinished) {
          const lbRes = await fetch(`/api/groups/${activeGroup.id}/leaderboard?t=${timestamp}`);
          if (lbRes.ok) setLeaderboard(await lbRes.json());
        }

      } catch (err) {
        console.error("Polling Error:", err);
      }
    };

    pollDatabase();
    const intervalId = setInterval(pollDatabase, 3000);

    return () => clearInterval(intervalId);
  }, [activeGroup, quizData, isQuizPlaying, isQuizFinished]);

  const handleNewCanvas = () => {
    setStatus('idle');
    setGraphData(null);
    setResearchData(null);
    setActivePanelData(null);
    setActiveSessionId(null);
    setYtUrl('');
  };

  // --- UPDATED: Load Session with Scoped Files ---
  const handleLoadSession = async (sessionId: string) => {
      setStatus('analyzing');
      setActiveSessionId(sessionId);
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        
        setGraphData(data.graphData);

        // Map the stored string back into the activeSessionFiles array
        setActiveSessionFiles(data.filenames ? data.filenames.split(',') : []);

        const summaryData = { type: 'main', title: data.title, content: data.graphData.summary };
        setResearchData(summaryData);
        setActivePanelData(summaryData);
        setStatus('complete');
      } catch (error) {
        console.error(error);
        setStatus('idle');
      }
    };

  // --- UPDATED: Save Correct Filenames during Upload ---
  const handleUploadSuccess = async (source: string, isYoutube: boolean = false) => {
    setStatus('analyzing');
    try {
      let response;
      let targetFile = source; // Default to the source string (PDF filename)

      if (isYoutube) {
        response = await fetch(`${BACKEND_URL}/api/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source })
        });
        
        // Ensure frontend tracks the exact `.txt` file Python creates for YouTube
        const vidId = getYoutubeVideoId(source);
        if (vidId) {
          targetFile = `${vidId}.txt`;
        }
      } else {
        response = await fetch(`${BACKEND_URL}/api/generate-flow?topic=${encodeURIComponent(source)}`);
      }

      if (!response.ok) throw new Error("AI Generation failed");
      const data = await response.json();
      
      const displayTitle = isYoutube ? 'YouTube Overview' : source;
      const mainSummary = { type: 'main', title: displayTitle, content: data.summary };
      
      setResearchData(mainSummary);
      setActivePanelData(mainSummary);
      setGraphData(data);
      setStatus('complete');

      // Set the active file using the corrected target format
      setActiveSessionFiles([targetFile]); 

      const dbResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: isYoutube ? "YouTube Lecture" : source, 
          graphData: data,
          filenames: targetFile // Save correct identifier
        })
      });
      
      if (dbResponse.ok) {
        const savedSession = await dbResponse.json();
        setSessions(prev => [savedSession, ...prev]);
        setActiveSessionId(savedSession.id);
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert("AI Backend is acting up.");
    }
  };

  const handleNodeSelect = (node: any) => {
    setActivePanelData({ type: 'node', title: node.label, summary: node.summary, content: node.content });
  };

  const handlePaneClick = () => {
    if (researchData) setActivePanelData(researchData);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-slate-200 overflow-hidden font-sans">
      
      <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0a0a0c] z-40">
        <Sidebar 
          sessions={sessions} 
          onNewCanvas={handleNewCanvas} 
          onSessionSelect={handleLoadSession} 
          currentSessionId={activeSessionId}
          mode={appMode}
          setMode={setAppMode}
        />
      </aside>

      <main className="relative flex-grow h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-[#050505] to-black">
        
        {/* Floating Top Right Buttons */}
        <div className="absolute top-6 right-8 z-50 flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-slate-300">
            <User size={16} />
            <span>Profile</span>
          </button>
          
          <button 
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {appMode === 'personal' && (
            <motion.div key="personal-mode" className="w-full h-full">
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div 
                    key="idle-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                      <Sparkles className="text-indigo-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Empty Canvas</h2>
                    <p className="text-slate-500 max-sm">Upload a source from the right panel to start your visual study session.</p>
                  </motion.div>
                )}
                {status === 'analyzing' && (
                  <motion.div key="loading" className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-sm">
                     <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                     <p className="text-indigo-400 font-medium tracking-widest uppercase text-xs animate-pulse">Processing knowledge...</p>
                  </motion.div>
                )}
                {status === 'complete' && (
                  <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0">
                    <FlowCanvas data={graphData} onNodeSelect={handleNodeSelect} onPaneClick={handlePaneClick} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {appMode === 'group' && (
            <motion.div 
              key="group-hub" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="h-full w-full flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar"
            >
              {!activeGroup ? (
                <div className="w-full max-w-4xl space-y-8">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">Study Battles</h2>
                    <p className="text-slate-400 max-w-lg mx-auto">Create a room, pool your PDFs collectively, and generate an AI quiz to test your squad.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-[#0a0a0c] border border-white/5 p-10 rounded-[2rem] hover:bg-white/5 transition-colors flex flex-col items-center text-center shadow-xl group">
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                        <Swords className="text-indigo-400" size={36} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Host a Room</h3>
                      <button 
                        onClick={handleHostRoom} disabled={isGroupActionLoading}
                        className="w-full py-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all disabled:opacity-50"
                      >
                        {isGroupActionLoading ? "Generating..." : "Generate Class Code"}
                      </button>
                    </div>
                    <div className="bg-[#0a0a0c] border border-white/5 p-10 rounded-[2rem] flex flex-col items-center text-center shadow-xl">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                        <Users className="text-emerald-400" size={36} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Join a Squad</h3>
                      <div className="flex gap-3 w-full">
                        <input 
                          type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                          placeholder="FLW-CODE" maxLength={10}
                          className="flex-grow bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center uppercase font-bold text-white focus:border-indigo-500 focus:outline-none transition-all"
                        />
                        <button onClick={handleJoinRoom} disabled={isGroupActionLoading || !joinCodeInput} className="px-8 rounded-xl bg-slate-800 text-white font-medium disabled:opacity-50">Enter</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !quizData ? (
                <div className="w-full h-full max-w-5xl flex flex-col pt-10">
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{activeGroup.name}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-slate-400">Invite Code:</span>
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg tracking-widest font-mono font-bold text-sm border border-indigo-500/30">{activeGroup.inviteCode}</span>
                      </div>
                    </div>
                    <button onClick={handleLeaveRoom} className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20">Leave Squad</button>
                  </div>

                  <div className="w-full h-full p-8 flex flex-col">
                    {groupDocs.length === 0 ? (
                      <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"><Layers className="text-slate-500" size={40} /></div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">Collective Knowledge Pool</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Drop your PDFs here. Once everyone has contributed, the host can initiate the quiz battle.</p>
                      </div>
                    ) : (
                      <div className="flex-grow overflow-y-auto mb-4 grid grid-cols-2 gap-4">
                        {groupDocs.map((doc, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg"><Layers className="text-indigo-400" size={20} /></div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-white truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Ready for Indexing</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex justify-center">
                      <input type="file" ref={groupFileInputRef} onChange={handleGroupFileUpload} accept=".pdf" className="hidden" />
                      <button 
                        onClick={() => groupFileInputRef.current?.click()} disabled={isGroupActionLoading}
                        className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition flex items-center gap-2"
                      >
                        {isGroupActionLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                        {isGroupActionLoading ? "Uploading..." : "Add Document"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-indigo-950/30 border border-indigo-500/20 rounded-3xl flex justify-between items-center">
                    {user?.id === activeGroup.hostId ? (
                      <>
                        <p className="text-indigo-200 text-sm">
                          <span className="font-bold">Status:</span> {isGroupActionLoading ? "AI is forging the battle..." : "You are the Host. Initiate when ready."}
                        </p>
                        <button 
                          onClick={handleInitiateQuiz} disabled={isGroupActionLoading || groupDocs.length === 0}
                          className="px-10 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 flex items-center gap-3"
                        >
                          {isGroupActionLoading && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                          {isGroupActionLoading ? "GENERATING..." : "INITIATE QUIZ"}
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2">
                        <div className="flex items-center justify-center gap-4 text-indigo-300">
                          <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                          <span className="font-medium tracking-widest uppercase text-sm">Waiting for the Host to initiate battle...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full max-w-4xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in p-8">
                  {!isQuizPlaying ? (
                    <div>
                      <div className="w-24 h-24 bg-indigo-500/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-[0_0_40px_rgba(99,102,241,0.3)]"><Swords className="text-indigo-400" size={48} /></div>
                      <h2 className="text-5xl font-black text-white mb-4">BATTLE COMMENCES</h2>
                      <p className="text-xl text-slate-400 mb-12">The AI has forged <span className="text-indigo-400 font-bold">{quizData.length} questions</span> from your collective knowledge.</p>
                      <button onClick={() => setIsQuizPlaying(true)} className="px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl shadow-lg transition-all hover:scale-105">ENTER ARENA</button>
                    </div>
                  ) : isQuizFinished ? (
                    <div className="w-full flex gap-8 h-full max-h-[600px]">
                      <div className="w-1/2 bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col justify-center items-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Battle Complete!</h2>
                        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-violet-600 mb-8">{score} <span className="text-4xl text-slate-600">/ {quizData.length}</span></div>
                        <button onClick={handleLeaveRoom} className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-white/10 w-full">Return to Hub</button>
                      </div>
                      
                      <div className="w-1/2 bg-[#0a0a0c] border border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                          <div className="p-3 bg-amber-500/10 rounded-xl"><Trophy className="text-amber-500" size={24} /></div>
                          <h3 className="text-2xl font-bold text-white">Live Rankings</h3>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-2">
                          {leaderboard.length === 0 ? (
                             <p className="text-slate-500 text-sm mt-10">Awaiting other warriors...</p>
                          ) : (
                            leaderboard.map((member, idx) => (
                              <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-500/20 text-amber-500' : idx === 1 ? 'bg-slate-300/20 text-slate-300' : idx === 2 ? 'bg-orange-700/20 text-orange-500' : 'bg-white/5 text-slate-500'}`}>
                                    {idx + 1}
                                  </div>
                                  <span className="font-bold text-white">{member.userName}</span>
                                </div>
                                <span className="text-indigo-400 font-black text-lg">{member.score} <span className="text-sm text-slate-500 font-medium">pts</span></span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-3xl">
                      <div className="flex justify-between items-center mb-8 px-4"><span className="text-indigo-400 font-bold text-sm">Question {currentQIdx + 1} of {quizData.length}</span><span className="text-slate-400 font-medium">Score: <span className="text-white">{score}</span></span></div>
                      <div className="bg-[#0a0a0c] border border-white/10 p-10 rounded-[2rem] shadow-2xl mb-6"><h3 className="text-2xl font-bold text-white">{quizData[currentQIdx].question}</h3></div>
                      <div className="grid grid-cols-1 gap-4">
                        {quizData[currentQIdx].options.map((opt: string, idx: number) => {
                          const isSelected = selectedAnswer === opt;
                          const isCorrect = opt === quizData[currentQIdx].answer;
                          let btnStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                          if (selectedAnswer) {
                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
                            else if (isSelected) btnStyle = "bg-red-500/20 border-red-500/50 text-red-300";
                            else btnStyle = "bg-black/50 border-white/5 text-slate-600 opacity-50";
                          }
                          return (
                            <button key={idx} onClick={() => handleAnswerSelect(opt)} disabled={!!selectedAnswer} className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium text-lg ${btnStyle}`}>{opt}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!isQuizFinished && <button onClick={handleLeaveRoom} className="mt-12 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium">Abort Mission</button>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {appMode === 'personal' && (
          <motion.aside initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="w-[450px] flex-shrink-0 border-l border-white/10 bg-[#0a0a0c]/90 backdrop-blur-2xl z-30 overflow-y-auto">
            <AnimatePresence mode="wait">
              {status === 'idle' ? (
                <div className="p-8 space-y-10">
                  <FileUpload onUploadSuccess={handleUploadSuccess} />
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">YouTube Video</label>
                    <div className="relative group">
                      <TestTube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUploadSuccess(ytUrl, true)}
                        placeholder="Paste link and press Enter"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>
              ) : <StudyPanel data={activePanelData} activeSessionFiles={activeSessionFiles} />}
            </AnimatePresence>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}