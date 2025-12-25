// supabase/functions/analyze-program/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 定义跨域头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 1. 处理浏览器的预检请求 (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. 获取前端传来的图片和分类
    const { imageBase64, category } = await req.json()
    
    // 3. 从环境变量获取 Key
    // 注意：VS Code 如果没装 Deno 插件，这里 Deno 会报红，但不影响运行
    const apiKey = Deno.env.get('SILICONFLOW_KEY')
    if (!apiKey) {
      throw new Error('Server API Key not configured')
    }

    // 4. 调用 SiliconFlow API
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `请分析这张${category || '演出'}的演员表/节目单图片。
                提取所有的'姓名'和'饰演角色(或曲目)'。
                请严格按照以下文本格式输出，每行一个，不要输出任何其他文字：
                姓名:角色
                姓名:角色` 
              },
              { 
                type: "image_url", 
                image_url: { url: imageBase64 } 
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.1
      })
    });

    const data = await response.json();

    // 5. 如果 AI 报错
    if (!response.ok) {
        throw new Error(data.error?.message || "AI Service Error");
    }

    // 6. 返回结果给前端
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // 强制类型转换为 Error 以解决 ts(18046)
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})