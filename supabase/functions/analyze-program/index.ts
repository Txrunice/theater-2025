import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    // 获取 action 类型
    const { action = 'extract_cast', imageBase64, category, title, records, year } = requestData
    
    const apiKey = Deno.env.get('SILICONFLOW_KEY')
    if (!apiKey) throw new Error('Server API Key not configured')

    let systemPrompt = ""
    let userContent = []
    let model = ""
    let maxTokens = 2048
    let temperature = 0.1

    // =========================================================
    // 模式 1: 生成年度报告 (新功能 - 使用 DeepSeek-V3)
    // =========================================================
    if (action === 'generate_report') {
      model = "deepseek-ai/DeepSeek-V3"; 
      maxTokens = 4096;
      temperature = 0.7; // 稍微高一点的温度，让文案更生动

      systemPrompt = `你是一位敏锐的数据艺术家和戏剧评论家。请分析用户的年度观演记录（JSON），生成一份富有洞察力且情感充沛的年度报告（JSON格式）。

      请分析以下维度（若某项数据不足，请根据现有数据合理推断或留空）：
      1. **概览**: 总场次、总花费、击败了全球多少%的观众（基于场次瞎编一个合理的百分比，如 80%-99%）。
      2. **首尾呼应**: 
         - firstPlay: 今年看的第一部剧（作为“入坑之作”）。
         - lastPlay: 今年看的最后一部剧（作为“收官之作”）。
      3. **时间密码**: 
         - busyDay: 统计周一到周日，哪一天看剧最多（如“周六”）。
         - favCity: 去了哪个城市最多。
         - totalCities: 去了几个城市。
      4. ** hiddenGem (遗珠)**: 找出一部价格较低但评分较高，或者比较冷门的剧。
      5. ** topFavorite (年度之最)**: 评分最高的剧及推荐理由。
      6. ** keywordCloud**: 提取 6-8 个年度关键词（如：悲剧、先锋、二刷、远征、泪目、值回票价等）。
      7. ** genreStats**: 剧种分布。
      8. ** userLabel**: 年度称号。
      9. ** letter**: 给用户的一封信（300字左右，结合上述数据，深情款款）。

      请严格只输出 JSON 格式，不要 Markdown 标记，结构如下：
      {
        "summary": { "totalCount": Number, "totalCost": Number, "beatPercent": Number },
        "timeline": { 
            "firstPlay": { "title": "String", "date": "String", "comment": "一句话点评" }, 
            "lastPlay": { "title": "String", "date": "String", "comment": "一句话点评" } 
        },
        "habits": { "busyDay": "String", "favCity": "String", "totalCities": Number },
        "picks": {
            "top": { "title": "String", "reason": "String" },
            "hidden": { "title": "String", "reason": "性价比/冷门惊喜理由" }
        },
        "stats": {
            "genres": [ {"name": "String", "count": Number, "percent": Number} ],
            "keywords": ["String", "String", "String", "String", "String", "String"]
        },
        "userLabel": "String",
        "letter": "String"
      }`;

      const simplifiedRecords = records.map((r: any) => ({
        title: r.title,
        date: r.date,
        dayOfWeek: new Date(r.date).toLocaleDateString('zh-CN', { weekday: 'long' }),
        city: r.city,
        price: r.price,
        category: r.category,
        rating: r.rating
      }));

      userContent = [
        { type: "text", text: `年份：${year}\n记录：${JSON.stringify(simplifiedRecords)}` }
      ]
    }
    // =========================================================
    // 模式 2: 根据剧名生成颜色 (原功能 - 改用 DeepSeek-V3)
    // =========================================================

    else if (action === 'suggest_color') {
       model = "deepseek-ai/DeepSeek-V3";
       maxTokens = 50;
       // 🔴 关键修改1：提高随机性，让色彩更丰富
       temperature = 0.8; 

       // 🔴 关键修改2：优化提示词，强制要求根据语义分析，并禁止滥用红色
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
       // 必须用视觉模型
       model = "Qwen/Qwen2.5-VL-72B-Instruct";
       maxTokens = 2048;
       temperature = 0.1;
       systemPrompt = ""; // 原代码这里是空的，指令写在 userContent 里

       // 恢复原来的 User Prompt
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
            : [{ role: "user", content: userContent }], // 兼容 Qwen-VL 可能不需要 system role 的情况
        max_tokens: maxTokens,
        temperature: temperature,
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "AI Service Error");
    }

    let content = data.choices[0].message.content;
    
    // 如果是报告模式，清理一下可能存在的 markdown 符号
    if (action === 'generate_report') {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
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