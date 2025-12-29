import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft, Repeat } from 'lucide-react';
// 引入拆分出去的组件
import { 
    SlideOverview, SlideTimeline, SlideSpaceTime, SlideEconomics, 
    SlideKeywords, SlidePicks, SlideFinal, SlideCredits, ErrorView, AuthorMark 
} from './ReportSlides';

export default function AnnualReport({ isOpen, onClose, data, onRegenerate }) {
  const [viewState, setViewState] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  React.useEffect(() => {
    if (isOpen && data) {
      if (data.isError) {
        setViewState('error');
      } else {
        setViewState('envelope');
        setCurrentSlide(0);
      }
    } else {
      setViewState(null);
      setCurrentSlide(0);
    }
  }, [isOpen, data]);

  const slides = [
      { id: 'overview', component: SlideOverview },
      { id: 'timeline', component: SlideTimeline },
      { id: 'spacetime', component: SlideSpaceTime },
      { id: 'economics', component: SlideEconomics },
      { id: 'keywords', component: SlideKeywords },
      { id: 'picks', component: SlidePicks },
      { id: 'final', component: SlideFinal },
      { id: 'credits', component: SlideCredits },     
  ];

  if (!isOpen || !data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white z-50 p-2 transition-colors"><X size={32} /></button>

        <AnimatePresence mode="wait">
            {/* 场景 0 - 错误提示页 */}
            {viewState === 'error' && (
                <ErrorView key="error" onRegenerate={onRegenerate} onClose={onClose} />
            )}
            
            {/* 场景 1：信封阶段 */}
            {viewState === 'envelope' && !data.isError && (
                <motion.div key="envelope" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }} className="relative cursor-pointer group flex flex-col items-center justify-center h-full w-full" onClick={() => setViewState('letter')}>
                    <div className="relative">
                        <div className="w-[360px] h-[240px] md:w-[600px] md:h-[400px] bg-[#e8dcc5] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:rotate-1 group-hover:scale-105 group-hover:shadow-[0_35px_60px_-15px_rgba(192,57,43,0.4)]">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply" />
                            <div className="absolute top-3 left-3 right-3 bottom-3 border-4 border-double border-[#d4c5a5] pointer-events-none" />
                            <div className="absolute top-8 right-8 w-24 h-24 md:w-32 md:h-32 border-4 border-cinnabar/40 rounded-full flex items-center justify-center rotate-[-12deg] opacity-70 mix-blend-multiply">
                                <div className="text-xs md:text-sm text-cinnabar font-mono text-center font-bold leading-tight">THEATER<br/>ANNUAL REPORT<br/>2025</div>
                            </div>
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-cinnabar to-red-900 rounded-full shadow-lg flex items-center justify-center border-4 border-[#e8dcc5] relative z-20 group-hover:scale-110 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-full border border-white/20" />
                                <Sparkles className="text-gold animate-pulse" size={40} />
                            </div>
                            <div className="absolute bottom-8 font-serif text-[#1a252f]/60 tracking-[0.4em] text-xs md:text-sm font-bold group-hover:text-cinnabar transition-colors">TAP TO OPEN</div>
                        </div>
                    </div>
                    {/* ✅ 添加作者水印 - 信封页 */}
                    <AuthorMark />
                </motion.div>
            )}

            {/* 场景 2：信件阶段 */}
            {viewState === 'letter' && !data.isError && (
                <motion.div key="letter" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0, transition: { duration: 0.5 } }} className="relative w-full max-w-2xl md:max-w-4xl mx-4">
                    <div className="bg-[#fcf5e5] text-ink-900 p-10 md:p-16 rounded shadow-2xl relative font-serif overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#c0392b,#c0392b_10px,#fcf5e5_10px,#fcf5e5_20px,#1a252f_20px,#1a252f_30px,#fcf5e5_30px,#fcf5e5_40px)]" />
                        <div className="mb-8 mt-4 flex justify-between items-end border-b border-ink-900/10 pb-6"><h2 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-ink-900">Dear Audience,</h2></div>
                        <div className="prose prose-lg prose-p:text-ink-800 prose-p:leading-loose text-justify max-h-[60vh] overflow-y-auto custom-scrollbar pr-4 mb-10">
                            <div className="font-serif">
                                {data.letter && data.letter.replace(/\\n/g, '\n').split(/\n+/).map((para, i) => (
                                    para.trim() && <p key={i} className="mb-6 indent-8 text-ink-900/90 leading-loose">{para}</p>
                                ))}
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-ink-900/10 flex justify-end">
                            <div className="relative pr-4">
                                <div className="font-serif text-2xl md:text-3xl text-ink-900 font-bold italic tracking-wider transform -rotate-2 z-10 relative" style={{ fontFamily: '"Playfair Display", "Songti SC", "SimSun", serif' }}>
                                    AI 热情的冰冻生菜
                                </div>
                                <div className="font-mono text-xs text-gray-400 tracking-[0.2em] text-right mt-2 uppercase">
                                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-ink-900/10">
                             <button onClick={onRegenerate} className="flex items-center gap-2 text-sm text-gray-400 hover:text-cinnabar transition-colors group"><Repeat size={14} className="group-hover:rotate-180 transition-transform" /> Rewrite</button>
                            <button onClick={() => setViewState('slides')} className="bg-ink-900 text-[#fcf5e5] px-10 py-4 rounded-full flex items-center gap-3 hover:bg-cinnabar hover:shadow-xl transition-all text-lg font-bold"><span>Start The Show</span><ChevronRight size={20} /></button>
                        </div>
                        {/* ✅ 添加作者水印 - 信件页 (位置微调) */}
                        <div className="absolute bottom-2 right-4 text-[9px] text-ink-900/20 font-serif z-50 pointer-events-none select-none tracking-widest">Designed by 热情的冰冻生菜</div>
                    </div>
                </motion.div>
            )}

            {/* 场景 3：幻灯片阶段 */}
            {viewState === 'slides' && !data.isError && (
                <motion.div key="slides" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="w-[92vw] max-w-lg md:max-w-5xl h-[85vh] bg-[#0b0c10] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-30">
                             {slides.map((_, i) => (
                                 <div key={i} className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                                     <motion.div initial={{ width: 0 }} animate={{ width: i <= currentSlide ? '100%' : '0%' }} className={`h-full ${i === currentSlide ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/30'}`} />
                                 </div>
                             ))}
                        </div>
                        <div className="flex-1 w-full relative">
                            <AnimatePresence mode="wait">
                                <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="h-full w-full">
                                    {React.createElement(slides[currentSlide].component, { 
                                        data, 
                                        onClose,
                                        onPrev: () => setCurrentSlide(c => Math.max(0, c - 1)),
                                        onRegenerate: () => { onClose(); setTimeout(onRegenerate, 300); } 
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="absolute bottom-6 md:bottom-10 flex gap-6 md:gap-12 z-50">
                        <button disabled={currentSlide === 0} onClick={() => setCurrentSlide(c => c - 1)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/50 border border-white/10 hover:bg-white/20 disabled:opacity-0 transition-all text-white backdrop-blur-md"><ChevronLeft size={24} /></button>
                        <button disabled={currentSlide === slides.length - 1} onClick={() => setCurrentSlide(c => c + 1)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-cinnabar hover:bg-red-600 shadow-[0_0_20px_#e74c3c] disabled:opacity-0 transition-all text-white scale-110"><ChevronRight size={24} /></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
}