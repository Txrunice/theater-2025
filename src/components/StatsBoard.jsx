import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Coins, MapPin, Trophy, Sparkles, Loader2, FileText, Mail, RotateCw } from 'lucide-react';
import { supabase, saveUserReport, fetchUserReport } from '../supabase'; // 👈 1. 引入新函数
import AnnualReport from './AnnualReport';

// === 新增：严格的数据结构校验函数 ===
const validateAiResult = (data) => {
  // 1. 基础：必须是对象
  if (!data || typeof data !== 'object') return false;

  // 2. 核心字段：检查 AnnualReport 组件必然会用到的字符串
  // 对应 prompt 里的 "letter", "summary_text", "userLabel", "monthly_story"
  if (typeof data.letter !== 'string' || data.letter.length < 10) return false; // 信件太短肯定不对
  if (typeof data.summary_text !== 'string') return false;
  if (typeof data.userLabel !== 'string') return false;

  // 3. 数组/集合检查
  // 对应 prompt 里的 "stats": { "keywords": [...] }
  // 注意：你的 prompt 把 keywords 放在了 stats 对象里，这里必须层层检查
  if (!data.stats || !Array.isArray(data.stats.keywords) || data.stats.keywords.length === 0) {
    console.warn("校验失败：stats.keywords 结构错误或为空");
    return false;
  }

  // 4. 复杂对象检查
  // 对应 prompt 里的 "timeline": { "firstPlay": ..., "lastPlay": ... }
  if (!data.timeline || !data.timeline.firstPlay || !data.timeline.lastPlay) {
    console.warn("校验失败：timeline 缺失");
    return false;
  }

  // 对应 prompt 里的 "picks": { "top": ... }
  if (!data.picks || !data.picks.top) {
    console.warn("校验失败：picks.top 缺失");
    return false;
  }

  // 对应 prompt 里的 "theme_analysis"
  if (!data.theme_analysis) {
    console.warn("校验失败：theme_analysis 缺失");
    return false;
  }

  return true; // 所有检查通过
};

// === 饮品数据库 (保持不变) ===
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

// === 时间转化库 (保持不变) ===
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

// 👇 2. 接收 userId 参数
export default function StatsBoard({ plays, userId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // 3. 修改初始状态：不再直接读 localStorage，而是默认为 null
  const [reportData, setReportData] = useState(null);

  // 🔥 1. 弹窗控制锁：只有用户点击“生成”时才会开启
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);

  // 🔥 2. 统一加载逻辑：只在组件挂载或 userId 变化时执行一次
  useEffect(() => {
    async function loadReport() {
        if (!userId) return;
        try {
            const data = await fetchUserReport(userId);
            if (data) {
                setReportData(data);
                setNotification('success');
            }
        } catch (error) {
            console.error("加载报告失败", error);
        }
    }
    loadReport();
  }, [userId]);

  // 🔥 3. 自动弹出逻辑：监听数据变化
  useEffect(() => {
    // 只有当“锁”开启且“数据报错”时，才自动打开弹窗
    if (shouldAutoOpen && reportData?.isError) {
      setShowReportModal(true);
      setShouldAutoOpen(false); // 弹出后立即关锁，防止二次触发
    }
  }, [reportData, shouldAutoOpen]);

  const hasReport = !!reportData; 
  const [notification, setNotification] = useState(null);

  // 基础数据统计
  const totalSpent = plays.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const cities = [...new Set(plays.map(p => p.city))];
  const cityCount = cities.length;
  const categoryCount = {};
  plays.forEach(p => {
    if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '暂无');

  // 工具函数：计算准确的城市足迹 (保持不变)
  const getCityVisits = (records) => {
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const visits = [];
    sorted.forEach(record => {
        if (!record.city) return;
        if (visits.length === 0 || visits[visits.length - 1].city !== record.city) {
            visits.push({ city: record.city, date: record.date });
        }
    });
    return visits;
  };

  // 工具函数：计算习惯 (保持不变)
  const calculateHabits = (records) => {
    const cityCounts = {};
    const dayCounts = {};
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    records.forEach(r => {
        if (r.city) {
            const city = r.city.replace('市', '');
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
        const date = new Date(r.date);
        if (!isNaN(date.getTime())) {
            const dayName = days[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
    });

    let favCity = "未知";
    let maxCityCount = 0;
    Object.entries(cityCounts).forEach(([city, count]) => {
        if (count > maxCityCount) { maxCityCount = count; favCity = city; }
    });

    let busyDay = "周末";
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
        if (count > maxDayCount) { maxDayCount = count; busyDay = day; }
    });

    return { busyDay, favCity, totalCities: Object.keys(cityCounts).length };
  };

  // 辅助逻辑：生成生活统计 (保持不变)
  const generateLifestyleStats = (totalMoney) => {
    const daily = totalMoney / 365;
    const weekly = totalMoney / 52;
    const monthly = totalMoney / 12;

    const minBev = BEVERAGES.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
    let targetBev = BEVERAGES[Math.floor(Math.random() * BEVERAGES.length)];
    
    let primaryType = ''; 
    let primaryBev = targetBev;

    if (daily >= targetBev.price) { primaryType = 'daily'; } 
    else if (weekly >= targetBev.price) { primaryType = 'weekly'; } 
    else if (monthly >= targetBev.price) { primaryType = 'monthly'; } 
    else { primaryType = 'monthly'; primaryBev = minBev; }

    const labelMap = { daily: '每天', weekly: '每周', monthly: '每月' };
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

    const bevName = primaryBev.name; 
    let description = `${labelMap[primaryType]}少喝 ${primaryCount} 杯 ${bevName}`;
    if (primaryType !== 'monthly' && monthlyInfo) {
      description += `，折合${monthlyInfo.label}约 ${monthlyInfo.count} 杯`;
    }

    const runDistance = (primaryKcal / 65).toFixed(1);

    return {
      timeframeLabel: labelMap[primaryType],
      timeframeLabelEn: labelMapEn[primaryType],
      costDisplay: currentBaseAmount.toFixed(0),
      description: `这笔开销相当于${description}。`,
      energyText: `${labelMap[primaryType]}减少摄入 ${primaryKcal} kcal`,
      kcalValue: primaryKcal,
      runDistance: runDistance,
    };
  };

  // 辅助逻辑：生成时间统计 (保持不变)
  const generateTimeStats = (playCount) => {
      const totalMinutes = playCount * 150; 
      const activity = TIME_ACTIVITIES[Math.floor(Math.random() * TIME_ACTIVITIES.length)];
      const count = (totalMinutes / activity.minutes).toFixed(1);
      return { totalHours: (totalMinutes / 60).toFixed(1), activityName: activity.name, activityCount: count };
  };

  // === 主逻辑：处理报告生成 ===
// === 1. 新增：校验逻辑 (根据你的Prompt定制) ===
  const validateAiResult = (data) => {
    // 基础检查
    if (!data || typeof data !== 'object') return false;
    
    // 检查 Prompt 中定义的关键字符串字段
    const requiredStrings = ['letter', 'summary_text', 'userLabel', 'monthly_story'];
    for (const field of requiredStrings) {
      if (typeof data[field] !== 'string') return false;
    }

    // 检查嵌套对象结构 (Timeline, Picks, Theme)
    if (!data.timeline?.firstPlay || !data.timeline?.lastPlay) return false;
    if (!data.picks?.top) return false;
    if (!data.theme_analysis) return false;

    // 检查统计数组 (Keywords)
    // 你的 prompt 里 keywords 是放在 stats 对象下的
    if (!data.stats?.keywords || !Array.isArray(data.stats.keywords)) return false;

    return true;
  };

  // === 2. 修改后的主函数 ===
  const handleGenerateReport = async () => {
    if (plays.length < 3) {
      alert("记录太少啦，多看几部戏再来生成报告吧！");
      return;
    }

    setIsGenerating(true);
    setNotification(null);
    setReportData(null);
    setShouldAutoOpen(true);

    try {

      const { data: { user } } = await supabase.auth.getUser();
      // 优先取 display_name，取不到则回退到 "Audience"
      const currentUserName = user?.user_metadata?.display_name || "Audience";
      console.log("正在为用户生成报告:", currentUserName);
      // 🔥 1. 获取精简版演员表 (按“特别关注”排序)
      const { data: actorsData } = await supabase
        .from('actors')
        .select('name, is_favorite') // 只取名字和关注状态，极小
        .eq('user_id', userId) 
      // 创建一个快速查找表: { "张三": true, "李四": false }
      const favMap = {};
      (actorsData || []).forEach(a => {
        favMap[a.name] = a.is_favorite;
      });

      // 2. 遍历 plays 统计场次 (复刻 ActorView 逻辑)
      const actorStatsMap = {};
      plays.forEach(play => {

        // A. 定义权重逻辑：演唱会权重 0.1，其他权重 1
        // 参考你提供的 ActorView 逻辑，多维度判断是否为演唱会
        const isConcert = 
            play.category === '演唱会' || 
            play.type === '演唱会' || 
            (play.title && play.title.includes('演唱会'));
            
        const weightVal = isConcert ? 0.1 : 1;

        // 确保 cast_list 存在且是数组
        if (play.cast_list && Array.isArray(play.cast_list)) {
          // 单部剧内去重
          const uniqueNames = new Set();
          play.cast_list.forEach(c => {
            if (c.name) uniqueNames.add(c.name);
          });
          
          uniqueNames.forEach(name => {
            // 初始化对象结构
            if (!actorStatsMap[name]) {
                actorStatsMap[name] = { count: 0, weight: 0 };
            }
            // 累加场次
            actorStatsMap[name].count += 1;
            // 累加权重
            actorStatsMap[name].weight += weightVal;
          });
        }
      });

      // 🔥 3. 合并数据并筛选
      const sortedActors = Object.entries(actorStatsMap)
        .map(([name, stats]) => ({
          name,
          count: stats.count,   // 展示用的实际场次
          weight: stats.weight, // 排序/筛选用的权重
          is_favorite: !!favMap[name] 
        }))
        // 🟢 筛选逻辑：权重 >= 1 或者 是特别关注
        // (比如：看了10场演唱会权重才=1，或者看了1场话剧权重=1，都会显示)
        .filter(actor => actor.weight >= 1 || actor.is_favorite) 
        
        // 排序优先级: 
        // 1. 特别关注优先
        // 2. 按权重(weight)降序，而不是按纯场次
        .sort((a, b) => {
          if (a.is_favorite !== b.is_favorite) {
            return a.is_favorite ? -1 : 1; 
          }
          // 如果权重一样，再按场次排，否则按权重排
          if (b.weight === a.weight) {
              return b.count - a.count;
          }
          return b.weight - a.weight; 
        });



      // 🔥 2. 预先统计剧场频次
      const venueCounts = {};
      plays.forEach(p => {
          if (p.venue) {
              const v = p.venue.trim();
              venueCounts[v] = (venueCounts[v] || 0) + 1;
          }
      });
      // 转为精简数组: [{name: '大剧院', count: 5}, ...]
      const venueStats = Object.entries(venueCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count); // 按次数从多到少排序

      // --- A. 前端计算 (这些永远不会错，先算好) ---
      const accurateCityVisits = getCityVisits(plays);
      const habits = calculateHabits(plays);
      const lifeStats = generateLifestyleStats(totalSpent);
      const timeStats = generateTimeStats(plays.length);
      
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
          money: { totalCost: totalSpent, maxMonth: maxMon, maxMonthCost: maxVal }
      };

      // --- B. 调用 AI 并进行安全校验 ---
      let aiResult;

      try {
        const { data, error } = await supabase.functions.invoke('analyze-program', {
          body: { action: 'generate_report', records: plays, year: new Date().getFullYear() }
        });

        if (error) throw error; // 抛出网络错误，进入 catch

        let rawResult = data.result;

        // 尝试清理 Markdown 标记 (以防 AI 输出 ```json)
        if (typeof rawResult === 'string') {
           rawResult = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();
           aiResult = JSON.parse(rawResult);
        } else {
           aiResult = rawResult;
        }

        // 🔥 核心步骤：阅卷检查
        if (!validateAiResult(aiResult)) {
           console.warn("AI 返回数据结构不完整", aiResult);
           throw new Error("Validation Failed: Missing required fields");
        }

      } catch (aiError) {
        console.error("AI 生成/解析失败，启用错误恢复模式:", aiError);
        // 🔥 只要出错，就赋值错误状态，让前端显示 ErrorView
        aiResult = { isError: true };
      }
      
      // --- C. 数据合并 & 保存 ---
      const finalReport = {
          ...aiResult, 
          userName: currentUserName,
          cityVisits: accurateCityVisits,
          habits: habits,
          extraStats: extraStats,
          credits: {
              actors: sortedActors,
              venues: venueStats 
          }
      };

      if (userId) {
          console.log("Saving report for user:", userId);
          await saveUserReport(userId, finalReport);
      } else {
          console.warn("未找到 userId，报告仅在本地显示，不会保存到数据库。");
      }
      
      // 💾 这里只写一次保存动作，删掉你原本代码里重复的那一行 saveUserReport
      console.log("Saving report status for user:", userId);
      await saveUserReport(userId, finalReport);

      // 🚀 更新状态：这会触发步骤 1 中的 useEffect
      // 如果 aiResult 是错误状态，此时弹窗会自动跳出
      setReportData(finalReport);
      
      setNotification('success');

    } catch (err) {
      console.error("Critical System Error:", err);
      alert("系统严重错误，请检查网络连接");
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