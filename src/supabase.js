import { createClient } from '@supabase/supabase-js'

// 1. 初始化 Supabase 客户端 (保持你原有的逻辑)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 环境变量未找到！请检查 .env 文件。")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// 2. 新增：年度报告专用数据库操作函数
// ==========================================

/**
 * 保存年度报告到数据库
 * @param {string} userId - 用户ID
 * @param {object} reportData - 报告的 JSON 数据
 * @param {number} year - 年份，默认 2025
 */
export const saveUserReport = async (userId, reportData, year = 2025) => {
  if (!userId) {
    console.error("保存失败：未提供 userId");
    return;
  }

  // 使用 upsert：如果存在就更新，不存在就插入
  const { error } = await supabase
    .from('annual_reports')
    .upsert(
      { 
        user_id: userId, 
        year: year, 
        content: reportData,
        created_at: new Date().toISOString() 
      },
      { onConflict: 'user_id, year' } // 根据这两个字段判断是否重复
    );

  if (error) {
    console.error("❌ 保存年度报告失败:", error);
    throw error;
  }
  console.log("✅ 年度报告已同步至云端数据库");
};

/**
 * 获取用户的年度报告
 * @param {string} userId 
 * @param {number} year 
 * @returns {object|null} reportData or null
 */
export const fetchUserReport = async (userId, year = 2025) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('annual_reports')
    .select('content')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle(); // maybeSingle: 没找到时不报错，返回 null

  if (error) {
    console.error("❌ 获取年度报告失败:", error);
    return null;
  }

  return data ? data.content : null;
};