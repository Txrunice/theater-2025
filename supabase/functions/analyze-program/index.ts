import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 处理跨域预检请求
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
      temperature = 0.8; // 稍微提高创造力

      // System Prompt 保持专注于“感性分析”和“文案创作”
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
      6. **keywords**:  - 8个年度关键词。
      7. **userLabel (年度称号)**: 请根据用户的偏好创造一个有文学感的称号。
      8. **letter**: 一封温暖的信，字数500字左右。
       【重要约束】：
         - letter需要分段，请使用换行符分段。
         - 仅输出信件的正文内容。
         - 严禁包含任何开头的称呼（如“亲爱的观众”）。
         - 严禁包含任何结尾的落款、署名（如“此致”、“你的AI朋友”）或日期。
         - 因为前端会自动生成精美的信纸抬头和落款，你只需要提供中间的核心文字即可。

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
            "keywords": ["String", "String", "String", "String", "String", "String", "String", "String"]
        },
        "userLabel": "String",
        "letter": "String"
      }`;

      // 数据简化，只传 AI 分析需要的字段，节省 Token
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
    // 模式 3: 识别图片演员表 (Qwen-VL)
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
    // 简单的清理逻辑
    // =========================================================
    // 即使不在后端解析 JSON，去掉 Markdown 标记也是个好习惯，
    // 这样前端 JSON.parse 时不会因为 ```json ... ``` 而报错。
    if (action === 'generate_report') {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    // 直接返回结果，不做额外计算
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