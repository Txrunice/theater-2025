import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, getDaysInMonth, startOfMonth, getDay, isSameDay } from 'date-fns';
import { ChevronRight, Calendar as CalIcon } from 'lucide-react';
import DefaultPoster from './DefaultPoster'; 

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 提取一个通用的标题格式化函数
const formatTitle = (title) => {
  if (!title) return '';
  if (/[+＋]/.test(title)) {
    const parts = title.split(/\s*[+＋]\s*/).filter(Boolean);
    return `折子戏：${parts.map(p => `《${p}》`).join('')}`;
  }
  return title;
};

export default function TimelineView({ plays }) {
  const sortedPlays = [...plays].sort((a, b) => new Date(a.date) - new Date(b.date));
  const [selectedDate, setSelectedDate] = useState(null);

  const renderMonth = (monthIndex) => {
    const year = 2025; 
    const firstDay = startOfMonth(new Date(year, monthIndex));
    const daysInMonth = getDaysInMonth(firstDay);
    const startDay = getDay(firstDay); 
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const current = new Date(year, monthIndex, i);
      const playsOnThisDay = plays.filter(p => isSameDay(parseISO(p.date), current));
      const hasPlay = playsOnThisDay.length > 0;
      const isSelected = selectedDate && isSameDay(selectedDate, current);

      days.push(
        <div 
          key={i}
          onClick={() => hasPlay && setSelectedDate(current)}
          className={`h-8 w-8 text-xs flex items-center justify-center rounded-full cursor-pointer transition-all relative
            ${hasPlay ? 'font-bold text-white hover:bg-white/20' : 'text-zinc-700'}
            ${isSelected ? 'bg-yellow-600 !text-black shadow-lg shadow-yellow-600/50' : ''}
          `}
        >
          {i}
          {hasPlay && !isSelected && (
            <div className="absolute bottom-1 w-1 h-1 bg-[#800020] rounded-full shadow-[0_0_5px_#ff0000]" />
          )}
        </div>
      );
    }
    return days;
  };

  const selectedPlays = selectedDate 
    ? plays.filter(p => isSameDay(parseISO(p.date), selectedDate)) 
    : [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* 1. 时光长河 */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-4">
          <div className="h-2 w-2 bg-yellow-600 rounded-full animate-pulse" />
          <h3 className="serif text-xl text-zinc-300">Timeline Scroll</h3>
        </div>
        
        <div className="overflow-x-auto pb-8 custom-scrollbar px-4">
          <div className="flex gap-8 w-max relative pt-10">
            <div className="absolute top-[4.5rem] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-900/50 to-transparent" />
            
            {sortedPlays.map((play, index) => (
              <motion.div 
                key={play.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex flex-col items-center gap-4 w-40 shrink-0 group cursor-pointer"
                onClick={() => setSelectedDate(parseISO(play.date))}
              >
                {/* 日期气泡 */}
                <div className="px-3 py-1 rounded-full bg-[#1a1a1a] border border-white/10 text-xs text-zinc-400 group-hover:text-yellow-500 group-hover:border-yellow-600/50 transition-colors z-10">
                  {format(parseISO(play.date), 'MM.dd')}
                </div>
                
                {/* 连接点 */}
                <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border-2 border-yellow-800 z-10 group-hover:scale-125 group-hover:bg-yellow-600 transition-all" />
                
                {/* 剧目小卡片 */}
                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/5 relative group-hover:-translate-y-2 transition-transform duration-300 bg-[#141414]">
                  <div className="w-full h-full">
                    {play.image ? (
                      <img src={play.image} className="w-full h-full object-cover" />
                    ) : (
                      // 确保这里 variant="stub" 调用了新的逻辑
                      <DefaultPoster title={play.title} variant="stub" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                    {/* 修改点：使用格式化后的标题 */}
                    <p className="text-xs font-bold text-white truncate w-full" title={formatTitle(play.title)}>
                      {formatTitle(play.title)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 年度日历概览 */}
      <section className="bg-[#111] rounded-2xl border border-white/5 p-6 md:p-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-40 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />
         
         <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1">
               <h3 className="serif text-2xl text-white mb-6 flex items-center gap-2"><CalIcon size={20}/> 2025 Calendar</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-8">
                  {MONTHS.map((m, i) => (
                    <div key={m}>
                      <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3 border-b border-white/5 pb-1">{m}</h4>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {renderMonth(i)}
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="w-full md:w-80 shrink-0 border-l border-white/5 pl-0 md:pl-10 relative min-h-[300px]">
               {selectedPlays.length > 0 ? (
                 <div className="sticky top-10 space-y-6">
                    <div className="text-yellow-600 text-6xl serif font-bold opacity-20 absolute -top-4 -left-4">
                      {format(selectedDate, 'dd')}
                    </div>
                    <div>
                      <h4 className="text-zinc-400 uppercase tracking-widest text-xs mb-1">SELECTED DATE</h4>
                      <p className="text-2xl text-white font-serif">{format(selectedDate, 'MMMM do, yyyy')}</p>
                    </div>

                    {selectedPlays.map(p => (
                      <div key={p.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 group hover:border-yellow-600/30 transition-colors">
                         <div className="w-full h-32 rounded mb-3 overflow-hidden bg-[#0a0a0a]">
                            <div className="w-full h-full">
                                {p.image ? (
                                  <img src={p.image} className="w-full h-full object-cover"/>
                                ) : (
                                  <DefaultPoster title={p.title} variant="mini" />
                                )}
                            </div>
                         </div>
                         {/* 修改点：使用格式化后的标题 */}
                         <h3 className="text-lg font-bold text-white mb-1" title={formatTitle(p.title)}>
                           {formatTitle(p.title)}
                         </h3>
                         <div className="text-xs text-zinc-500 mb-2">{p.venue} · {p.seat_info || '座位未知'}</div>
                         <p className="text-xs text-zinc-400 italic line-clamp-2">"{p.repo || 'No comments...'}"</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="h-full flex flex-col justify-center items-center text-zinc-600 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4">
                       <span className="text-2xl">?</span>
                    </div>
                    <p>Select a date with a <span className="text-red-900 font-bold">●</span> dot<br/>to see memories.</p>
                 </div>
               )}
            </div>
         </div>
      </section>
    </div>
  );
}