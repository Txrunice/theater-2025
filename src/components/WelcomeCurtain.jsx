import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ScrollText } from 'lucide-react';

export default function WelcomeCurtain({ onAnimationComplete, displayName }) {
  // 3.5秒后通知父组件动画结束
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete && onAnimationComplete();
    }, 3500); 
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      
      {/* --- 左侧幕布 --- */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '-100%' }}
        transition={{ duration: 1.5, delay: 2.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#0a0000] z-20 flex flex-col justify-center items-end border-r border-red-900/30"
      >
        {/* 纹样背景 */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]" />
        <div className="h-3/4 w-[1px] bg-gradient-to-b from-transparent via-red-600/50 to-transparent mr-1" />
      </motion.div>

      {/* --- 右侧幕布 --- */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, delay: 2.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#0a0000] z-20 flex flex-col justify-center items-start border-l border-red-900/30"
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]" />
        <div className="h-3/4 w-[1px] bg-gradient-to-b from-transparent via-red-600/50 to-transparent ml-1" />
      </motion.div>

      {/* --- 核心文字内容 (在幕布拉开前显示) --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ times: [0, 0.2, 0.8, 1], duration: 2 }}
        className="relative z-30 flex flex-col items-center text-center space-y-6"
      >
        <div className="bg-red-900/20 p-4 rounded-full border border-red-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.3)]">
           <ScrollText className="text-red-500 w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-widest mb-2">
            好戏<span className="text-red-600 mx-2">开场</span>
          </h2>
          <div className="h-[1px] w-24 bg-red-800 mx-auto my-4"/>
          <p className="text-zinc-400 text-sm md:text-base font-light tracking-[0.3em] uppercase">
            欢迎入座，{displayName || '戏迷'}
          </p>
        </div>

        {/* 作者署名 - 仪式感核心 */}
        <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-full text-center">
          <p className="text-[10px] text-zinc-600 tracking-[0.4em] uppercase opacity-70">
            Design & Code by
          </p>
          <p className="text-xs text-red-500/80 font-bold tracking-[0.2em] mt-2">
            热情的冰冻生菜
          </p>
        </div>
      </motion.div>
      
      {/* 黑色背景遮罩 (防止动画期间透视到底层) */}
      <motion.div 
         initial={{ opacity: 1 }}
         animate={{ opacity: 0 }}
         transition={{ delay: 2.8, duration: 0.5 }}
         className="absolute inset-0 bg-[#050505] -z-10"
      />
    </div>
  );
}