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

  // 获取用户名，如果没有则默认为 Audience
  const userName = data?.userName || "Audience";
  // 发件人名称
  const senderName = "热情的冰冻生菜";

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
                <motion.div 
                    key="envelope" 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }} 
                    className="relative cursor-pointer group flex flex-col items-center justify-center h-full w-full" 
                    onClick={() => setViewState('letter')}
                >
                    <div className="relative">
                        {/* 信封主体容器 */}
                        <div className="w-[360px] h-[240px] md:w-[600px] md:h-[400px] bg-[#e8dcc5] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden transition-all duration-700 group-hover:rotate-1 group-hover:scale-105 group-hover:shadow-[0_35px_60px_-15px_rgba(192,57,43,0.4)]">
                            
                            {/* 纹理背景 */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply" />
                            
                            {/* 装饰性边框 (双线) */}
                            <div className="absolute top-3 left-3 right-3 bottom-3 border-4 border-double border-[#d4c5a5] pointer-events-none" />
                            
                            {/* --- 左上角：From --- */}
                            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 text-left opacity-80">
                                <div className="font-mono text-[9px] md:text-[10px] text-[#1a252f]/50 uppercase tracking-widest mb-1">From</div>
                                <div className="font-serif text-xs md:text-base text-[#1a252f] font-bold italic tracking-wide font-['Playfair_Display']">
                                    {senderName}
                                </div>
                            </div>

                            {/* --- 右上角：邮戳 --- */}
                            <div className="absolute top-6 right-6 md:top-8 md:right-8 w-20 h-20 md:w-28 md:h-28 border-2 md:border-4 border-cinnabar/30 rounded-full flex items-center justify-center rotate-[-12deg] opacity-60 mix-blend-multiply z-10">
                                <div className="text-[10px] md:text-xs text-cinnabar font-mono text-center font-bold leading-tight tracking-wider">
                                    THEATER<br/>ANNUAL REPORT<br/>2025
                                </div>
                            </div>

                            {/* --- 中上部：收件人区域 (向上移动，避开印章) --- */}
                            <div className="absolute top-[25%] md:top-[28%] z-20 flex flex-col items-center justify-center w-full px-12">
                                <div className="font-mono text-[8px] md:text-[10px] text-[#1a252f]/40 uppercase tracking-[0.4em] mb-3 md:mb-4">
                                    Private & Confidential
                                </div>
                                <div className="relative">
                                    <div className="font-serif text-2xl md:text-5xl text-ink-900 font-bold tracking-wide text-center transform -rotate-1 z-10 relative drop-shadow-sm">
                                        To. {userName}
                                    </div>
                                    {/* 名字下方的装饰线 */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-cinnabar/20" />
                                </div>
                            </div>

                            {/* --- 中下部：火漆印章 (作为开启按钮) --- */}
                            <div className="absolute bottom-[20%] md:bottom-[18%] flex flex-col items-center justify-center z-30">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-cinnabar to-[#8e281f] rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center border-[3px] border-[#e4d5b7] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(192,57,43,0.6)] transition-all duration-300 relative">
                                    {/* 印章内部的高光和纹理 */}
                                    <div className="absolute inset-0 rounded-full border border-white/10 opacity-50" />
                                    <div className="absolute inset-2 rounded-full border border-black/10 opacity-30 dashed" />
                                    <Sparkles className="text-[#ffd700] drop-shadow-md animate-pulse" size={36} strokeWidth={1.5} />
                                </div>
                            </div>
                            
                            {/* --- 底部：提示文字 --- */}
                            <div className="absolute bottom-5 md:bottom-6 font-serif text-[#1a252f]/30 tracking-[0.4em] text-[9px] md:text-[10px] font-bold group-hover:text-cinnabar transition-colors">
                                TAP TO OPEN
                            </div>
                        </div>
                    </div>
                    {/* 作者水印 */}
                    <AuthorMark />
                </motion.div>
            )}

            {/* 场景 2：信件阶段 */}
            {viewState === 'letter' && !data.isError && (
                <motion.div key="letter" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0, transition: { duration: 0.5 } }} className="relative w-full max-w-2xl md:max-w-4xl mx-4">
                    <div className="bg-[#fcf5e5] text-ink-900 p-10 md:p-16 rounded shadow-2xl relative font-serif overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#c0392b,#c0392b_10px,#fcf5e5_10px,#fcf5e5_20px,#1a252f_20px,#1a252f_30px,#fcf5e5_30px,#fcf5e5_40px)]" />
                        
                        {/* --- 修改：动态称呼 --- */}
                        <div className="mb-8 mt-4 flex justify-between items-end border-b border-ink-900/10 pb-6">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-ink-900">
                                Dear {userName},
                            </h2>
                        </div>

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
                                    AI {senderName}
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
                        {/* ✅ 添加作者水印 - 信件页 */}
                        <div className="absolute bottom-2 right-4 text-[9px] text-ink-900/20 font-serif z-50 pointer-events-none select-none tracking-widest">Designed by {senderName}</div>
                    </div>
                </motion.div>
            )}

            {/* 场景 3：幻灯片阶段 (保持不变) */}
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