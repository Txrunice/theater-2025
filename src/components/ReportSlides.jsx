import React, { useState, useRef, useEffect } from 'react'; // ✅ 修改这里：添加 hooks
import { motion } from 'framer-motion';
import { 
    Quote, Sparkles, MapPin, Calendar, Trophy, Clock, Flame, Coffee, Activity, ArrowRight, AlertTriangle, RefreshCcw, Repeat,
    Plus, X, Film, PlayCircle // ✅ 修改这里：添加 Plus, X, Film, PlayCircle
} from 'lucide-react';
import { CityMapAnimation } from './CityMapAnimation';


// ==========================================
// 公共作者水印组件 (统一管理作者信息)
// ==========================================
export const AuthorMark = ({ className = "" }) => (
    <div className={`absolute bottom-3 right-6 text-[10px] text-white/20 font-serif z-50 pointer-events-none select-none tracking-widest ${className}`}>
        Designed by 热情的冰冻生菜
    </div>
);

// === Slide 1: 概览 ===
export const SlideOverview = ({ data }) => (
    <div className="flex flex-col h-full px-6 py-8 relative overflow-hidden">
        {/* ... 原有代码内容 ... */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-gold/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex-shrink-0 flex justify-center mb-4 z-10">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 px-6 py-3 rounded-full text-sm md:text-base text-gold border border-gold/30 italic text-center shadow-[0_0_20px_rgba(255,215,0,0.15)] backdrop-blur-md">
                "{data.summary_text}"
            </motion.div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center z-10 my-4">
            <p className="text-gray-500 font-serif tracking-[0.5em] text-xs md:text-sm mb-4 uppercase">The Year of Drama</p>
            <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="text-[6rem] md:text-[9rem] lg:text-[11rem] font-black font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 leading-none drop-shadow-2xl">
                2025
            </motion.h1>
        </div>
        <div className="flex-shrink-0 w-full bg-white/5 rounded-[2rem] p-6 md:p-8 border border-white/10 backdrop-blur-md relative overflow-hidden z-10">
            <div className="grid grid-cols-2 gap-8 items-center">
                <div className="text-left">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-2 tracking-wider"><Clock size={14} /> Total Duration</div>
                    <p className="text-5xl md:text-7xl font-serif text-white tracking-tighter">{data.extraStats.time.totalHours}<span className="text-2xl text-gray-500 font-sans font-normal ml-1">h</span></p>
                </div>
                <div className="text-left border-l border-white/10 pl-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-2 tracking-wider"><Activity size={14} /> Equivalent To</div>
                    <p className="text-lg md:text-xl font-serif text-gold leading-tight">{data.extraStats.time.activityName}</p>
                    <p className="text-3xl md:text-4xl font-serif text-white mt-1">× {data.extraStats.time.activityCount}</p>
                </div>
            </div>
        </div>
        {/* ✅ 添加作者水印 */}
        <AuthorMark />
    </div>
);

// === Slide 2: 时间线 ===
export const SlideTimeline = ({ data }) => (
    <div className="flex flex-col h-full px-6 md:px-12 py-8 relative overflow-hidden">
        {/* ... 原有代码 ... */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8rem] md:text-[12rem] font-serif text-white/5 font-black select-none pointer-events-none rotate-90 md:rotate-0 tracking-widest z-0">TIME</div>
        <div className="absolute left-[2.5rem] md:left-[4rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-cinnabar via-white/10 to-gold opacity-50 z-0" />
        <div className="flex flex-col h-full z-10">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex-1 flex flex-col justify-center pl-14 md:pl-24">
                <div className="absolute left-[2.15rem] md:left-[3.65rem] mt-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-cinnabar shadow-[0_0_15px_#e74c3c] ring-4 ring-black" />
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-cinnabar uppercase tracking-[0.2em] bg-cinnabar/10 px-2 py-1 rounded">The Beginning</span>
                    <span className="text-xs text-gray-500 font-mono tracking-wider">{data.timeline.firstPlay.date}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-snug font-bold">{data.timeline.firstPlay.title}</h3>
                <div className="bg-[#1a252f] p-5 rounded-2xl border-l-2 border-cinnabar shadow-lg max-w-2xl"><p className="text-gray-300 text-sm md:text-base italic leading-relaxed">"{data.timeline.firstPlay.comment}"</p></div>
            </motion.div>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex-1 flex flex-col justify-center pl-14 md:pl-24">
                <div className="absolute left-[2.15rem] md:left-[3.65rem] mt-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gold shadow-[0_0_15px_#f1c40f] ring-4 ring-black" />
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] bg-gold/10 px-2 py-1 rounded">The Finale</span>
                    <span className="text-xs text-gray-500 font-mono tracking-wider">{data.timeline.lastPlay.date}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-snug font-bold">{data.timeline.lastPlay.title}</h3>
                <div className="bg-[#1a252f] p-5 rounded-2xl border-l-2 border-gold shadow-lg max-w-2xl"><p className="text-gray-300 text-sm md:text-base italic leading-relaxed">"{data.timeline.lastPlay.comment}"</p></div>
            </motion.div>
        </div>
        {/* ✅ 添加作者水印 */}
        <AuthorMark />
    </div>
);

// === Slide 3: 时空 ===
export const SlideSpaceTime = ({ data }) => {
    const { habits, cityVisits, monthly_story } = data;
    return (
        <div className="flex flex-col md:flex-row h-full w-full p-8 md:p-12 gap-8 md:gap-16 overflow-hidden bg-[#0b0c10]">
            <div className="flex-[0.35] flex flex-col h-full z-10">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2"><div className="h-[1px] w-8 bg-cinnabar" /><h3 className="text-gray-500 font-serif tracking-[0.6em] text-[10px] uppercase">Space & Rhythm</h3></div>
                    <h2 className="text-white text-xl font-serif font-light opacity-80 pl-11">时空律动</h2>
                </header>
                <div className="space-y-12 pl-11">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
                        <div className="flex items-center gap-2 text-gray-500 mb-3"><Calendar size={12} className="opacity-40" /><span className="text-[10px] uppercase tracking-[0.3em] font-bold">Most Busy Day</span></div>
                        <p className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter leading-none">{habits.busyDay}</p>
                        <p className="text-[10px] text-cinnabar/60 mt-2 font-serif italic">剧场，是每周的固定归宿</p>
                    </motion.div>
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
                        <div className="flex items-center gap-2 text-gray-500 mb-3"><MapPin size={12} className="opacity-40" /><span className="text-[10px] uppercase tracking-[0.3em] font-bold">Top City</span></div>
                        <p className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter leading-none">{habits.favCity}</p>
                        <p className="text-[10px] text-gold/60 mt-2 font-serif italic">这一年，你与这座城市共鸣最深</p>
                    </motion.div>
                </div>
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-auto pt-12 pl-11">
                    <div className="flex items-center gap-2 mb-4 text-gold/80"><Sparkles size={14} /><span className="text-[10px] font-bold uppercase tracking-[0.4em]">Seasonal Mood</span></div>
                    <div className="relative">
                        <div className="absolute -left-5 top-0 bottom-0 flex gap-[2px]"><div className="w-[1px] bg-gradient-to-b from-cinnabar/60 to-transparent" /><div className="w-[1px] bg-gradient-to-b from-white/10 to-transparent" /></div>
                        <p className="text-sm md:text-base text-gray-400 leading-relaxed font-serif italic text-justify">{monthly_story}</p>
                    </div>
                </motion.div>
            </div>
            <div className="flex-[0.6] h-full relative min-h-[400px]">
                <CityMapAnimation cityVisits={cityVisits} />
                <div className="absolute bottom-6 right-6 text-white/5 pointer-events-none select-none"><p className="text-6xl font-black font-serif italic uppercase leading-none">Vagabond</p></div>
            </div>
            {/* ✅ 添加作者水印 */}
            <AuthorMark />
        </div>
    );
};

// === Slide 4: 经济 ===
export const SlideEconomics = ({ data }) => {
    const { life, money } = data.extraStats;
    return (
        <div className="flex flex-col h-full px-6 py-8 justify-between relative overflow-hidden">
             <Coffee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 w-[500px] h-[500px] pointer-events-none rotate-12" />
            <div className="flex-shrink-0 text-center mt-1 z-10">
                <p className="text-gray-500 text-xs uppercase tracking-[0.4em] mb-4">Total Expenditure</p>
                <div className="relative inline-block">
                    <h2 className="text-[5rem] md:text-[8rem] font-black font-serif text-gold drop-shadow-2xl leading-none">
                        <span className="text-4xl align-top mr-2 opacity-50 font-sans font-thin text-white">¥</span>{money.totalCost}
                    </h2>
                </div>
                <p className="text-base text-gray-400 mt-4 font-mono tracking-wide">Peak Month: <span className="text-white font-bold">{money.maxMonth}</span> (¥{money.maxMonthCost})</p>
            </div>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#151921]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 md:p-12 shadow-2xl z-10 flex flex-col justify-between min-h-[45%]">
                <div>
                    <span className="text-xs text-gold border border-gold/30 px-3 py-1 rounded uppercase font-bold tracking-wider mb-4 inline-block">{life.timeframeLabelEn} Consumption</span>
                    <div className="flex items-end gap-3 mb-2"><span className="text-5xl md:text-6xl font-serif text-white leading-none">¥{life.costDisplay}</span><span className="text-xl text-gray-500 mb-1">/ {life.timeframeLabel}</span></div>
                    <p className="text-lg text-gray-300 italic leading-relaxed pl-1 font-serif">{life.description}</p>
                </div>
                <div className="mt-2 space-y-2">
                    <div className="relative bg-black/40 rounded-[2rem] p-6 border border-white/5 overflow-hidden group">
                        <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center relative z-10">
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-3"><div className="p-2 bg-cinnabar/10 rounded-lg"><Flame size={18} className="text-cinnabar animate-pulse" /></div><span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Intake Reduction</span></div>
                                <div className="flex items-baseline gap-1"><span className="text-3xl font-serif font-black text-white">-{life.kcalValue}</span><span className="text-xs text-gray-500 font-sans uppercase">kcal</span></div>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-ink-900 group-hover:border-gold/50 transition-colors duration-500"><ArrowRight size={20} className="text-gray-500 group-hover:text-gold transition-colors" /></div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 mb-3"><span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Running Equivalent</span><div className="p-2 bg-blue-400/10 rounded-lg"><Activity size={18} className="text-blue-400" /></div></div>
                                <div className="flex items-baseline gap-1"><span className="text-3xl font-serif font-black text-white">{life.runDistance}</span><span className="text-xs text-gray-500 font-sans uppercase">km</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="px-2 mt-4 border-l border-gold/20 ml-1">
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed font-serif italic tracking-wider">
                            <span className="block mb-2 opacity-80">剧场的精神食粮为你抵消了物质的沉重。</span>
                            <span className="inline-block">{life.timeframeLabel}节省下的 <span className="text-gray-300 font-sans mx-1 not-italic">{life.kcalValue} kcal</span> 热量，若是化作脚步，足以支撑你在城市中漫跑 <span className="text-gold font-serif font-bold italic mx-1 text-xl drop-shadow-[0_0_8px_rgba(255,215,0,0.2)]">{life.runDistance}</span> 公里。</span>
                        </p>
                    </div>
                </div>
            </motion.div>
            {/* ✅ 添加作者水印 */}
            <AuthorMark />
        </div>
    );
};

// === Slide 5: 关键词 ===
export const SlideKeywords = ({ data }) => (
    <div className="flex flex-col h-full justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none" />
        <h3 className="text-xl font-serif text-center text-gray-500 mb-16 tracking-[0.5em] uppercase z-10">Your Drama DNA</h3>
        <div className="flex flex-wrap items-center justify-center content-center gap-x-8 gap-y-12 z-10">
            {data.stats.keywords.map((word, i) => {
                const isBig = i < 3;
                const fontSize = i === 0 ? 'text-7xl md:text-9xl' : i < 3 ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl';
                const color = i % 2 === 0 ? 'text-white' : 'text-gold';
                const rotate = Math.random() * 10 - 5;
                return (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.1, type: "spring" }} className={`font-serif font-bold ${fontSize} ${color} opacity-90 drop-shadow-2xl cursor-default hover:scale-110 transition-transform duration-300`} style={{ transform: `rotate(${rotate}deg)` }}>
                        {word}
                    </motion.div>
                )
            })}
        </div>
        {/* ✅ 添加作者水印 */}
        <AuthorMark />
    </div>
);

// === Slide 6: 最佳 ===
export const SlidePicks = ({ data }) => (
    <div className="flex flex-col h-full px-6 py-10 gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-gradient-to-br from-ink-900 to-[#050505] p-10 rounded-[2.5rem] border border-white/10 relative shadow-2xl flex flex-col justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent" />
            <div className="mb-6"><span className="bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/30">Yearly Theme</span></div>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">{data.theme_analysis.title}</h3>
            <div className="text-lg md:text-xl text-gray-300 leading-loose text-justify font-sans border-l-4 border-blue-500/30 pl-8">{data.theme_analysis.content}</div>
        </motion.div>
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group cursor-default">
            <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-gold/20 rounded-full"><Trophy size={18} className="text-gold" /></div><p className="text-xs text-gold font-bold uppercase tracking-widest">Highest Rated Play</p></div>
            <div className="flex flex-col xl:flex-row gap-6 xl:items-center">
                <h2 className="text-3xl md:text-5xl font-serif text-white font-bold">{data.picks.top.title}</h2>
                <div className="hidden xl:block w-px h-12 bg-white/20" />
                <div className="flex gap-4"><Quote size={28} className="text-white/20 shrink-0" /><p className="text-lg text-gray-400 italic leading-relaxed">{data.picks.top.reason}</p></div>
            </div>
        </div>
        {/* ✅ 添加作者水印 */}
        <AuthorMark />
    </div>
);

// === Slide 7: 最终页 ===

export const SlideFinal = ({ data, onRegenerate }) => {
    // 生成一些静态的粒子位置，防止重渲染抖动
    const particles = Array.from({ length: 12 });

    return (
        <div className="flex flex-col h-full justify-between items-center text-center px-6 py-12 relative overflow-hidden bg-black selection:bg-gold/30">
            {/* --- 1. 背景层 --- */}
            
            {/* 顶部聚光灯效果 */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-gold/20 via-gold/5 to-transparent blur-[80px] rounded-full pointer-events-none" />
            
            {/* 底部环境光 */}
            <div className="absolute bottom-[-10%] left-0 right-0 h-[300px] bg-gradient-to-t from-gold/10 to-transparent blur-[60px] pointer-events-none" />
            
            {/* 噪点纹理 (可选，增加胶片质感) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

            {/* 悬浮粒子动画 */}
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-gold rounded-full"
                    initial={{ 
                        x: Math.random() * window.innerWidth, 
                        y: Math.random() * window.innerHeight, 
                        opacity: 0,
                        scale: 0 
                    }}
                    animate={{ 
                        y: [null, Math.random() * -100], 
                        opacity: [0, 0.4, 0],
                        scale: [0, Math.random() * 0.5 + 0.2, 0] 
                    }}
                    transition={{ 
                        duration: Math.random() * 3 + 2, 
                        repeat: Infinity, 
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                    }}
                    style={{ width: Math.random() * 4 + 1, height: Math.random() * 4 + 1 }}
                />
            ))}

            {/* --- 2. 装饰性边框 (Frame) --- */}
            <div className="absolute inset-6 border border-white/5 rounded-[2rem] pointer-events-none">
                {/* 四角装饰 */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/40 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/40 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/40 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/40 rounded-br-xl" />
            </div>

            {/* --- 3. 主要内容区域 --- */}
            
            {/* 顶部小标题 */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 pt-10"
            >
                <div className="flex items-center justify-center gap-3 text-gold/60 mb-2">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gold/60" />
                    <Sparkles size={14} className="animate-pulse" />
                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gold/60" />
                </div>
                <p className="text-gray-400 text-xs md:text-sm font-serif tracking-[0.4em] uppercase">
                    The Curtain Call
                </p>
            </motion.div>

            {/* 核心文字展示 */}
            <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl z-10">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }} 
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} 
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} // Custom cubic-bezier for smooth landing
                    className="relative w-full"
                >
                    {/* 文字背后的辉光层 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-gold/10 blur-[100px] rounded-full mix-blend-screen" />
                    
                    {/* 装饰线 (Fade out at ends) */}
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mb-8 opacity-50" />
                    
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff] via-[#ffeebb] to-[#d4af37] drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] leading-[1.1] tracking-tight py-4">
                        {data.userLabel}
                    </h1>

                    {/* 倒影效果 (Reflection) */}
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#d4af37]/20 to-transparent absolute top-full left-0 right-0 scale-y-[-0.5] origin-top opacity-30 blur-sm pointer-events-none select-none" aria-hidden="true">
                        {data.userLabel}
                    </h1>

                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mt-8 opacity-50" />
                </motion.div>
            </div>

            {/* --- 4. 底部操作区 --- */}
            <div className="relative z-10 pb-8 flex flex-col items-center gap-6">
                <motion.button 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 1.2, duration: 0.5 }} 
                    onClick={onRegenerate} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-3 overflow-hidden rounded-full bg-transparent border border-white/20 hover:border-gold/50 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <div className="relative flex items-center gap-3 text-gray-300 group-hover:text-gold transition-colors">
                        <Repeat size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-xs tracking-[0.2em] font-bold uppercase">Regenerate</span>
                    </div>
                </motion.button>
                
                {/* 水印组件 */}
                <div className="opacity-60 hover:opacity-100 transition-opacity">
                    {/* @ts-ignore */}
                    <AuthorMark />
                </div>
            </div>
        </div>
    );
};

// === 新增 Slide: 滚动鸣谢 ===
export const SlideCredits = ({ data, onPrev }) => {
    const [mode, setMode] = useState('input'); // 'input' | 'playing'
    const [specialThanks, setSpecialThanks] = useState([]);
    const [inputValue, setInputValue] = useState('');

    // 直接从瘦身后的数据中读取
    const actorsList = data.credits?.actors || [];
    const venuesList = data.credits?.venues || [];
    
    // 计算总场次用于展示 (累加所有剧院的场次)
    const totalPlaysCount = venuesList.reduce((acc, curr) => acc + curr.count, 0);

    // 处理添加名字
    const handleAdd = () => {
        if (inputValue.trim()) {
            setSpecialThanks([...specialThanks, inputValue.trim()]);
            setInputValue('');
        }
    };

    // 处理开始播放
    const startCredits = () => {
        setMode('playing');
    };

    // 动态计算动画时长
    const totalItems = specialThanks.length + actorsList.length + venuesList.length;
    const duration = 6 + (totalItems * 0.3); 

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-black font-serif">
            {/* --- 输入模式 --- */}
            {mode === 'input' && (
                <div className="flex flex-col h-full px-8 py-10 z-10">
                    <h2 className="text-3xl font-serif text-gold mb-2">2025 戏剧总结</h2>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-8">THEATRE SUMMARY</p>
                    
                    <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        <div className="space-y-6">
                            {/* 输入特别鸣谢 */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <label className="block text-sm text-gray-400 mb-3 font-serif italic">特别鸣谢 (陪你看戏的人、或者是你自己...)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        placeholder="输入名字，回车添加..."
                                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors placeholder:text-gray-600 text-sm"
                                    />
                                    <button onClick={handleAdd} className="bg-white/10 hover:bg-gold hover:text-black text-white p-3 rounded-lg transition-all border border-white/10">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {specialThanks.map((name, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs px-3 py-1 rounded-full border border-gold/20">
                                            {name}
                                            <button onClick={() => setSpecialThanks(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 数据概览 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] uppercase text-gray-500 mb-1">致谢演员</div>
                                    <div className="text-xl font-serif text-white">{actorsList.length} <span className="text-xs text-gray-500 font-sans">位</span></div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] uppercase text-gray-500 mb-1">致谢剧场</div>
                                    <div className="text-xl font-serif text-white">{venuesList.length} <span className="text-xs text-gray-500 font-sans">座</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={startCredits}
                        className="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#ffe066] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                    >
                        <PlayCircle size={18} /> 开始滚动播放
                    </button>
                </div>
            )}

            {/* --- 滚动播放模式 --- */}
            {mode === 'playing' && (
                <div className="absolute inset-0 z-20 bg-black flex justify-center overflow-hidden" onClick={onPrev}>
                    {/* 电影噪点背景 */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-30 pointer-events-none" />

                    <motion.div 
                        initial={{ y: "30vh" }}
                        animate={{ y: "calc(-100% + 50vh)" }} 
                        transition={{ duration: duration, ease: "linear" }}

                        className="w-full max-w-2xl px-8 text-center pb-20 pt-20 h-fit" 
                    >
                        {/* 1. 标题 */}
                        <div className="mb-24">
                            <h1 className="text-gold font-serif text-2xl mb-4 tracking-[0.2em] font-bold">2025 年度观演总结</h1>
                            <div className="h-[1px] w-12 bg-gold/50 mx-auto mb-6" />
                            <p className="text-white/80 font-serif tracking-widest text-xs">
                                共计 {totalPlaysCount} 场美好回忆
                            </p>
                        </div>

                        {/* 2. 特别鸣谢 (用户输入) */}
                        {specialThanks.length > 0 && (
                            <div className="mb-20">
                                <h3 className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mb-8 border-b border-gray-800 pb-2 inline-block">特别感谢</h3>
                                <div className="space-y-4"> 
                                    {specialThanks.map((name, i) => (
                                        <p key={i} className="text-xl font-serif text-white/90 tracking-wide">{name}</p>
                                    ))}

                                </div>
                            </div>
                        )}

                        {/* 3. 演员支持 (特别关注在前，普通在后) */}
                        {actorsList.length > 0 && (
                            <div className="mb-20">
                                <h3 className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mb-8">演员支持</h3>
                                {/* 改为 Grid 网格布局：一行显示 4 个 (grid-cols-4) */}
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2"> 
                                    {actorsList.map((actor, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center">
                                            <p className={`text-sm font-serif tracking-wide ${actor.is_favorite ? 'text-gold font-bold scale-110' : 'text-white/80'}`}>
                                                {actor.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. 场地支持 (按去过的次数排序) */}
                        {venuesList.length > 0 && (
                            <div className="mb-24">
                                <h3 className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mb-8">场地支持</h3>
                                <div className="space-y-6">
                                    {venuesList.map((venue, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <p className="text-lg font-serif text-white">{venue.name}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-1 tracking-widest">
                                                {venue.count} 场
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. 底部 Logo */}
                        <div className="opacity-60 mt-32 pb-10">
                             <Film size={28} className="mx-auto text-gold/40 mb-6" />
                             <p className="text-[10px] text-gray-500 tracking-[0.6em] uppercase mb-2">PRODUCED BY</p>
                             <p className="text-xs text-gold/80 tracking-[0.2em] font-serif">THEATER 2025 REPORT</p>
                        </div>
                    </motion.div>
                    
                    <button className="absolute bottom-8 right-8 text-white/20 text-xs uppercase tracking-widest hover:text-white transition-colors z-40">
                        点击任意处停止
                    </button>
                </div>
            )}
             <AuthorMark />
        </div>
    );
};


// === 错误视图 ===
export const ErrorView = ({ onRegenerate, onClose }) => (
  <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="relative w-full max-w-md p-10 mx-4 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] text-center overflow-hidden z-50 group">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cinnabar/10 rounded-full blur-[80px] pointer-events-none" />
    <div className="relative mx-auto w-24 h-24 mb-8">
        <div className="absolute inset-0 border border-red-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-2 border border-dashed border-red-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center text-red-500/80 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"><AlertTriangle size={36} strokeWidth={1.5} /></div>
    </div>
    <h2 className="text-2xl font-serif font-bold text-white mb-4 tracking-wider">演出暂时中断</h2>
    <div className="space-y-4 mb-10"><p className="text-gray-400 text-sm leading-loose font-serif">我们的 AI 编剧在梳理您精彩的年度剧目时，<br/>陷入了深深的思考，笔触暂时停滞了。</p><p className="text-gray-500 text-xs tracking-widest uppercase opacity-60">SCRIPT GENERATION INTERRUPTED</p></div>
    <div className="flex flex-col gap-4 relative z-10">
      <button onClick={() => { onClose(); setTimeout(onRegenerate, 300); }} className="w-full py-3.5 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white/90 rounded-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg border border-white/5 hover:border-red-500/30 hover:shadow-red-900/20 hover:scale-[1.02]"><RefreshCcw size={16} /><span>重新拉开帷幕</span></button>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs transition-colors py-2">先休息片刻，稍后再试</button>
    </div>
    {/* ✅ 添加作者水印 */}
    <AuthorMark />
  </motion.div>
);

