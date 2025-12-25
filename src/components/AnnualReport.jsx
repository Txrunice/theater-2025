import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Quote, Sparkles, MapPin, Calendar, Coins, Trophy, Clock, Repeat, Hourglass, Hash } from 'lucide-react';

// === 幻灯片 1: 概览 (Overview) ===
const SlideOverview = ({ data }) => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 relative">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            className="absolute top-0 right-0 bg-white/10 px-3 py-1 rounded-full text-xs text-gold border border-gold/30"
        >
            超过了 {data.summary.beatPercent}% 的观众
        </motion.div>

        <div className="space-y-2">
            <p className="text-gray-400 font-serif tracking-widest text-sm">THE YEAR OF DRAMA</p>
            <motion.h1 initial={{ y: 20 }} animate={{ y: 0 }} className="text-7xl md:text-9xl font-black font-serif text-white">
                2025
            </motion.h1>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-sm mt-8">
            <div className="text-center">
                 <p className="text-gray-500 text-xs uppercase mb-2">Total Plays</p>
                 <p className="text-4xl md:text-5xl font-serif text-cinnabar">{data.summary.totalCount}</p>
            </div>
            <div className="text-center">
                 <p className="text-gray-500 text-xs uppercase mb-2">Total Cost</p>
                 <p className="text-4xl md:text-5xl font-serif text-gold">¥{(data.summary.totalCost / 1000).toFixed(1)}k</p>
            </div>
        </div>
    </div>
);

// === 幻灯片 2: 首尾呼应 (First & Last) ===
const SlideTimeline = ({ data }) => (
    <div className="flex flex-col h-full justify-center px-4 space-y-10">
        <div className="relative border-l-2 border-white/10 pl-8 ml-4 space-y-12">
            {/* First Play */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cinnabar ring-4 ring-black" />
                <p className="text-xs text-cinnabar font-bold uppercase tracking-widest mb-1">The Beginning • {data.timeline.firstPlay.date}</p>
                <h3 className="text-2xl font-serif text-white mb-2">{data.timeline.firstPlay.title}</h3>
                <p className="text-gray-400 text-sm italic">"{data.timeline.firstPlay.comment}"</p>
            </motion.div>

            {/* Last Play */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gold ring-4 ring-black" />
                <p className="text-xs text-gold font-bold uppercase tracking-widest mb-1">The Finale • {data.timeline.lastPlay.date}</p>
                <h3 className="text-2xl font-serif text-white mb-2">{data.timeline.lastPlay.title}</h3>
                <p className="text-gray-400 text-sm italic">"{data.timeline.lastPlay.comment}"</p>
            </motion.div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-8">
            从初见到收官，跨越了全年的悲欢离合。
        </div>
    </div>
);

// === 幻灯片 3: 习惯与足迹 (Habits) ===
const SlideHabits = ({ data }) => (
    <div className="flex flex-col h-full justify-center px-4 space-y-6">
        <h3 className="text-2xl font-serif text-center text-white/90 mb-2">你的观演时区</h3>
        
        {/* 上半部分：最爱周几 */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="flex-1 bg-ink-800/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cinnabar/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Calendar className="text-cinnabar mb-4" size={48} />
            <p className="text-gray-400 text-sm mb-2 tracking-widest uppercase">最爱周几</p>
            <p className="text-5xl md:text-6xl font-black font-serif text-white">{data.habits.busyDay}</p>
        </motion.div>

        {/* 下半部分：城市足迹 */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="flex-1 bg-ink-800/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group"
        >
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-blue-400" size={24} />
                <span className="text-gray-400 text-sm tracking-widest uppercase">年度最爱剧场城市</span>
             </div>
             
             <p className="text-5xl md:text-6xl font-serif text-white mb-3">{data.habits.favCity}</p>
             
             <div className="px-4 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400">
                全年共打卡 <span className="text-white font-bold">{data.habits.totalCities}</span> 座城市
             </div>
        </motion.div>
    </div>
);

// === 幻灯片 4: 剧种与关键词 (Keywords) ===
const SlideKeywords = ({ data }) => (
    <div className="flex flex-col h-full justify-center px-4">
        <h3 className="text-xl font-serif text-center text-gray-400 mb-8 tracking-[0.2em]">年度观演成分</h3>
        
        {/* 词云模拟 - 改为 Flex 布局防止重叠 */}
        <div className="flex flex-wrap items-center justify-center content-center gap-x-8 gap-y-6 h-64 w-full mb-8 px-4">
            {data.stats.keywords.map((word, i) => {
                // 根据索引决定样式，不再随机位置
                const size = i === 0 ? 'text-4xl md:text-5xl' : i < 3 ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl';
                const color = i % 2 === 0 ? 'text-white' : 'text-gold';
                // 简单的规律性旋转，避免过度随机导致的重叠
                const rotate = i % 3 === 0 ? 'rotate-0' : (i % 3 === 1 ? 'rotate-6' : '-rotate-6');
                
                return (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`font-serif font-bold ${size} ${color} ${rotate} opacity-90 hover:scale-110 transition-transform cursor-default drop-shadow-lg`}
                    >
                        {word}
                    </motion.div>
                )
            })}
        </div>

        {/* 剧种条形图 - 增加一点底部边距 */}
        <div className="space-y-4 px-2">
            {data.stats.genres.slice(0, 3).map((g, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs md:text-sm">
                    <span className="w-20 text-right text-gray-400 font-serif">{g.name}</span>
                    <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${g.percent}%` }} 
                            transition={{ delay: 0.5 + idx * 0.1, duration: 1 }}
                            className="h-full bg-gradient-to-r from-cinnabar to-red-600 shadow-[0_0_10px_rgba(192,57,43,0.5)]"
                        />
                    </div>
                    <span className="w-12 text-white font-mono">{g.percent}%</span>
                </div>
            ))}
        </div>
    </div>
);

// === 幻灯片 5: 奖项 (Picks) ===
const SlidePicks = ({ data }) => (
    <div className="flex flex-col h-full justify-center space-y-8 px-4">
        {/* 年度最佳 */}
        <div className="text-center">
            <Trophy className="mx-auto text-gold mb-4 animate-bounce" size={40} />
            <p className="text-xs text-gold font-bold tracking-[0.3em] uppercase mb-2">Best of the Year</p>
            <h2 className="text-3xl font-serif font-black text-white mb-4 line-clamp-2">{data.picks.top.title}</h2>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <Quote size={16} className="text-white/20 mb-2" />
                <p className="text-sm text-gray-300 italic">"{data.picks.top.reason}"</p>
            </div>
        </div>

        {/* 隐藏宝藏 */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-4 bg-ink-800 p-4 rounded-xl border border-white/10"
        >
            <div className="bg-cinnabar/20 p-3 rounded-full text-cinnabar">
                <Sparkles size={20} />
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Hidden Gem / 惊喜</p>
                <p className="text-lg font-serif text-white">{data.picks.hidden.title || "无"}</p>
                <p className="text-xs text-gray-500 mt-1">{data.picks.hidden.reason || "今年你看的剧都很大众哦"}</p>
            </div>
        </motion.div>
    </div>
);

// === 幻灯片 6: 最终页 (Final) ===
const SlideFinal = ({ data, onRegenerate }) => (
    <div className="flex flex-col h-full justify-center items-center text-center px-6 relative">
        <p className="text-gray-400 text-sm mb-6 font-serif">2025 年度观演关键词</p>
        
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 mb-12">
            <div className="absolute inset-0 bg-cinnabar blur-[80px] opacity-30" />
            <div className="border-[6px] border-double border-gold/40 p-10 py-14 bg-black/40 backdrop-blur-sm shadow-2xl">
                <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gold-light to-gold drop-shadow-lg">
                    {data.userLabel}
                </h1>
            </div>
        </motion.div>

        {/* 重新生成按钮 */}
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onRegenerate}
            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/50 transition-all text-gray-400 hover:text-white text-sm"
        >
            <Repeat size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>如果不满意，点此重新生成</span>
        </motion.button>
    </div>
);


// === 主组件 ===
export default function AnnualReport({ isOpen, onClose, data, onRegenerate }) {
  const [viewState, setViewState] = useState('envelope'); 
  const [currentSlide, setCurrentSlide] = useState(0);

  // 幻灯片配置
  const slides = [
      { id: 'overview', component: SlideOverview },
      { id: 'timeline', component: SlideTimeline },
      { id: 'habits', component: SlideHabits },
      { id: 'keywords', component: SlideKeywords },
      { id: 'picks', component: SlidePicks },
      { id: 'final', component: SlideFinal },
  ];

  if (!isOpen || !data) return null;

  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-0 overflow-hidden"
    >
        {/* 关闭按钮 */}
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-50 p-2">
            <X size={24} />
        </button>

        <AnimatePresence mode="wait">
            
            {/* 1. 信封阶段 */}
            {viewState === 'envelope' && (
                <motion.div 
                    key="envelope"
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.2 }}
                    className="relative cursor-pointer group flex flex-col items-center"
                    onClick={() => setViewState('letter')}
                >
                    <div className="w-[320px] h-[220px] md:w-[450px] md:h-[300px] bg-[#e8dcc5] rounded-lg shadow-[0_20px_60px_rgba(192,57,43,0.3)] flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:rotate-1 group-hover:-translate-y-4">
                         {/* 装饰线 */}
                         <div className="absolute top-0 left-0 w-full h-full border-4 border-double border-[#d4c5a5] m-2 pointer-events-none" />
                         
                         <div className="absolute top-6 right-6 w-24 h-24 border-2 border-cinnabar/60 rounded-full flex items-center justify-center rotate-[-12deg] opacity-80 mix-blend-multiply">
                             <div className="text-xs text-cinnabar font-mono text-center font-bold">
                                 CONFIDENTIAL<br/>2025 REPORT<br/>THEATER
                             </div>
                         </div>
                         
                         <div className="w-20 h-20 bg-gradient-to-br from-cinnabar to-red-900 rounded-full shadow-lg flex items-center justify-center border-4 border-[#e8dcc5] group-hover:scale-110 transition-transform z-10">
                             <Sparkles className="text-gold" size={28} />
                         </div>
                         <div className="absolute bottom-6 font-serif text-[#1a252f]/60 tracking-[0.3em] text-xs">CLICK TO OPEN</div>
                    </div>
                </motion.div>
            )}

            {/* 2. 信件阶段 */}
            {viewState === 'letter' && (
                <motion.div 
                    key="letter"
                    initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
                    className="bg-[#fcf5e5] text-ink-900 w-full max-w-md md:max-w-lg p-8 md:p-12 rounded shadow-2xl relative font-serif mx-4"
                >
                    <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(45deg,#c0392b,#c0392b_10px,#fcf5e5_10px,#fcf5e5_20px,#1a252f_20px,#1a252f_30px,#fcf5e5_30px,#fcf5e5_40px)]" />
                    
                    <div className="mb-6 mt-2">
                        <h2 className="text-xl font-bold tracking-widest uppercase text-ink-900/40">Dear Audience,</h2>
                    </div>
                    
                    <div className="prose prose-p:text-ink-800 prose-p:leading-loose text-sm md:text-base max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-8 text-justify">
                        <p>{data.letter}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-ink-900/10">
                        <button onClick={onRegenerate} className="flex items-center gap-1 text-xs text-gray-400 hover:text-cinnabar transition-colors">
                            <Repeat size={12} /> 重写一封
                        </button>
                        <button 
                            onClick={() => setViewState('slides')}
                            className="bg-ink-900 text-[#fcf5e5] px-8 py-3 rounded-full flex items-center gap-2 hover:bg-cinnabar hover:shadow-lg transition-all"
                        >
                            <span>开启年度回忆</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* 3. 幻灯片阶段 */}
            {viewState === 'slides' && (
                <motion.div 
                    key="slides"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center relative"
                >
                    {/* 卡片容器 */}
                    <div className="w-full max-w-md md:max-w-2xl bg-[#0b0c10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative aspect-[3/5] md:aspect-[4/3] max-h-[85vh]">
                        
                        {/* 顶部进度条 */}
                        <div className="absolute top-0 left-0 w-full flex gap-1 p-2 z-20">
                             {slides.map((_, i) => (
                                 <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                     <motion.div 
                                         initial={{ width: 0 }} 
                                         animate={{ width: i <= currentSlide ? '100%' : '0%' }}
                                         className={`h-full ${i === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                                     />
                                 </div>
                             ))}
                        </div>

                        {/* 内容区域 */}
                        <div className="h-full w-full p-6 md:p-12 pt-10">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={currentSlide}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.4 }}
                                    className="h-full"
                                >
                                    {React.createElement(slides[currentSlide].component, { 
                                        data, 
                                        onRegenerate: () => { 
                                            // 重新生成前先关闭报告，增加流畅感
                                            onClose(); 
                                            setTimeout(onRegenerate, 300); 
                                        } 
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* 底部导航 (仅在非最后页显示或需要辅助时) */}
                    <div className="flex items-center gap-12 mt-6">
                        <button 
                            disabled={currentSlide === 0}
                            onClick={() => setCurrentSlide(c => c - 1)}
                            className="p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0 transition-all text-white"
                        >
                            <ChevronLeft />
                        </button>
                        <button 
                            disabled={currentSlide === slides.length - 1}
                            onClick={() => setCurrentSlide(c => c + 1)}
                            className="p-4 rounded-full bg-cinnabar hover:bg-cinnabar-glow shadow-lg disabled:opacity-0 transition-all text-white"
                        >
                            <ChevronRight />
                        </button>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
    </motion.div>
  );
}