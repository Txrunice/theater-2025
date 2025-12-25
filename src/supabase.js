import { createClient } from '@supabase/supabase-js'

// ⚠️ 替换成你自己的 Supabase URL 和 Anon Key
const supabaseUrl = 'https://gmvqnqvzmsxgntggobtb.supabase.co'
const supabaseKey = 'sb_publishable_mR2aOGvkhLvY_zZjZ6c4FQ_kGkuu8OV'

export const supabase = createClient(supabaseUrl, supabaseKey)