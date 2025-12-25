import { createClient } from '@supabase/supabase-js'

// 这里使用了 import.meta.env 读取刚才 .env 文件里的配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 如果这里读取不到，就会报你刚才那个错
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 环境变量未找到！请检查 .env 文件。")
}

export const supabase = createClient(supabaseUrl, supabaseKey)