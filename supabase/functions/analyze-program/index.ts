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
    // 获取 action 类型，默认为 cast_extraction (兼容旧逻辑)
    const { action = 'extract_cast', imageBase64, category, title } = requestData
    
    const apiKey = Deno.env.get('SILICONFLOW_KEY')
    if (!apiKey) throw new Error('Server API Key not configured')

    let systemPrompt = ""
    let userContent = []
    
    // === 模式 1: 根据剧名生成颜色 (新功能) ===
    if (action === 'suggest_color') {
       systemPrompt = `你是一个专业的平面设计师。请根据用户提供的“剧目名称”和“分类”，分析其情感基调，并推荐一个最合适的十六进制主题颜色代码（Hex Color）。
       
       规则：
       1. 只输出一个 Hex 代码（例如 #800020）。
       2. 不要输出任何其他解释性文字。
       3. 颜色应具有深沉、高级的质感，适合作为海报背景。`

       userContent = [
         { type: "text", text: `剧名：${title}\n分类：${category}\n请给出海报主题色：` }
       ]
    } 
    // === 模式 2: 识别图片演员表 (旧功能) ===
    else {
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

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct", // 这个模型同时支持纯文本和图片，非常方便
        messages: [
          { role: "system", content: systemPrompt }, 
          { role: "user", content: userContent }
        ],
        max_tokens: action === 'suggest_color' ? 50 : 2048, // 颜色生成只需要很少的 token
        temperature: 0.1
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "AI Service Error");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})