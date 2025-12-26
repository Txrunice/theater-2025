import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Coins, MapPin, Trophy, Sparkles, Loader2, FileText, Mail, RotateCw } from 'lucide-react';
import { supabase } from '../supabase';
import AnnualReport from './AnnualReport';

// === 饮品数据库 ===
const BEVERAGES = [
  { name: "霸王茶姬·伯牙绝弦", price: 16, kcal: 268 },
  { name: "茶百道·豆乳玉麒麟", price: 14, kcal: 300 },
  { name: "益禾堂·薄荷奶绿", price: 9, kcal: 192 },
  { name: "蜜雪冰城·冰鲜柠檬水", price: 4, kcal: 120 },
  { name: "瑞幸咖啡·生椰拿铁", price: 9.9, kcal: 180 },
  { name: "一点点·冰淇淋红茶", price: 15, kcal: 210 },
  { name: "可乐", price: 3, kcal: 225 },
  { name: "雪碧", price: 3, kcal: 200 },
  { name: "幸运咖·青提香柠茶", price: 9, kcal: 150 }
];

// === 时间转化库 ===
const TIME_ACTIVITIES = [
  { name: "读完《百年孤独》", minutes: 900 }, // 约15小时
  { name: "刷完一部经典电影", minutes: 120 },
  { name: "听完一张周杰伦的专辑", minutes: 45 },
  { name: "进行一次深度冥想", minutes: 20 },
  { name: "完成一次5公里慢跑", minutes: 35 },
  { name: "上完一节数学课", minutes: 45 }
];

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
  
  const [reportData, setReportData] = useState(() => {
    const saved = localStorage.getItem('theater_2025_report');
    return saved ? JSON.parse(saved) : null;
  });

  const hasReport = !!reportData; 
  const [notification, setNotification] = useState(hasReport ? 'success' : null);

  // 基础数据统计
  const totalSpent = plays.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const cities = [...new Set(plays.map(p => p.city))];
  const cityCount = cities.length;
  const categoryCount = {};
  plays.forEach(p => {
    if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '暂无');

  // === 核心逻辑：生成生活方式统计 (奶茶/热量/跑步) ===
  const generateLifestyleStats = (totalMoney) => {
    const avgDaily = totalMoney / 365;
    const avgWeekly = totalMoney / 52;
    const avgMonthly = totalMoney / 12;

    let timeframe = 'daily';
    let baseAmount = avgDaily;
    let timeframeLabel = '每天';

    // 动态决定时间维度
    if (avgDaily < 5) {
        if (avgWeekly < 10) {
            timeframe = 'monthly';
            baseAmount = avgMonthly;
            timeframeLabel = '每月';
        } else {
            timeframe = 'weekly';
            baseAmount = avgWeekly;
            timeframeLabel = '每周';
        }
    }

    // 随机选择 1-2 种饮品进行对比
    const shuffledBevs = [...BEVERAGES].sort(() => 0.5 - Math.random());
    const selectedBevs = shuffledBevs.slice(0, Math.random() > 0.5 ? 2 : 1);
    
    // 计算逻辑
    const itemsText = selectedBevs.map(bev => {
        const count = (baseAmount / bev.price).toFixed(1);
        if (parseFloat(count) < 1) return null; // 如果甚至买不起一杯，就不显示这个
        return {
            name: bev.name,
            count: count,
            totalKcal: Math.floor(count * bev.kcal)
        };
    }).filter(Boolean);

    // 如果金额太少连最便宜的都买不起
    if (itemsText.length === 0) {
        return {
            timeframeLabel,
            costDisplay: Math.floor(baseAmount),
            description: `相当于${timeframeLabel}少吃一顿大餐，保持了极致的身材管理。`,
            runDistance: 0
        };
    }

    const totalSavedKcal = itemsText.reduce((acc, curr) => acc + curr.totalKcal, 0);
    // 慢跑 1km 约消耗 60-70 kcal，取 65
    const runDistance = (totalSavedKcal / 65).toFixed(1);

    // 构建文案
    const bevString = itemsText.map(i => `${i.count} 杯 ${i.name.split('·')[1] || i.name}`).join(' + ');
    
    return {
        timeframeLabel, // "每天" / "每周" / "每月"
        costDisplay: baseAmount.toFixed(0), // 金额
        description: `这笔开销相当于${timeframeLabel}少喝了 ${bevString}。`, // 描述文案
        energyText: `总计减少摄入 ${totalSavedKcal} kcal 热量`, // 热量文案
        runDistance: runDistance // 距离
    };
  };

  // === 核心逻辑：生成时间统计 (读书/看电影) ===
  const generateTimeStats = (playCount) => {
      const totalMinutes = playCount * 150; // 假设每部剧 2.5 小时 = 150分钟
      
      // 随机选一个参照物
      const activity = TIME_ACTIVITIES[Math.floor(Math.random() * TIME_ACTIVITIES.length)];
      const count = (totalMinutes / activity.minutes).toFixed(1);

      return {
          totalHours: (totalMinutes / 60).toFixed(1),
          activityName: activity.name,
          activityCount: count
      };
  };

  const handleGenerateReport = async () => {
    if (plays.length < 3) {
      alert("记录太少啦，多看几部戏再来生成报告吧！");
      return;
    }
    
    setIsGenerating(true);
    setNotification(null);

    try {
      // 1. 本地数学计算
      const lifeStats = generateLifestyleStats(totalSpent);
      const timeStats = generateTimeStats(plays.length);
      
      // 寻找最贵月份
      const monthMap = {};
      plays.forEach(r => {
          const m = new Date(r.date).getMonth() + 1 + "月";
          monthMap[m] = (monthMap[m] || 0) + Number(r.price || 0);
      });
      let maxMon = '', maxVal = 0;
      Object.entries(monthMap).forEach(([m, v]) => { if(v > maxVal) { maxVal = v; maxMon = m; } });

      const mathStats = {
          life: lifeStats, // 包含奶茶、热量、跑步距离
          time: timeStats, // 包含总时长、活动换算
          money: {
              totalCost: totalSpent,
              maxMonth: maxMon,
              maxMonthCost: maxVal
          },
          favCity: Object.entries(plays.reduce((acc, p) => { acc[p.city] = (acc[p.city]||0)+1; return acc; }, {}))
                    .sort((a,b) => b[1]-a[1])[0]?.[0] || '未知'
      };

      // 2. 调用 AI
      const { data, error } = await supabase.functions.invoke('analyze-program', {
        body: { 
          action: 'generate_report', 
          records: plays,
          year: new Date().getFullYear() 
        }
      });

      if (error) throw error;
      
      const aiResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      
      // 3. 合并
      const finalReport = {
          ...aiResult,
          extraStats: mathStats
      };
      
      setReportData(finalReport);
      localStorage.setItem('theater_2025_report', JSON.stringify(finalReport));
      setNotification('success'); 

    } catch (err) {
      console.error("Report error:", err);
      alert("生成失败，请稍后再试");
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
      
      {/* 年度报告入口 */}
      <div className="md:col-span-2 lg:col-span-4 mt-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-ink-900 to-ink-800 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cinnabar/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 z-10">
                <div className="bg-gold/10 p-3 rounded-full text-gold">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-serif text-white font-bold">2025 年度观演报告</h3>
                    <p className="text-gray-400 text-sm">AI 深度复盘你的剧场时光，生成专属回忆。</p>
                </div>
            </div>

            <div className="z-10 flex items-center gap-3">
                {isGenerating && (
                    <div className="flex items-center gap-2 text-cinnabar text-sm animate-pulse">
                        <Loader2 className="animate-spin" size={16} />
                        <span>AI 正在撰写中...</span>
                    </div>
                )}

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
                        
                        <button onClick={handleGenerateReport} title="重新生成" className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors border border-white/10">
                            <RotateCw size={18} />
                        </button>
                     </>
                )}

                {!isGenerating && notification !== 'success' && !hasReport && (
                    <button onClick={handleGenerateReport} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-full transition-all flex items-center gap-2 group-hover:border-gold/50">
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