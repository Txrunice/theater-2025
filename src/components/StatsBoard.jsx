import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Coins, Theater, MapPin, Trophy, Sparkles, Loader2, FileText, Mail, RotateCw } from 'lucide-react';
import { supabase } from '../supabase';
import AnnualReport from './AnnualReport';

const StatCard = ({ label, value, unit, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay, duration: 0.5 }}
    className="relative overflow-hidden bg-ink-900/40 backdrop-blur-md border border-white/5 p-8 rounded-xl group hover:border-cinnabar/30 transition-all duration-500"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cinnabar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 font-sans">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-gold-light to-gold drop-shadow-sm">
            {value}
          </span>
          <span className="text-sm text-gray-500 font-serif italic">{unit}</span>
        </div>
      </div>
      <div className="p-3 bg-white/5 rounded-full text-gray-600 group-hover:text-cinnabar group-hover:bg-cinnabar/10 transition-colors">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  </motion.div>
);

export default function StatsBoard({ plays }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // === 修改 1: 初始化时尝试从 LocalStorage 读取 ===
  const [reportData, setReportData] = useState(() => {
    const saved = localStorage.getItem('theater_2025_report');
    return saved ? JSON.parse(saved) : null;
  });

  // === 修改 2: 状态通知直接根据 reportData 是否存在来判断 ===
  // 如果 reportData 有值，就视为 success，显示“拆开信件”
  const hasReport = !!reportData; 
  const [notification, setNotification] = useState(hasReport ? 'success' : null);

  const totalSpent = plays.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const cities = [...new Set(plays.map(p => p.city))];
  const cityCount = cities.length;
  const categoryCount = {};
  plays.forEach(p => {
    if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '暂无');

  const handleGenerateReport = async () => {
    if (plays.length < 3) {
      alert("记录太少啦，多看几部戏再来生成报告吧！");
      return;
    }
    
    setIsGenerating(true);
    setNotification(null);
    // 注意：这里不要立即清空 reportData，防止用户生成一半刷新页面数据丢失
    // 只有生成成功后才覆盖

    try {
      const { data, error } = await supabase.functions.invoke('analyze-program', {
        body: { 
          action: 'generate_report', 
          records: plays,
          year: new Date().getFullYear() 
        }
      });

      if (error) throw error;
      
      const parsedResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      
      // === 修改 3: 生成成功后，存入 LocalStorage ===
      setReportData(parsedResult);
      localStorage.setItem('theater_2025_report', JSON.stringify(parsedResult));
      
      setNotification('success'); 

      if (showReportModal) {
          // 如果是在模态框里点的重新生成，不做额外操作
      }

    } catch (err) {
      console.error("Report generation failed:", err);
      alert("生成失败，请稍后再试");
      // 如果失败了，恢复之前的状态（如果有旧数据的话）
      if (reportData) setNotification('success');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
   <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="观演总数" value={plays.length} unit="部" icon={Ticket} delay={0} />
      <StatCard label="年度开销" value={totalSpent} unit="元" icon={Coins} delay={0.1} />
      <StatCard label="城市足迹" value={cityCount} unit="座" icon={MapPin} delay={0.2} />
      <StatCard label="偏好剧种" value={topCategory} unit="" icon={Trophy} delay={0.3} />
      
      {/* === 年度报告入口卡片 === */}
      <div className="md:col-span-2 lg:col-span-4 mt-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-ink-900 to-ink-800 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-cinnabar/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 z-10">
                <div className="bg-gold/10 p-3 rounded-full text-gold">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-serif text-white font-bold">2025 年度观演报告</h3>
                    <p className="text-gray-400 text-sm">AI 深度分析你的戏剧品味，生成专属纪念册。</p>
                </div>
            </div>

            <div className="z-10 flex items-center gap-3">
                {isGenerating && (
                    <div className="flex items-center gap-2 text-cinnabar text-sm animate-pulse">
                        <Loader2 className="animate-spin" size={16} />
                        <span>AI 正在撰写中...</span>
                    </div>
                )}

                {/* 只要不是正在生成，且有 notification 或 本地有缓存，就显示打开按钮 */}
                {!isGenerating && (notification === 'success' || hasReport) && (
                     <>
                        <motion.button 
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gold to-yellow-600 text-ink-900 font-bold rounded-full shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-transform"
                        >
                            <Mail size={18} />
                            <span>拆开信件</span>
                        </motion.button>
                        
                        <button 
                            onClick={handleGenerateReport}
                            title="重新生成"
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors border border-white/10"
                        >
                            <RotateCw size={18} />
                        </button>
                     </>
                )}

                {/* 既没在生成，也没有已存在的报告时，显示生成按钮 */}
                {!isGenerating && notification !== 'success' && !hasReport && (
                    <button 
                        onClick={handleGenerateReport}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-full transition-all flex items-center gap-2 group-hover:border-gold/50"
                    >
                        <FileText size={16} />
                        <span>生成报告</span>
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>

    <AnnualReport 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        data={reportData}
        onRegenerate={handleGenerateReport} 
    />
   </>
  );
}