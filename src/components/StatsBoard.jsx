import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Coins, MapPin, Trophy, Sparkles, Loader2, FileText, Mail, RotateCw } from 'lucide-react';
import { supabase } from '../supabase';
import AnnualReport from './AnnualReport';

// === 饮品数据库 ===
const BEVERAGES = [
  { name: "星巴克·焦糖玛奇朵", price: 37, kcal: 250 },
  { name: "一点点·冰淇淋红茶", price: 15, kcal: 210 },
  { name: "霸王茶姬·伯牙绝弦", price: 16, kcal: 268 },
  { name: "奈雪的茶·霸气橙子", price: 19, kcal: 230 },
  { name: "蜜雪冰城·冰鲜柠檬水", price: 4, kcal: 120 },
  { name: "益禾堂·薄荷奶绿", price: 9, kcal: 192 },
  { name: "幸运咖·青提香柠茶", price: 9, kcal: 150 },
  { name: "瑞幸咖啡·生椰拿铁", price: 9.9, kcal: 180 },
  { name: "茶百道·豆乳玉麒麟", price: 14, kcal: 300 }
];

// === 时间转化库 ===
const TIME_ACTIVITIES = [
  { name: "读完《百年孤独》", minutes: 900 },
  { name: "刷完一部经典电影", minutes: 120 },
  { name: "听完一张周杰伦的专辑", minutes: 45 },
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

  // 基础数据统计 (用于上方卡片)
  const totalSpent = plays.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const cities = [...new Set(plays.map(p => p.city))];
  const cityCount = cities.length;
  const categoryCount = {};
  plays.forEach(p => {
    if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '暂无');

  // ==========================================
  // 1. 工具函数：计算准确的城市足迹
  // ==========================================
  const getCityVisits = (records) => {
    const sorted = [...records].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const visits = [];
    
    sorted.forEach(record => {
        if (!record.city) return;
        // 核心逻辑：只有当这是第一条记录，或者当前城市与上一条记录的城市不同时才添加
        // 这解决了连续多天在同一城市看剧导致地图路径点密集重叠的问题
        if (visits.length === 0 || visits[visits.length - 1].city !== record.city) {
            visits.push({
                city: record.city,
                date: record.date
            });
        }
    });
    return visits;
  };

  // ==========================================
  // 2. 工具函数：计算习惯 (Top City & Busy Day) 
  // ==========================================
  const calculateHabits = (records) => {
    const cityCounts = {};
    const dayCounts = {};
    // 保持与后端一致的中文数组，如果你希望显示英文，可改为 ['Sunday', 'Monday', ...]
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    records.forEach(r => {
        // 1. 统计城市频率
        if (r.city) {
            const city = r.city.replace('市', ''); // 统一去掉“市”
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
        
        // 2. 统计星期频率
        const date = new Date(r.date);
        if (!isNaN(date.getTime())) {
            const dayName = days[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
    });

    // 找出最常去的城市
    let favCity = "未知";
    let maxCityCount = 0;
    Object.entries(cityCounts).forEach(([city, count]) => {
        if (count > maxCityCount) {
            maxCityCount = count;
            favCity = city;
        }
    });

    // 找出最忙碌的一天
    let busyDay = "周末";
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
        if (count > maxDayCount) {
            maxDayCount = count;
            busyDay = day;
        }
    });

    return {
        busyDay,
        favCity,
        totalCities: Object.keys(cityCounts).length
    };
  };

  // === 辅助逻辑：生成生活统计 ===
  const generateLifestyleStats = (totalMoney) => {
    const daily = totalMoney / 365;
    const weekly = totalMoney / 52;
    const monthly = totalMoney / 12;

    const minBev = BEVERAGES.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
    let targetBev = BEVERAGES[Math.floor(Math.random() * BEVERAGES.length)];
    
    let primaryType = ''; 
    let primaryBev = targetBev;

    if (daily >= targetBev.price) {
      primaryType = 'daily';
    } else if (weekly >= targetBev.price) {
      primaryType = 'weekly';
    } else if (monthly >= targetBev.price) {
      primaryType = 'monthly';
    } else {
      primaryType = 'monthly';
      primaryBev = minBev;
    }

    const labelMap = { daily: '每天', weekly: '每周', monthly: '每月' };
    // 增加英文映射
    const labelMapEn = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
    
    const currentBaseAmount = { daily, weekly, monthly }[primaryType];
    const primaryCount = (currentBaseAmount / primaryBev.price).toFixed(1);
    const primaryKcal = Math.floor(primaryCount * primaryBev.kcal);
    
    let monthlyInfo = null;
    if (monthly >= primaryBev.price) {
      const mCount = (monthly / primaryBev.price).toFixed(1);
      const mKcal = Math.floor(mCount * primaryBev.kcal);
      monthlyInfo = { count: mCount, kcal: mKcal, label: '每月' };
    }

    // --- 修改点：保留全名 ---
    const bevName = primaryBev.name; 
    let description = `${labelMap[primaryType]}少喝 ${primaryCount} 杯 ${bevName}`;
    
    if (primaryType !== 'monthly' && monthlyInfo) {
      description += `，折合${monthlyInfo.label}约 ${monthlyInfo.count} 杯`;
    }

    const runDistance = (primaryKcal / 65).toFixed(1);

    return {
      timeframeLabel: labelMap[primaryType],
      timeframeLabelEn: labelMapEn[primaryType], // 传出英文标签
      costDisplay: currentBaseAmount.toFixed(0),
      description: `这笔开销相当于${description}。`,
      energyText: `${labelMap[primaryType]}减少摄入 ${primaryKcal} kcal`,
      kcalValue: primaryKcal,
      runDistance: runDistance,
    };
  };

  // === 辅助逻辑：生成时间统计 ===
  const generateTimeStats = (playCount) => {
      const totalMinutes = playCount * 150; 
      const activity = TIME_ACTIVITIES[Math.floor(Math.random() * TIME_ACTIVITIES.length)];
      const count = (totalMinutes / activity.minutes).toFixed(1);

      return {
          totalHours: (totalMinutes / 60).toFixed(1),
          activityName: activity.name,
          activityCount: count
      };
  };

  // === 主逻辑：处理报告生成 ===
  const handleGenerateReport = async () => {
    if (plays.length < 3) {
      alert("记录太少啦，多看几部戏再来生成报告吧！");
      return;
    }
    
    setIsGenerating(true);
    setNotification(null);

    try {
      // -----------------------------------------------------
      // 1. 前端执行非 AI 计算 (原后端逻辑迁移至此)
      // -----------------------------------------------------
      
      // A. 计算足迹与习惯
      const accurateCityVisits = getCityVisits(plays);
      const habits = calculateHabits(plays);

      // B. 计算经济与时间统计
      const lifeStats = generateLifestyleStats(totalSpent);
      const timeStats = generateTimeStats(plays.length);
      
      // C. 计算消费峰值月份
      const monthMap = {};
      plays.forEach(r => {
          const m = new Date(r.date).getMonth() + 1 + "月";
          monthMap[m] = (monthMap[m] || 0) + Number(r.price || 0);
      });
      let maxMon = '', maxVal = 0;
      Object.entries(monthMap).forEach(([m, v]) => { if(v > maxVal) { maxVal = v; maxMon = m; } });

      const extraStats = {
          life: lifeStats, 
          time: timeStats, 
          money: {
              totalCost: totalSpent,
              maxMonth: maxMon,
              maxMonthCost: maxVal
          }
      };

      // -----------------------------------------------------
      // 2. 调用后端 AI (仅负责生成文本)
      // -----------------------------------------------------
      const { data, error } = await supabase.functions.invoke('analyze-program', {
        body: { 
          action: 'generate_report', 
          records: plays,
          year: new Date().getFullYear() 
        }
      });

      if (error) throw error;
      
      const aiResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      
      // -----------------------------------------------------
      // 3. 数据合并 (前端完成组装)
      // -----------------------------------------------------
      const finalReport = {
          ...aiResult,         // AI 生成的感性分析 (letter, keywords, etc.)
          cityVisits: accurateCityVisits, // [关键] 准确的地图路径
          habits: habits,      // [关键] 准确的统计 (Top City, Busy Day)
          extraStats: extraStats 
      };
      
      setReportData(finalReport);
      localStorage.setItem('theater_2025_report', JSON.stringify(finalReport));
      setNotification('success'); 

    } catch (err) {
      console.error("Report error:", err);
      alert("生成失败，请稍后再试");
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
