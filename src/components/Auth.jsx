import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  // 原有的通用图标
  Sparkles, Loader2, Mail, Lock, KeyRound, 
  ArrowLeft, User, Eye, EyeOff, AlertCircle, 
  // 左侧需要的图标 (新增 FileEdit)
  Ticket, Map, CalendarRange, BarChart3, FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [uiState, setUiState] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // 注册特有状态
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // 表单字段
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // 1. 邮箱格式验证
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 倒计时逻辑
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // 2. 发送验证码
  const handleSendOtp = async () => {
    setError('');
    if (!validateEmail(email)) return setError('请输入有效的邮箱格式');
    if (password.length < 6) return setError('密码至少需要 6 位');
    if (!displayName) return setError('请输入昵称');

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (signUpError) throw signUpError;

      const identities = data?.user?.identities || [];
      if (data?.user && identities.length === 0) {
        setError('该邮箱已被占用，请尝试直接登录');
        setLoading(false);
        return;
      }

      setIsOtpSent(true);
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // ✅ 这个必须加！因为这一步只是发验证码，页面还没跳转，必须恢复按钮状态
    }
  };

  // 3. 最终提交验证码并注册
  const handleFinalRegister = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) return setError('请输入6位验证码');
    
    setLoading(true);
    // ✅✅✅ 改动点：先买票（写入标记），再去验票
    // 这样 App.jsx 监听到登录成功时，票已经在口袋里了
    sessionStorage.setItem('SHOW_WELCOME', 'true');
    
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (verifyError) throw verifyError;
      
      // 成功了保持 loading，App.jsx 会接管

    } catch (err) {
      setError('验证失败：' + err.message);
      // ❌❌❌ 改动点：如果失败了，把票撕掉，否则刷新页面会误判
      sessionStorage.removeItem('SHOW_WELCOME');
      setLoading(false);
    }
  };

  // 4. 登录逻辑
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // ✅✅✅ 改动点：点击登录瞬间，先放入标记
    sessionStorage.setItem('SHOW_WELCOME', 'true');
    
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (loginError) {
      setError('邮箱或密码错误');
      // ❌❌❌ 改动点：登录失败，取出标记
      sessionStorage.removeItem('SHOW_WELCOME');
      setLoading(false);
    }
    // 成功了保持 loading
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* 主容器 */}
      <div className="w-full max-w-[1000px] min-h-[640px] grid md:grid-cols-2 bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        
        {/* ================= 左侧：品牌视觉区 ================= */}
        <div className="hidden md:flex flex-col p-12 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden group">
          
          {/* 背景图 */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop')] opacity-20 grayscale bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          
          {/* 1. 顶部 Logo & Slogan */}
          <div className="relative z-10 mb-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-700/20 border border-red-500/30 p-2.5 rounded-xl backdrop-blur-sm">
                <Ticket className="text-red-500" size={24} />
              </div>
              <span className="text-xl font-bold text-white tracking-widest uppercase font-mono">Live Archive</span>
            </div>
            
            <h2 className="text-4xl font-bold text-white leading-[1.1] mb-6 font-sans">
              不要让掌声<br/>
              消散在<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">回忆里</span>
            </h2>
            
            <p className="text-zinc-400 text-sm leading-relaxed font-light border-l-2 border-red-800 pl-4">
              这里是你私人的演出博物馆。记录每一张票根，点亮你的观演地图，在年末重新回顾那些震撼灵魂的瞬间。
            </p>
          </div>

          {/* 2. 中部核心功能展示列表 (已添加“记录演出细节”) */}
          <div className="relative z-10 space-y-3 my-8">
            <FeatureItem icon={<FileEdit size={16}/>} text="深度记录演出细节 & 歌单" delay={0.1} />
            <FeatureItem icon={<CalendarRange size={16}/>} text="观演时间轴 & 日历" delay={0.2} />
            <FeatureItem icon={<Map size={16}/>} text="Live 足迹地图" delay={0.3} />
            <FeatureItem icon={<BarChart3 size={16}/>} text="生成专属年度观演报告" delay={0.4} highlight />
          </div>

          {/* 3. 底部作者署名 (新增) */}
          <div className="relative z-10 pt-6 border-t border-white/5">
             <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">
                <span>Created By</span>
                <span className="text-zinc-400 font-bold hover:text-red-500 transition-colors cursor-default">热情的冰冻生菜</span>
             </div>
          </div>
        </div>
        {/* ================= 左侧结束 ================= */}


        {/* ================= 右侧：表单交互区 (保持原样) ================= */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-[#0f0f0f]">
          <div className="max-w-sm mx-auto w-full">
            
            {/* Header */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white mb-2">{uiState === 'login' ? '欢迎登录' : '新用户注册'}</h3>
              <p className="text-zinc-500 text-xs tracking-wide">Enter your details to access your archive</p>
            </div>

            {/* 错误提示 */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 表单区域 */}
            <AnimatePresence mode="wait">
              {uiState === 'login' ? (
                <motion.form key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleLogin} className="space-y-4"
                >
                  <Input label="邮箱地址" icon={<Mail size={16}/>} type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
                  <Input label="密码" icon={<Lock size={16}/>} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="您的密码"
                    rightElement={<button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}
                  />
                  <button disabled={loading} className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20}/> : "登录"}
                  </button>
                  <div className="text-center pt-4">
                    <button type="button" onClick={()=>{setUiState('register'); setError('')}} className="text-xs text-zinc-500 hover:text-white transition-colors">
                      新用户？ <span className="text-red-500 font-bold ml-1">创建新账号</span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form key="reg" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  onSubmit={isOtpSent ? handleFinalRegister : (e)=>e.preventDefault()} className="space-y-4"
                >
                  <Input label="昵称" icon={<User size={16}/>} type="text" value={displayName} onChange={setDisplayName} placeholder="该如何称呼您？" disabled={isOtpSent} />
                  <Input label="邮箱" icon={<Mail size={16}/>} type="email" value={email} onChange={setEmail} placeholder="用于接收验证码" disabled={isOtpSent} />
                  <Input label="密码" icon={<Lock size={16}/>} type="password" value={password} onChange={setPassword} placeholder="至少 6 位字符" disabled={isOtpSent} />
                  
                  {/* 动态验证码区域 */}
                  <AnimatePresence>
                    {isOtpSent && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-2">
                        <Input label="6位验证码" icon={<KeyRound size={16}/>} type="text" value={otpCode} onChange={(v)=>setOtpCode(v.replace(/\D/g,''))} placeholder="000000" maxLength={6} className="text-center tracking-[0.5em] font-mono text-lg" />
                        <div className="flex justify-between items-center mt-2 px-1">
                          <span className="text-[10px] text-zinc-500">验证码已发送</span>
                          <button type="button" onClick={handleSendOtp} disabled={resendTimer > 0} className="text-[10px] text-red-500 hover:text-red-400 disabled:text-zinc-700">
                            {resendTimer > 0 ? `重发 (${resendTimer}s)` : "重新发送"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4">
                    {!isOtpSent ? (
                      <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full bg-red-600 text-white font-bold py-3.5 rounded-2xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20}/> : "获取验证码"}
                      </button>
                    ) : (
                      <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20}/> : "完成注册并进入"}
                      </button>
                    )}
                  </div>

                  <div className="text-center pt-2">
                    <button type="button" onClick={()=>{setUiState('login'); setIsOtpSent(false); setError('')}} className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center justify-center gap-2 mx-auto">
                      <ArrowLeft size={12} /> 已有账号？直接登录
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

// === 左侧功能列表项组件 ===
const FeatureItem = ({ icon, text, delay, highlight }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ delay: 0.5 + delay }}
    className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm transition-colors ${
      highlight 
        ? 'bg-red-500/10 border-red-500/30 text-white' 
        : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
    }`}
  >
    <div className={highlight ? "text-red-400" : "text-zinc-500"}>{icon}</div>
    <span className="text-xs font-medium tracking-wide">{text}</span>
    {highlight && <Sparkles size={12} className="ml-auto text-yellow-500 animate-pulse" />}
  </motion.div>
);

// === 通用输入框组件 ===
const Input = ({ label, icon, rightElement, value, onChange, className, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-red-500 transition-colors">
        {icon}
      </div>
      <input 
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);