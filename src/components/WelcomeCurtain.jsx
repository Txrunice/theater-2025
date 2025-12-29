import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ScrollText, Feather } from 'lucide-react';

export default function WelcomeCurtain({ onAnimationComplete, displayName }) {
  // 1. 逻辑保持不变：3.5秒后通知父组件卸载
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete && onAnimationComplete();
    }, 1500); 
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const noisePattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  return (
    // 2. 关键修改：最外层改为 motion.div，并控制整体 Opacity
    <motion.div 
      // 初始状态：不淡入，直接显示 (opacity: 1)
      initial={{ opacity: 1 }}
      // 结束状态：最后变为透明 (opacity: 0)
      animate={{ opacity: 0 }}
      // 动画配置：等待 2.5秒，然后用 1秒 淡出 (总共 3.5秒，与 setTimeout 同步)
      transition={{ delay: 2.5, duration: 1, ease: "easeInOut" }}
      // 这里的 backdrop-blur 属于这个 motion.div，当 opacity 变 0，模糊也会随之消失
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none font-serif"
    >
      
      {/* 3. 内部窗口：只需处理缩放动画，不再处理透明度（继承父级消失效果） */}
      <motion.div 
        // 初始大小
        initial={{ scale: 1 }}
        // 结束时稍微缩小，增加退场的层次感
        animate={{ scale: 0.95 }}
        transition={{ delay: 2.5, duration: 1, ease: "easeInOut" }}
        className="relative w-[90vw] max-w-[600px] h-[400px] overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black"
      >

        {/* 左侧背景板 (静态，随父容器消失) */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 z-20 flex flex-col justify-center items-end bg-[#050101]">
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-red-950/20" />
          <div className="absolute inset-0" style={{ backgroundImage: noisePattern }} />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
          <div className="h-full w-[1px] bg-white/5" />
        </div>

        {/* 右侧背景板 (静态，随父容器消失) */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 z-20 flex flex-col justify-center items-start bg-[#050101]">
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-red-950/20" />
          <div className="absolute inset-0" style={{ backgroundImage: noisePattern }} />
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
          <div className="h-full w-[1px] bg-white/5" />
        </div>

        {/* 核心文字内容 */}
        {/* 这里保留一个微小的文字上浮动画，让画面不那么死板，但窗口本身是立即出现的 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-30 flex flex-col items-center justify-center h-full text-center space-y-6 pb-4"
        >
          {/* 图标 */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-20" />
            <div className="bg-gradient-to-b from-zinc-800/40 to-black/60 p-4 rounded-full border border-white/5 backdrop-blur-md shadow-xl">
               <ScrollText className="text-red-600 w-8 h-8 opacity-90" />
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-[0.2em] mb-3 drop-shadow-2xl">
              好戏<span className="text-red-700 inline-block drop-shadow-lg">开场</span>
            </h2>
            
            <div className="flex items-center justify-center gap-4 opacity-40 my-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-500" />
              <Sparkles className="w-2 h-2 text-zinc-500" />
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-500" />
            </div>

            <p className="text-zinc-500 text-xs md:text-sm font-light tracking-[0.3em] uppercase">
              欢迎 · <span className="text-zinc-300 font-medium">{displayName || '贵宾'}</span>
            </p>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full text-center">
             <div className="flex flex-col items-center justify-center opacity-40">
                <p className="text-[8px] text-zinc-600 tracking-[0.4em] uppercase mb-1">
                  Design & Code by
                </p>
                <div className="flex items-center text-[10px] text-red-800/70 font-bold tracking-[0.2em]">
                  <Feather className="w-2 h-2 mr-1" />
                  热情的冰冻生菜
                </div>
             </div>
          </div>
        </motion.div>
        
        {/* 背景底色 */}
        <div className="absolute inset-0 bg-[#050101] -z-10" />
      </motion.div>
    </motion.div>
  );
}