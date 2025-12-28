import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 引入你目录结构中的坐标文件
import { CHINA_CITIES_COORDINATES } from '../constants/cityCoordinates'; 
import { X, ChevronRight, ChevronLeft, Quote, Sparkles, MapPin, Calendar, Trophy, Clock, Repeat, Flame, Coffee, Activity, ArrowRight, AlertTriangle, RefreshCcw } from 'lucide-react';
import mapData from '../assets/china.json'

// ==========================================
// 地图投影配置 (核心算法)
// ==========================================
const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 600;

// 中国地图的大致经纬度边界 (用于将经纬度转换为SVG坐标)
const MIN_LNG = 73.33;  
const MAX_LNG = 135.05;
const MIN_LAT = 18.15;  
const MAX_LAT = 53.55;

// 投影函数：将经纬度 [lng, lat] 转换为 SVG [x, y]
const project = ([lng, lat]) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * VIEWBOX_WIDTH;
    //纬度在SVG中是反的（Y轴向下增加），所以用 1 - ...
    const y = VIEWBOX_HEIGHT - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * VIEWBOX_HEIGHT;
    return { x, y };
};

// ==========================================
// 组件：足迹地图动画 (基于真实 GeoJSON)
// ==========================================
const CityMapAnimation = ({ cityVisits }) => {
    // 1. 地图背景数据 (保持原有逻辑，存JSX虽不是最佳实践但在静态数据下可接受)
    const mapPath = useMemo(() => {
        const paths = [];
        // 直接使用 mapData，不需要 fetch
        mapData.features.forEach((feature, index) => {
            const geometry = feature.geometry;
            const drawPolygon = (rings) => {
                let d = "";
                rings.forEach((ring) => {
                    ring.forEach((point, j) => {
                        const { x, y } = project(point);
                        if (j === 0) d += `M${x},${y}`;
                        else d += `L${x},${y}`;
                    });
                    d += "Z ";
                });
                return d;
            };
            if (geometry.type === "Polygon") {
                paths.push(<path key={`p-${index}`} d={drawPolygon(geometry.coordinates)} className="fill-white/5 stroke-white/10" strokeWidth="0.5" />);
            } else if (geometry.type === "MultiPolygon") {
                geometry.coordinates.forEach((polygon, i) => {
                    paths.push(<path key={`mp-${index}-${i}`} d={drawPolygon(polygon)} className="fill-white/5 stroke-white/10" strokeWidth="0.5" />);
                });
            }
        });
        return paths;
    }, []); // 空依赖数组，只计算一次

    // 2. 逻辑处理：计算坐标点 (保持不变)
    const { uniquePath, cityCount, viewBox } = useMemo(() => {
        if (!cityVisits || cityVisits.length === 0) {
            return { uniquePath: [], cityCount: 0, viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` };
        }

        const validVisits = cityVisits.map(visit => {
            let coords = CHINA_CITIES_COORDINATES[visit.city] || 
                         CHINA_CITIES_COORDINATES[visit.city.replace('市', '')];
            if (!coords) {
                const key = Object.keys(CHINA_CITIES_COORDINATES).find(k => visit.city.includes(k));
                if (key) coords = CHINA_CITIES_COORDINATES[key];
            }
            return coords ? { city: visit.city.replace('市', ''), ...project(coords) } : null;
        }).filter(Boolean);

        const cityCount = new Set(validVisits.map(v => v.city)).size;

        const path = [];
        if (validVisits.length > 0) {
            path.push(validVisits[0]);
            for (let i = 1; i < validVisits.length; i++) {
                if (validVisits[i].city !== validVisits[i - 1].city) path.push(validVisits[i]);
            }
        }

        // 视口计算
        const xs = validVisits.map(p => p.x);
        const ys = validVisits.map(p => p.y);
        if (xs.length === 0) return { uniquePath: [], cityCount: 0, viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` };

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 60;
        const finalW = Math.max(width + padding * 2, 200);
        const finalH = Math.max(height + padding * 2, 200);
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        return { uniquePath: path, cityCount, viewBox: `${centerX - finalW / 2} ${centerY - finalH / 2} ${finalW} ${finalH}` };
    }, [cityVisits]);

    // 3. 动画逻辑 (修改部分：不再存JSX，而是存进度索引)
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        if (uniquePath.length < 2) return;
        
        // 重置进度
        setVisibleCount(0);

        let currentStep = 0;
        const timer = setInterval(() => {
            if (currentStep >= uniquePath.length - 1) {
                clearInterval(timer);
                return;
            }
            currentStep += 1;
            setVisibleCount(currentStep);
        }, 800);

        return () => clearInterval(timer);
    }, [uniquePath]);

    return (
        <div className="w-full h-full bg-[#151921]/50 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-4 left-6 z-20">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                    Travel Footprint • {cityCount} Cities
                </div>
            </div>

            <svg viewBox={viewBox} className="w-full h-full transition-all duration-1000 ease-in-out">
                {/* 地图背景 */}
                <g className="opacity-40">{mapPath}</g>
                
                {/* 动态路径 - 实时渲染 */}
                {/* 移除了 AnimatePresence，因为它在 strict mode 下导致了 key 冲突 */}
                <g>
                    {uniquePath.map((start, i) => {
                        // 如果没有下一个点，或者是尚未展示的路径，则不渲染
                        if (i >= uniquePath.length - 1 || i >= visibleCount) return null;
                        
                        const end = uniquePath[i + 1];
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2 - 20;
                        
                        // 使用带前缀的唯一 Key
                        return (
                            <motion.path 
                                key={`trip-path-${i}`} 
                                d={`M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}`}
                                stroke="#f1c40f" 
                                strokeWidth="1.5" 
                                fill="none" 
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }} 
                                transition={{ duration: 1 }} 
                            />
                        );
                    })}
                </g>

                {/* 城市点和名称标注 */}
                {uniquePath.map((p, i) => (
                    <g key={`city-point-${i}`}> {/* 增加前缀以确保唯一性 */}
                        <circle cx={p.x} cy={p.y} r={2} fill="#fff" />
                        <motion.text
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.8 }}
                            x={p.x + 5} y={p.y - 5}
                            fill="rgba(255,255,255,0.6)"
                            className="text-[10px] font-serif pointer-events-none"
                        >
                            {p.city}
                        </motion.text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

// ==========================================
// 1. 幻灯片子组件 (针对大屏优化的豪华版)
// ==========================================

// === Slide 1: 概览 (Overview) ===
const SlideOverview = ({ data }) => (
    <div className="flex flex-col h-full px-6 py-8 relative overflow-hidden">
        {/* 背景装饰：巨大的模糊光斑，解决空旷感 */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-gold/10 rounded-full blur-[80px] pointer-events-none" />

        {/* 顶部 Quote */}
        <div className="flex-shrink-0 flex justify-center mb-4 z-10">
             <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                className="bg-white/5 px-6 py-3 rounded-full text-sm md:text-base text-gold border border-gold/30 italic text-center shadow-[0_0_20px_rgba(255,215,0,0.15)] backdrop-blur-md"
            >
                "{data.summary_text}"
            </motion.div>
        </div>

        {/* 核心标题：撑满中间 */}
        <div className="flex-1 flex flex-col justify-center items-center text-center z-10 my-4">
            <p className="text-gray-500 font-serif tracking-[0.5em] text-xs md:text-sm mb-4 uppercase">The Year of Drama</p>
            <motion.h1 
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                className="text-[6rem] md:text-[9rem] lg:text-[11rem] font-black font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 leading-none drop-shadow-2xl"
            >
                2025
            </motion.h1>
        </div>

        {/* 底部数据卡片：加宽、加高 */}
        <div className="flex-shrink-0 w-full bg-white/5 rounded-[2rem] p-6 md:p-8 border border-white/10 backdrop-blur-md relative overflow-hidden z-10">
            <div className="grid grid-cols-2 gap-8 items-center">
                <div className="text-left">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-2 tracking-wider">
                        <Clock size={14} /> Total Duration
                    </div>
                    <p className="text-5xl md:text-7xl font-serif text-white tracking-tighter">
                        {data.extraStats.time.totalHours}<span className="text-2xl text-gray-500 font-sans font-normal ml-1">h</span>
                    </p>
                </div>
                <div className="text-left border-l border-white/10 pl-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-2 tracking-wider">
                        <Activity size={14} /> Equivalent To
                    </div>
                    <p className="text-lg md:text-xl font-serif text-gold leading-tight">
                        {data.extraStats.time.activityName}
                    </p>
                    <p className="text-3xl md:text-4xl font-serif text-white mt-1">
                        × {data.extraStats.time.activityCount}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// === Slide 2: 时间线 (Timeline) ===
const SlideTimeline = ({ data }) => (
    <div className="flex flex-col h-full px-6 md:px-12 py-8 relative overflow-hidden">
        {/* 背景装饰：TIME 文字调整为竖排或淡化，避免干扰视线 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8rem] md:text-[12rem] font-serif text-white/5 font-black select-none pointer-events-none rotate-90 md:rotate-0 tracking-widest z-0">
            TIME
        </div>

        {/* 左侧连接线 - 贯穿上下 */}
        <div className="absolute left-[2.5rem] md:left-[4rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-cinnabar via-white/10 to-gold opacity-50 z-0" />

        {/* 内容容器：使用 flex-col 均匀分布上下两部分 */}
        <div className="flex flex-col h-full z-10">
            
            {/* 上半部分：The Beginning */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="flex-1 flex flex-col justify-center pl-14 md:pl-24" // 增加左内边距，给时间轴留位
            >
                {/* 节点装饰 */}
                <div className="absolute left-[2.15rem] md:left-[3.65rem] mt-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-cinnabar shadow-[0_0_15px_#e74c3c] ring-4 ring-black" />
                
                {/* 标签行 */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-cinnabar uppercase tracking-[0.2em] bg-cinnabar/10 px-2 py-1 rounded">The Beginning</span>
                    <span className="text-xs text-gray-500 font-mono tracking-wider">{data.timeline.firstPlay.date}</span>
                </div>

                {/* 标题：字号适中，增加行高，防止长标题拥挤 */}
                <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-snug font-bold">
                    {data.timeline.firstPlay.title}
                </h3>

                {/* 评论卡片 */}
                <div className="bg-[#1a252f] p-5 rounded-2xl border-l-2 border-cinnabar shadow-lg max-w-2xl">
                    <p className="text-gray-300 text-sm md:text-base italic leading-relaxed">
                        "{data.timeline.firstPlay.comment}"
                    </p>
                </div>
            </motion.div>

            {/* 下半部分：The Finale */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.5 }}
                className="flex-1 flex flex-col justify-center pl-14 md:pl-24"
            >
                {/* 节点装饰 */}
                <div className="absolute left-[2.15rem] md:left-[3.65rem] mt-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gold shadow-[0_0_15px_#f1c40f] ring-4 ring-black" />
                
                {/* 标签行 */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] bg-gold/10 px-2 py-1 rounded">The Finale</span>
                    <span className="text-xs text-gray-500 font-mono tracking-wider">{data.timeline.lastPlay.date}</span>
                </div>

                {/* 标题：同上，长标题会自动换行但保持美观 */}
                <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-snug font-bold">
                    {data.timeline.lastPlay.title}
                </h3>

                {/* 评论卡片 */}
                <div className="bg-[#1a252f] p-5 rounded-2xl border-l-2 border-gold shadow-lg max-w-2xl">
                    <p className="text-gray-300 text-sm md:text-base italic leading-relaxed">
                        "{data.timeline.lastPlay.comment}"
                    </p>
                </div>
            </motion.div>
        </div>
    </div>
);

// === Slide 3: 时空 (SpaceTime) ===
const SlideSpaceTime = ({ data }) => {
    const { habits, cityVisits, monthly_story } = data;

    return (
        <div className="flex flex-col md:flex-row h-full w-full p-8 md:p-12 gap-8 md:gap-16 overflow-hidden bg-[#0b0c10]">
            
            {/* 左侧：叙述性排版 (占 35%) */}
            <div className="flex-[0.35] flex flex-col h-full z-10">
                
                {/* 1. 顶部标题栏：更精致的装饰 */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-cinnabar" />
                        <h3 className="text-gray-500 font-serif tracking-[0.6em] text-[10px] uppercase">
                            Space & Rhythm
                        </h3>
                    </div>
                    <h2 className="text-white text-xl font-serif font-light opacity-80 pl-11">时空律动</h2>
                </header>

                {/* 2. 核心统计区：采用纵向列表排版，增加间距和视觉引导 */}
                <div className="space-y-12 pl-11">
                    {/* Busy Day */}
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-2 text-gray-500 mb-3">
                            <Calendar size={12} className="opacity-40" />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Most Busy Day</span>
                        </div>
                        <p className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter leading-none">
                            {habits.busyDay}
                        </p>
                        {/* 装饰性小字 */}
                        <p className="text-[10px] text-cinnabar/60 mt-2 font-serif italic">剧场，是每周的固定归宿</p>
                    </motion.div>

                    {/* Top City */}
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-2 text-gray-500 mb-3">
                            <MapPin size={12} className="opacity-40" />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Top City</span>
                        </div>
                        <p className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter leading-none">
                            {habits.favCity}
                        </p>
                        <p className="text-[10px] text-gold/60 mt-2 font-serif italic">这一年，你与这座城市共鸣最深</p>
                    </motion.div>
                </div>

                {/* 3. 底部：心情描述，采用“引文”式排版 */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 0.5 }}
                    className="mt-auto pt-12 pl-11"
                >
                    <div className="flex items-center gap-2 mb-4 text-gold/80">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Seasonal Mood</span>
                    </div>
                    
                    <div className="relative">
                        {/* 优雅的侧边双线条 */}
                        <div className="absolute -left-5 top-0 bottom-0 flex gap-[2px]">
                            <div className="w-[1px] bg-gradient-to-b from-cinnabar/60 to-transparent" />
                            <div className="w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
                        </div>
                        
                        <p className="text-sm md:text-base text-gray-400 leading-relaxed font-serif italic text-justify">
                            {monthly_story}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* 右侧：聚焦地图 (60%) */}
            <div className="flex-[0.6] h-full relative min-h-[400px]">
                <CityMapAnimation cityVisits={cityVisits} />
                
                {/* 右下角装饰性文字 */}
                <div className="absolute bottom-6 right-6 text-white/5 pointer-events-none select-none">
                    <p className="text-6xl font-black font-serif italic uppercase leading-none">Vagabond</p>
                </div>
            </div>
        </div>
    );
};

// === Slide 4: 经济 (Economics) ===
const SlideEconomics = ({ data }) => {
    const { life, money } = data.extraStats;
    
    return (
        <div className="flex flex-col h-full px-6 py-8 justify-between relative overflow-hidden">
             {/* 巨大的背景装饰 - 可以考虑根据类型变淡或变化 */}
             <Coffee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 w-[500px] h-[500px] pointer-events-none rotate-12" />

            <div className="flex-shrink-0 text-center mt-1 z-10">
                <p className="text-gray-500 text-xs uppercase tracking-[0.4em] mb-4">Total Expenditure</p>
                <div className="relative inline-block">
                    <h2 className="text-[5rem] md:text-[8rem] font-black font-serif text-gold drop-shadow-2xl leading-none">
                        <span className="text-4xl align-top mr-2 opacity-50 font-sans font-thin text-white">¥</span>{money.totalCost}
                    </h2>
                </div>
                <p className="text-base text-gray-400 mt-4 font-mono tracking-wide">
                    Peak Month: <span className="text-white font-bold">{money.maxMonth}</span> (¥{money.maxMonthCost})
                </p>
            </div>

            <motion.div 
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-[#151921]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 md:p-12 shadow-2xl z-10 flex flex-col justify-between min-h-[45%]"
            >
                <div>
                    {/* 修改1：标签改为动态，显示当前的统计跨度 */}
                    <span className="text-xs text-gold border border-gold/30 px-3 py-1 rounded uppercase font-bold tracking-wider mb-4 inline-block">
                        {life.timeframeLabelEn} Consumption
                    </span>
                    
                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-5xl md:text-6xl font-serif text-white leading-none">¥{life.costDisplay}</span>
                        <span className="text-xl text-gray-500 mb-1">/ {life.timeframeLabel}</span>
                    </div>
                    
                    {/* 修改2：调大行高，因为 description 现在可能包含“折合每月”的两段式文案 */}
                    <p className="text-lg text-gray-300 italic leading-relaxed pl-1 font-serif">
                        {life.description}
                    </p>
                </div>

                {/* 底部能量转化看板 */}
                <div className="mt-2 space-y-2">

                    {/* 视觉转化卡片 */}
                    <div className="relative bg-black/40 rounded-[2rem] p-6 border border-white/5 overflow-hidden group">
                        {/* 装饰线条 - 连接两端 */}
                        <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center relative z-10">
                            {/* 左侧：摄入减少 */}
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-cinnabar/10 rounded-lg">
                                        <Flame size={18} className="text-cinnabar animate-pulse" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Intake Reduction</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-serif font-black text-white">-{life.kcalValue}</span>
                                    <span className="text-xs text-gray-500 font-sans uppercase">kcal</span>
                                </div>
                            </div>
                            
                            {/* 中间转换图标 */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-ink-900 group-hover:border-gold/50 transition-colors duration-500">
                                    <ArrowRight size={20} className="text-gray-500 group-hover:text-gold transition-colors" />
                                </div>
                            </div>
                            
                            {/* 右侧：等效运动 */}
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Running Equivalent</span>
                                    <div className="p-2 bg-blue-400/10 rounded-lg">
                                        <Activity size={18} className="text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-serif font-black text-white">{life.runDistance}</span>
                                    <span className="text-xs text-gray-500 font-sans uppercase">km</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 叙述文字 - 增加感性的文字联系 */}
                    <div className="px-2 mt-4 border-l border-gold/20 ml-1">
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed font-serif italic tracking-wider">
                            {/* 第一行：哲学感叙述，独立成行 */}
                            <span className="block mb-2 opacity-80">
                                剧场的精神食粮为你抵消了物质的沉重。
                            </span>
                            
                            {/* 第二、三行合并：解释性叙述，保持连贯 */}
                            <span className="inline-block">
                                {life.timeframeLabel}节省下的 
                                <span className="text-gray-300 font-sans mx-1 not-italic">{life.kcalValue} kcal</span> 
                                热量，若是化作脚步，足以支撑你在城市中漫跑 
                                <span className="text-gold font-serif font-bold italic mx-1 text-xl drop-shadow-[0_0_8px_rgba(255,215,0,0.2)]">
                                    {life.runDistance}
                                </span> 
                                公里。
                            </span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// === Slide 5: 关键词 (Keywords) ===
const SlideKeywords = ({ data }) => (
    <div className="flex flex-col h-full justify-center px-6 relative overflow-hidden">
        {/* 背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none" />
        
        <h3 className="text-xl font-serif text-center text-gray-500 mb-16 tracking-[0.5em] uppercase z-10">Your Drama DNA</h3>
        
        <div className="flex flex-wrap items-center justify-center content-center gap-x-8 gap-y-12 z-10">
            {data.stats.keywords.map((word, i) => {
                const isBig = i < 3;
                const fontSize = i === 0 ? 'text-7xl md:text-9xl' : i < 3 ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl';
                const color = i % 2 === 0 ? 'text-white' : 'text-gold';
                const rotate = Math.random() * 10 - 5; // 随机轻微旋转
                
                return (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                        className={`font-serif font-bold ${fontSize} ${color} opacity-90 drop-shadow-2xl cursor-default hover:scale-110 transition-transform duration-300`}
                        style={{ transform: `rotate(${rotate}deg)` }}
                    >
                        {word}
                    </motion.div>
                )
            })}
        </div>
    </div>
);

// === Slide 6: 主题与最佳 (Picks) ===
const SlidePicks = ({ data }) => (
    <div className="flex flex-col h-full px-6 py-10 gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        {/* 上部分：年度主题 (加大权重) */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-gradient-to-br from-ink-900 to-[#050505] p-10 rounded-[2.5rem] border border-white/10 relative shadow-2xl flex flex-col justify-center overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent" />
            <div className="mb-6">
                <span className="bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/30">
                    Yearly Theme
                </span>
            </div>
            
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">{data.theme_analysis.title}</h3>
            <div className="text-lg md:text-xl text-gray-300 leading-loose text-justify font-sans border-l-4 border-blue-500/30 pl-8">
                {data.theme_analysis.content}
            </div>
        </motion.div>

        {/* 下部分：最佳剧目 */}
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group cursor-default">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gold/20 rounded-full"><Trophy size={18} className="text-gold" /></div>
                <p className="text-xs text-gold font-bold uppercase tracking-widest">Highest Rated Play</p>
            </div>
            
            <div className="flex flex-col xl:flex-row gap-6 xl:items-center">
                <h2 className="text-3xl md:text-5xl font-serif text-white font-bold">{data.picks.top.title}</h2>
                <div className="hidden xl:block w-px h-12 bg-white/20" />
                <div className="flex gap-4">
                    <Quote size={28} className="text-white/20 shrink-0" />
                    <p className="text-lg text-gray-400 italic leading-relaxed">
                        {data.picks.top.reason}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// === Slide 7: 最终页 (Final) ===
const SlideFinal = ({ data, onRegenerate }) => (
    <div className="flex flex-col h-full justify-center items-center text-center px-6 relative overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-black to-black animate-pulse" />
        
        <p className="text-gray-500 text-sm mb-16 font-serif tracking-[0.5em] uppercase z-10">The Curtain Call</p>
        
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10 mb-20">
            <div className="absolute inset-0 bg-gold blur-[120px] opacity-20" />
            <div className="border-y-2 border-gold/40 py-16 px-10 bg-black/40 backdrop-blur-xl">
                <h1 className="text-7xl md:text-9xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff0c4] to-[#cba326] drop-shadow-lg leading-tight">
                    {data.userLabel}
                </h1>
            </div>
        </motion.div>

        <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={onRegenerate}
            className="group relative z-10 flex items-center gap-3 px-10 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-gold hover:border-gold hover:text-black transition-all duration-300 text-gray-400 text-sm tracking-widest uppercase font-bold"
        >
            <Repeat size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Regenerate Report</span>
        </motion.button>
    </div>
);
// ==========================================

// 3. 错误视图组件
// === 在这里插入 ErrorView 组件 ===
const ErrorView = ({ onRegenerate, onClose }) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.9, opacity: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="relative w-full max-w-md p-10 mx-4 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] text-center overflow-hidden z-50 group"
  >
    {/* 氛围背景装饰 */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cinnabar/10 rounded-full blur-[80px] pointer-events-none" />

    {/* 动态图标 */}
    <div className="relative mx-auto w-24 h-24 mb-8">
        <div className="absolute inset-0 border border-red-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-2 border border-dashed border-red-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center text-red-500/80 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
            <AlertTriangle size={36} strokeWidth={1.5} />
        </div>
    </div>

    {/* 文案 */}
    <h2 className="text-2xl font-serif font-bold text-white mb-4 tracking-wider">
      演出暂时中断
    </h2>
    
    <div className="space-y-4 mb-10">
        <p className="text-gray-400 text-sm leading-loose font-serif">
          我们的 AI 编剧在梳理您精彩的年度剧目时，<br/>
          陷入了深深的思考，笔触暂时停滞了。
        </p>
        <p className="text-gray-500 text-xs tracking-widest uppercase opacity-60">
          SCRIPT GENERATION INTERRUPTED
        </p>
    </div>

    {/* 按钮组 */}
    <div className="flex flex-col gap-4 relative z-10">
      <button 
        onClick={() => {
            onClose(); 
            setTimeout(onRegenerate, 300); 
        }}
        className="w-full py-3.5 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white/90 rounded-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg border border-white/5 hover:border-red-500/30 hover:shadow-red-900/20 hover:scale-[1.02]"
      >
        <RefreshCcw size={16} />
        <span>重新拉开帷幕</span>
      </button>

      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-300 text-xs transition-colors py-2"
      >
        先休息片刻，稍后再试
      </button>
    </div>
  </motion.div>
);


// ==========================================
// 2. 主组件 (包含信封、信件、大屏逻辑)
// ==========================================
export default function AnnualReport({ isOpen, onClose, data, onRegenerate }) {
  // 状态管理
  const [viewState, setViewState] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // === 核心逻辑修改：根据数据状态决定路由 ===
  React.useEffect(() => {
    if (isOpen && data) {
      if (data.isError) {
        // 🔥 如果是错误数据，直接进入错误页，跳过信封
        setViewState('error');
      } else {
        // ✅ 如果是正常数据，进入信封流程
        setViewState('envelope');
        setCurrentSlide(0);
      }
    } else {
      // 关闭时重置
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
  ];

  if (!isOpen || !data) return null;

  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 overflow-hidden"
    >
        {/* 关闭按钮 */}
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white z-50 p-2 transition-colors">
            <X size={32} />
        </button>

        <AnimatePresence mode="wait">
            
            {/* === 新增：场景 0 - 错误提示页 === */}
            {viewState === 'error' && (
                <ErrorView key="error" onRegenerate={onRegenerate} onClose={onClose} />
            )}
            
            {/* === 场景 1：信封阶段 (仅在无错误时显示) === */}
            {viewState === 'envelope' && !data.isError && (
                <motion.div 
                    key="envelope"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                    className="relative cursor-pointer group flex flex-col items-center justify-center h-full w-full"
                    onClick={() => setViewState('letter')}
                >
                    <div className="relative">
                        {/* 信封本体 */}
                        <div className="w-[360px] h-[240px] md:w-[600px] md:h-[400px] bg-[#e8dcc5] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:rotate-1 group-hover:scale-105 group-hover:shadow-[0_35px_60px_-15px_rgba(192,57,43,0.4)]">
                            {/* 纸张纹理 */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply" />
                            
                            {/* 边框装饰 */}
                            <div className="absolute top-3 left-3 right-3 bottom-3 border-4 border-double border-[#d4c5a5] pointer-events-none" />
                            
                            {/* 邮戳 */}
                            <div className="absolute top-8 right-8 w-24 h-24 md:w-32 md:h-32 border-4 border-cinnabar/40 rounded-full flex items-center justify-center rotate-[-12deg] opacity-70 mix-blend-multiply">
                                <div className="text-xs md:text-sm text-cinnabar font-mono text-center font-bold leading-tight">
                                    THEATER<br/>ANNUAL REPORT<br/>2025
                                </div>
                            </div>
                            
                            {/* 蜡封 */}
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-cinnabar to-red-900 rounded-full shadow-lg flex items-center justify-center border-4 border-[#e8dcc5] relative z-20 group-hover:scale-110 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-full border border-white/20" />
                                <Sparkles className="text-gold animate-pulse" size={40} />
                            </div>

                            <div className="absolute bottom-8 font-serif text-[#1a252f]/60 tracking-[0.4em] text-xs md:text-sm font-bold group-hover:text-cinnabar transition-colors">
                                TAP TO OPEN
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* === 场景 2：信件阶段 === */}
            {viewState === 'letter' && !data.isError && (
                <motion.div 
                    key="letter"
                    initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0, transition: { duration: 0.5 } }}
                    className="relative w-full max-w-2xl md:max-w-4xl mx-4"
                >
                    <div className="bg-[#fcf5e5] text-ink-900 p-10 md:p-16 rounded shadow-2xl relative font-serif overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#c0392b,#c0392b_10px,#fcf5e5_10px,#fcf5e5_20px,#1a252f_20px,#1a252f_30px,#fcf5e5_30px,#fcf5e5_40px)]" />
                        
                        <div className="mb-8 mt-4 flex justify-between items-end border-b border-ink-900/10 pb-6">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-ink-900">Dear Audience,</h2>
                        </div>
                        
                        <div className="prose prose-lg prose-p:text-ink-800 prose-p:leading-loose text-justify max-h-[60vh] overflow-y-auto custom-scrollbar pr-4 mb-10">
                            <div className="font-serif">
                                {data.letter && data.letter.replace(/\\n/g, '\n').split(/\n+/).map((para, i) => (
                                    para.trim() && (
                                        <p key={i} className="mb-6 indent-8 text-ink-900/90 leading-loose">
                                            {para}
                                        </p>
                                    )
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
                             <button onClick={onRegenerate} className="flex items-center gap-2 text-sm text-gray-400 hover:text-cinnabar transition-colors group">
                                <Repeat size={14} className="group-hover:rotate-180 transition-transform" /> Rewrite
                            </button>
                            <button 
                                onClick={() => setViewState('slides')}
                                className="bg-ink-900 text-[#fcf5e5] px-10 py-4 rounded-full flex items-center gap-3 hover:bg-cinnabar hover:shadow-xl transition-all text-lg font-bold"
                            >
                                <span>Start The Show</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* === 场景 3：幻灯片阶段 === */}
            {viewState === 'slides' && !data.isError && (
                <motion.div 
                    key="slides"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                >
                    <div className="w-[92vw] max-w-lg md:max-w-5xl h-[85vh] bg-[#0b0c10] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                        
                        {/* 顶部进度条 */}
                        <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-30">
                             {slides.map((_, i) => (
                                 <div key={i} className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                                     <motion.div 
                                         initial={{ width: 0 }} 
                                         animate={{ width: i <= currentSlide ? '100%' : '0%' }}
                                         className={`h-full ${i === currentSlide ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/30'}`}
                                     />
                                 </div>
                             ))}
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 w-full relative">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={currentSlide}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full w-full"
                                >
                                    {React.createElement(slides[currentSlide].component, { 
                                        data, 
                                        onRegenerate: () => { 
                                            onClose(); 
                                            setTimeout(onRegenerate, 300); 
                                        } 
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="absolute bottom-6 md:bottom-10 flex gap-6 md:gap-12 z-50">
                        <button 
                            disabled={currentSlide === 0}
                            onClick={() => setCurrentSlide(c => c - 1)}
                            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/50 border border-white/10 hover:bg-white/20 disabled:opacity-0 transition-all text-white backdrop-blur-md"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            disabled={currentSlide === slides.length - 1}
                            onClick={() => setCurrentSlide(c => c + 1)}
                            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-cinnabar hover:bg-red-600 shadow-[0_0_20px_#e74c3c] disabled:opacity-0 transition-all text-white scale-110"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
    </motion.div>
  );
}