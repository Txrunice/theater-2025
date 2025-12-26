import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ==========================================
// 1. 工具函数：计算准确的城市足迹 (你原本的代码)
// ==========================================
function getCityVisits(records: any[]) {
    const sorted = [...records].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const visits: { city: string; date: string }[] = [];
    
    sorted.forEach(record => {
        if (!record.city) return;
        if (visits.length === 0 || visits[visits.length - 1].city !== record.city) {
            visits.push({
                city: record.city,
                date: record.date
            });
        }
    });
    return visits;
}

// ==========================================
// 2. 新增工具函数：计算经济与生活统计 (修复前端报错的核心)
// ==========================================
function calculateStats(records: any[]) {
    let totalCost = 0;
    const monthCosts: Record<string, number> = {};
    let totalDuration = 0; // 估算时长

    records.forEach(r => {
        // 1. 金额统计
        const price = parseFloat(r.price) || 0;
        totalCost += price;

        // 2. 月份统计
        const date = new Date(r.date);
        if (!isNaN(date.getTime())) {
            const monthKey = `${date.getMonth() + 1}月`;
            monthCosts[monthKey] = (monthCosts[monthKey] || 0) + price;
        }

        // 3. 时长估算 (如果数据里没有 duration，默认一场戏 2.5 小时)
        // 也可以根据 r.category 微调，比如 "话剧" 2.5h, "音乐剧" 3h
        totalDuration += 2.5; 
    });

    // 找出消费最高的月份
    let maxMonth = "-";
    let maxMonthCost = 0;
    Object.entries(monthCosts).forEach(([month, cost]) => {
        if (cost > maxMonthCost) {
            maxMonthCost = cost;
            maxMonth = month;
        }
    });

    // 计算一些趣味数据
    // 假设 1 部电影 2 小时
    const movieCount = Math.floor(totalDuration / 2);
    // 假设看戏消耗热量：坐着看戏约 80kcal/h (基础代谢+脑力激荡)
    const caloriesBurned = Math.floor(totalDuration * 80); 
    // 换算成跑步公里数 (约 60kcal/km)
    const runDistance = (caloriesBurned / 60).toFixed(1);
    
    // 每周平均花费
    const weeksInYear = 52;
    const weeklyCost = (totalCost / weeksInYear).toFixed(0);

    return {
        time: {
            totalHours: totalDuration.toFixed(1),
            activityName: "电影",
            activityCount: movieCount
        },
        money: {
            totalCost: totalCost.toFixed(0),
            maxMonth: maxMonth,
            maxMonthCost: maxMonthCost.toFixed(0)
        },
        life: {
            costDisplay: weeklyCost,
            timeframeLabel: "Week",
            description: `这笔预算相当于你每周少喝 ${Math.max(1, Math.floor(Number(weeklyCost) / 35))} 杯咖啡，却换来了 ${records.length} 场灵魂的共振。`,
            energyText: `-${caloriesBurned} kcal`,
            runDistance: runDistance
        }
    };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { action = 'extract_cast', imageBase64, category, title, records, year } = requestData
    
    const apiKey = Deno.env.get('SILICONFLOW_KEY')
    if (!apiKey) throw new Error('Server API Key not configured')

    let systemPrompt = ""
    let userContent = []
    let model = ""
    let maxTokens = 2048
    let temperature = 0.1

    // =========================================================
    // 模式 1: 生成年度报告 (DeepSeek-V3)
    // =========================================================
    if (action === 'generate_report') {
      model = "deepseek-ai/DeepSeek-V3"; 
      maxTokens = 4096;
      temperature = 0.8; 

      // 注意：这里的 System Prompt 我删除了 extraStats 的相关指令，
      // 因为我们改为用代码计算，减少 AI 的幻觉和计算错误。
      systemPrompt = `你是一位深谙戏剧艺术的资深评论家。请根据用户的年度观演记录（JSON），生成一份富有洞察力、情感与专业度并存的年度报告（JSON格式）。

      【分析指令】
      1. **summary_text**: 用一句凝练的话总结这一年的观演状态。
      2. **timeline**: 
         - firstPlay: 入坑之作。
         - lastPlay: 收官之作。
      3. **monthly_story**: 挑选 2-3 个关键月份，描述那时的观剧心境变化，字数控制在 100 字以内。
      4. **theme_analysis (剧目主题回顾)**: 聚焦于剧目本身。总结今年看的戏主要集中在什么主题。
      5. **picks (精选)**:
         - **top**: 年度最佳。请结合用户的【评分】(rating)和【内容】进行分析。为什么给高分？
      6. **keywords**:  - 10个年度关键词。
      7. **userLabel (年度称号)**: 请根据用户的偏好创造一个有文学感的称号。
      8. **letter**: 一封温暖的信，字数300字左右。

      请严格只输出 JSON 格式，不要包含 Markdown 标记，结构如下：
      {
        "summary_text": "String",
        "timeline": { 
            "firstPlay": { "title": "String", "date": "String", "comment": "String" }, 
            "lastPlay": { "title": "String", "date": "String", "comment": "String" } 
        },
        "monthly_story": "String",
        "theme_analysis": { "title": "String", "content": "String" },
        "picks": {
            "top": { "title": "String", "reason": "String" }
        },
        "stats": {
            "keywords": ["String"]
        },
        "userLabel": "String",
        "letter": "String"
      }`;

      // 数据简化，节省 Token
      const simplifiedRecords = records.map((r: any) => ({
        title: r.title,
        date: r.date,
        city: r.city,
        rating: r.rating
      }));

      userContent = [
        { type: "text", text: `年份：${year}\n记录：${JSON.stringify(simplifiedRecords)}` }
      ]
    }
    
    // ... (模式 2 和 模式 3 的代码保持不变，省略以节省篇幅，请保留你原有的代码) ...
    else if (action === 'suggest_color') {
       // ... 保持你原有的 suggest_color 代码 ...
       model = "deepseek-ai/DeepSeek-V3";
       maxTokens = 50;
       temperature = 0.8;
       systemPrompt = `你是一位擅长色彩心理学的视觉设计师... (保持原样)`; // 略
       userContent = [{ type: "text", text: `剧名：${title}\n分类：${category}\n请给出海报主题色：` }];
    }
    else {
       // ... 保持你原有的 extract_cast 代码 ...
       model = "Qwen/Qwen2.5-VL-72B-Instruct";
       maxTokens = 2048;
       temperature = 0.1;
       systemPrompt = "";
       userContent = [
         { type: "text", text: `请分析这张${category || '演出'}的演员表... (保持原样)` },
         { type: "image_url", image_url: { url: imageBase64 } }
       ];
    }

    // === 发送请求 ===
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model, 
        messages: systemPrompt 
            ? [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }]
            : [{ role: "user", content: userContent }],
        max_tokens: maxTokens,
        temperature: temperature,
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "AI Service Error");
    }

    let content = data.choices[0].message.content;
    
    // =========================================================
    // 核心逻辑：数据清洗与合并 (Generate Report 专用)
    // =========================================================
    if (action === 'generate_report') {
        // 1. 清理 Markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            // 2. 解析 AI 返回的 JSON
            const reportObj = JSON.parse(content);
            
            // 3. 【新增】计算 accurate stats (Money, Life, Time)
            // 这里的 records 是前端传来的原始完整数据
            const computedStats = calculateStats(records || []);
            
            // 4. 【原有】计算 accurate city visits
            const accurateCityVisits = getCityVisits(records || []);

            // 5. 【原有】计算 accurate habits (busyDay, favCity)
            // 你之前的 habits 是 AI 生成的，这里建议也用代码算，或者简单处理
            // 为简单起见，这里我们补全 extraStats，并注入 cityVisits
            
            // 注入数据
            reportObj.extraStats = computedStats; // 修复前端 SlideEconomics 报错的关键
            reportObj.cityVisits = accurateCityVisits; // 修复地图数据
            
            // 如果 AI 漏掉了 habits，我们可以给一个默认值
            if (!reportObj.habits) {
                reportObj.habits = { busyDay: "周末", favCity: "未知", totalCities: 0 };
            }
            // 强制修正 totalCities
            reportObj.habits.totalCities = new Set(records.map((r:any) => r.city)).size;

            // 重新序列化
            content = JSON.stringify(reportObj);
        } catch (e) {
            console.error("JSON 解析或合并数据失败:", e);
            // 这里可以考虑返回一个兜底的 JSON，或者让前端处理错误
        }
    }

    return new Response(JSON.stringify({ ...data, result: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const err = error as Error;
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})