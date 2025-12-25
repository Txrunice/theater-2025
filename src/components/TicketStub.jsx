import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Armchair, Ticket, Quote } from 'lucide-react';
import DefaultPoster from './DefaultPoster';
import { ReadOnlyStars } from './RatingComponents'; // 引入刚才创建的组件

export default function TicketStub({ data, onEdit }) {
  const price = data.price || '0';
  const seatInfo = data.seat_info || data.seat || '---';

  // === 1. 计算显示评分 (支持折子戏平均分) ===
  const displayRating = useMemo(() => {
    const subItems = data.sub_plots || data.items || data.cast_list; 
    
    // 如果有子项且子项有评分，计算平均分
    if (Array.isArray(subItems) && subItems.length > 0) {
      const ratedItems = subItems.filter(item => item.rating > 0);
      if (ratedItems.length > 0) {
        const total = ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0);
        return total / ratedItems.length;
      }
    }
    // 否则使用主评分
    return Number(data.rating) || 0;
  }, [data]);

  // === 2. 标题格式化逻辑 ===
  let displayTitle = data.title;
  // 如果是折子戏（通过分类判断），且标题里包含分隔符，才特殊显示
  // 这里使用了更严格的正则，确保只在需要的时候格式化
  if ((data.category === '折子戏' || data.type === '折子戏') && /[+＋]/.test(data.title)) {
    const parts = data.title.split(/\s*[+＋]\s*/).filter(Boolean);
    displayTitle = `折子戏：${parts.map(p => `《${p}》`).join('')}`;
  }

  return (
    <motion.div 
      layout 
      initial={{ x: -20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }}
      whileHover={{ scale: 1.01, x: 5 }}
      className="group relative w-full max-w-5xl mx-auto h-52 bg-[#141414] border border-white/15 rounded-xl overflow-hidden shadow-xl mb-6 cursor-pointer flex transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:border-white/30"
      onClick={() => onEdit(data)}
    >
      
      {/* 左侧存根区域 */}
      <div className="w-16 md:w-20 bg-[#18181b] border-r-2 border-dashed border-white/15 flex flex-col items-center justify-between py-6 relative z-20 shrink-0 select-none">
         <div className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase whitespace-nowrap -rotate-90 origin-center translate-y-2">
            ADMIT ONE
         </div>
         
         <div className="flex flex-col gap-[3px] w-full px-4 opacity-20">
            {[...Array(12)].map((_,i) => (<div key={i} className="bg-white h-[1px] w-full"></div>))}
         </div>

         <div className="text-[10px] font-mono text-zinc-600 font-bold tracking-[0.2em] uppercase whitespace-nowrap -rotate-90 origin-center -translate-y-2">
            THEATER
         </div>
      </div>

      {/* 票根上下缺口 */}
      <div className="absolute left-[3.5rem] md:left-[4.5rem] top-[-8px] w-5 h-5 bg-[#0b0c10] rounded-full z-30 border-b border-white/15 shadow-inner"></div>
      <div className="absolute left-[3.5rem] md:left-[4.5rem] bottom-[-8px] w-5 h-5 bg-[#0b0c10] rounded-full z-30 border-t border-white/15 shadow-inner"></div>

      {/* 中间主要信息区域 */}
      <div className="flex-1 relative flex flex-col justify-between p-6 z-10 overflow-hidden">
         <div className="absolute right-20 top-[-20px] opacity-[0.03] pointer-events-none rotate-12 text-white"><Ticket size={200} /></div>

         {/* --- 上部分：标题与价格 --- */}
         <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 relative z-10 max-w-[75%]">
               <div className="flex items-center gap-3">
                  <span className="bg-zinc-900 text-zinc-300 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase shadow-sm">
                    {data.category}
                  </span>
                  {/* 使用新的星星组件 */}
                  <div className="flex items-center gap-2">
                    <ReadOnlyStars rating={displayRating} size={10} />
                    <span className="text-[10px] text-zinc-500 font-mono pt-0.5">
                        {displayRating > 0 ? displayRating.toFixed(1) : ''}
                    </span>
                  </div>
               </div>
               
               <h3 
                  className="text-2xl md:text-3xl font-black font-serif text-white tracking-wide leading-tight group-hover:text-[#d4af37] transition-colors pr-4 drop-shadow-md line-clamp-2"
                  title={displayTitle}
               >
                  {displayTitle}
               </h3>
            </div>

            <div className="border border-[#d4af37]/40 bg-[#d4af37]/5 rounded-lg px-3 py-1 flex flex-col items-center justify-center -rotate-6 opacity-80 group-hover:opacity-100 group-hover:rotate-0 transition-all shrink-0">
               <span className="text-[10px] text-[#d4af37]/80 uppercase tracking-widest">PRICE</span>
               <span className="text-xl font-serif font-bold text-[#d4af37] italic"><span className="text-sm mr-0.5">¥</span>{price}</span>
            </div>
         </div>

         {/* --- 下部分：日期、地点、座位 --- */}
         <div className="grid grid-cols-3 gap-6 mt-auto border-t border-white/10 pt-4">
            <div className="flex flex-col border-r border-white/10 pr-4">
               <div className="flex items-center gap-1.5 text-zinc-400 mb-1"><Calendar size={12} /><span className="text-[10px] uppercase tracking-widest font-mono">Date</span></div>
               <span className="text-sm md:text-base font-bold text-zinc-200 font-mono tracking-tight">{data.date}</span>
            </div>
            <div className="flex flex-col border-r border-white/10 px-4">
               <div className="flex items-center gap-1.5 text-zinc-400 mb-1"><MapPin size={12} /><span className="text-[10px] uppercase tracking-widest font-mono">Venue</span></div>
               <span className="text-sm md:text-base font-bold text-zinc-200 truncate" title={data.venue}>{data.venue}</span>
            </div>
            
            <div className="flex flex-col pl-4">
               <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Armchair size={12} />
                  <span className="text-[10px] uppercase tracking-widest font-mono">Seat</span>
               </div>
               <span className="text-base md:text-lg font-black font-serif text-white truncate tracking-wide drop-shadow-sm" title={seatInfo}>
                  {seatInfo}
               </span>
            </div>
         </div>
      </div>

      {/* 右侧海报区域 */}
      <div className="w-[180px] md:w-[260px] relative h-full shrink-0 overflow-hidden bg-black border-l border-white/5">
         <div className="w-full h-full transition-all duration-700 ease-out group-hover:scale-105">
           {data.image ? (
              <img src={data.image} alt="" className="w-full h-full object-cover" />
           ) : (
              // 这里的 DefaultPoster 已经支持自动换行逻辑
              <DefaultPoster 
                  title={data.title} 
                  date={data.date} 
                  color={data.color}  // <--- 记得加上这一行！！
                  variant="card" 
               />
           )}
         </div>
         <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent z-20 pointer-events-none"></div>
         <div className="absolute bottom-4 right-4 z-30 max-w-[180px] text-right translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
             <p className="text-[10px] text-zinc-200 italic font-serif bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 shadow-lg">
               <Quote size={8} className="inline mr-1 text-[#d4af37] mb-1" />
               {data.repo ? (data.repo.length > 30 ? data.repo.slice(0,30) + "..." : data.repo) : "暂无剧评..."}
             </p>
         </div>
      </div>
    </motion.div>
  );
}