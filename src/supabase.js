import { createClient } from '@supabase/supabase-js'

// 使用 import.meta.env 读取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)