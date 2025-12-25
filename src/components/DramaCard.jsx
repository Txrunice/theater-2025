import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Calendar, MapPin, Ticket, Armchair } from 'lucide-react';
import DefaultPoster from './DefaultPoster';
import { ReadOnlyStars } from './RatingComponents'; // 假设你把上面那个 ReadOnlyStars 放到了单独文件或就在同一文件

export default function DramaCard({ data, onEdit, onDelete }) {
  const seatInfo = data.seat_info || data.seat || '---';

  // === 1. 计算显示评分 (支持折子戏平均分) ===
  const displayRating = useMemo(() => {
    // 假设折子戏数据结构里有一个 sub_plots 数组存储了分段信息
    // 或者是 items 数组，请根据你实际数据库字段调整
    const subItems = data.sub_plots || data.items || data.cast_list; 
    
    // 只有当类型是折子戏 且 存在子项数组 且 子项里有 rating 字段时，才计算平均分
    // 这里简单判断：如果 data.rating 存在则优先用 data.rating (除非你想强制覆盖)
    // 下面逻辑是：如果没有主评分，或者想动态计算，则取平均
    if (Array.isArray(subItems) && subItems.length > 0) {
      // 过滤出有评分的项
      const ratedItems = subItems.filter(item => item.rating > 0);
      if (ratedItems.length > 0) {
        const total = ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0);
        return total / ratedItems.length;
      }
    }
    return Number(data.rating) || 0;
  }, [data]);

  // === 2. 标题处理 ===
  let displayTitle = data.title;
  // 如果是折子戏且包含分隔符，增加前缀修饰
  if ((data.category === '折子戏' || data.type === '折子戏') && /[+＋\s]/.test(data.title)) {
    const parts = data.title.split(/[\s+＋]+/).filter(Boolean);
    // 这里只在hover title里显示这种长格式，主标题保持原样或者自己决定
    // displayTitle = `折子戏：${parts.map(p => `《${p}》`).join('')}`;
  }

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }} 
      whileHover={{ y: -8 }}
      className="group relative w-full h-[540px]"
    >
      <div className="h-full bg-[#141414] rounded-lg overflow-hidden border border-white/15 shadow-2xl relative flex flex-col group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:border-white/30 transition-all duration-300">
        
        {/* === 上半部分：海报区域 === */}
        <div className="relative h-[65%] overflow-hidden bg-black">
          {data.image ? (
            <img 
              src={data.image} 
              alt={data.title} 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" 
            />
          ) : (
            // 调用新的海报组件，它会自动处理长标题
            <DefaultPoster title={data.title} date={data.date} variant="card" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          
          <div className="absolute top-2 right-2 z-20">
             <div className="bg-zinc-900/90 backdrop-blur text-zinc-200 border border-white/10 text-[10px] font-bold px-2 py-1 rounded-sm shadow-lg tracking-widest flex items-center gap-1">
                <Ticket size={10} className="text-[#d4af37]" />
                {data.category}
             </div>
          </div>
          
          <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
             <button onClick={(e) => {e.stopPropagation(); onEdit(data)}} className="p-2 bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black rounded-full transition-colors"><Edit2 size={12} /></button>
             <button onClick={(e) => {e.stopPropagation(); onDelete(data.id)}} className="p-2 bg-black/60 backdrop-blur text-white hover:bg-red-600 rounded-full transition-colors"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* === 票根缺口 === */}
        <div className="relative h-4 bg-[#141414] flex items-center z-10">
            <div className="absolute left-[-10px] w-5 h-5 bg-[#0b0c10] rounded-full z-10 border-r border-white/10 shadow-inner"></div>
            <div className="w-full border-t-2 border-dashed border-zinc-700/30 mx-4"></div>
            <div className="absolute right-[-10px] w-5 h-5 bg-[#0b0c10] rounded-full z-10 border-l border-white/10 shadow-inner"></div>
        </div>

        {/* === 下半部分：详情 === */}
        <div className="flex-1 bg-[#141414] p-5 pt-1 flex flex-col justify-between relative">
           <div>
              {/* 修改：使用 ReadOnlyStars 显示计算后的评分 */}
              <div className="flex items-center gap-2 mb-2">
                <ReadOnlyStars rating={displayRating} size={12} />
                <span className="text-[10px] text-zinc-500 font-mono pt-0.5">
                  {displayRating > 0 ? displayRating.toFixed(1) : ''}
                </span>
              </div>
              
              <h3 
                className="text-xl font-bold font-serif text-white mb-2 line-clamp-2 leading-tight group-hover:text-[#d4af37] transition-colors cursor-default" 
                title={displayTitle}
              >
                {displayTitle}
              </h3>

              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <Calendar size={12} className="text-zinc-600" /> 
                  <span>{data.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <MapPin size={12} className="text-zinc-600" /> 
                  <span className="truncate">{data.venue}</span>
                </div>
              </div>
           </div>

           {/* 底部信息栏 */}
           <div className="mt-4 pt-3 border-t border-dashed border-white/5 flex justify-between items-end">
             <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[9px] text-[#b5975b] font-mono uppercase tracking-widest mb-1">
                  <Armchair size={10} /> 
                  <span>SEAT NO.</span>
                </div>
                <div className="text-zinc-100 font-serif font-bold text-lg leading-none truncate max-w-[150px]" title={seatInfo}>
                   {seatInfo}
                </div>
             </div>

             <div className="flex flex-col items-end">
                <span className="text-[9px] text-[#b5975b] font-mono uppercase tracking-widest mb-1">
                   PRICE
                </span>
                <span className="text-zinc-400 font-serif font-bold text-lg leading-none group-hover:text-zinc-200 transition-colors">
                   <span className="text-xs mr-0.5 font-sans">¥</span>{data.price || '-'}
                </span>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}