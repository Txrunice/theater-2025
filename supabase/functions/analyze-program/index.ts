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
// 3. 工具函数：计算习惯 (Top City & Busy Day)
// ==========================================
function calculateHabits(records: any[]) {
    const cityCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
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
    

    // =========================================================
// 模式 2: 根据剧名生成颜色建议
// =========================================================

else if (action === 'suggest_color') {
   model = "deepseek-ai/DeepSeek-V3";
   maxTokens = 50;
   temperature = 0.6; 
   systemPrompt = `你是一位擅长色彩心理学的视觉设计师，需要为戏剧海报推荐主题色。请根据用户提供的“剧目名称”和“分类”，分析其内容意象，推荐一个最能传达该剧氛围的主题色（Hex Color）。请严格遵循以下要求

   设计逻辑：
   1. 🌈 色彩多样性原则
    - 每个推荐必须唯一，避免重复使用相同色系
    - 探索小众但高级的色调（如：灰调莫兰迪色/荧光色/渐变过渡色）
    - 允许混合色（例如蓝绿色#0D98BA）和实验色（紫红色#C71585）

  2. 深度语义分析法（禁止关键字匹配）
    - 第一步：解析剧目核心情感（示例："悲剧"=沉重感→选择有历史质感的浊色调）
    - 第二步：提取视觉元素（示例："海"→不止深蓝，可推荐带灰度的海沫绿#9FE2BF）
    - 第三步：考虑受众感知（青春剧避免暗色，用活力珊瑚橙#FF7F50）

  3. 严禁约束
    - ✖ 禁止输出任何文字解释
    - ✖ 禁止重复最近3次推荐过的颜色

  4. 输出规范
    - 仅输出6位大写Hex代码（如：#E6E6FA）
    - 必须是网页安全色
    - 优先选择有故事感的色调（例如：战争剧→弹药黑#1B1B1B 而非纯黑）
    - 颜色要耐看，适合做背景`


   userContent = [
     { type: "text", text: `剧名：${title}\n分类：${category}\n请给出海报主题色：` }
   ]
}

// =========================================================
// 模式 3: 识别图片演员表 (原功能 - 保持 Qwen-VL 和原 Prompt)
// =========================================================
else {
   model = "Qwen/Qwen2.5-VL-72B-Instruct";
   maxTokens = 4096;
   temperature = 0.1;
   systemPrompt = ""; 
   userContent = [
     { 
       type: "text", 
       text: `请分析这张${category || '演出'}的演员表/节目单图片。
       提取所有的'姓名'和'饰演角色(或曲目)'。
       请严格按照以下文本格式输出，每行一个，不要输出任何其他文字：
       姓名:角色
       姓名:角色` 
     },
     { type: "image_url", image_url: { url: imageBase64 } }
   ]
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
            
            // 4. 计算 accurate city visits
            const accurateCityVisits = getCityVisits(records || []);

            // 5  计算 accurate habits (Top City, Busy Day)
            // 这行代码会覆盖 AI 算错或没算出来的 "未知"
            reportObj.habits = calculateHabits(records || []);

            // 注入数据
            reportObj.cityVisits = accurateCityVisits; // 修复地图数据
            
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