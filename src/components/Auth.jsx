import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Sparkles, Loader2, Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 🔴 关键修改：把 FormWrapper 移到了 Auth 函数外面
// 这样 React 就知道它是一个稳定的组件，不会在每次打字时重建它
const FormWrapper = ({ children, formKey }) => (
  <motion.div
    key={formKey} // 使用传入的 key
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  >
    {children}
  </motion.div>
);

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [uiState, setUiState] = useState('login'); // 'login' | 'register' | 'verifyOtp'
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // === 1. 处理登录 ===
  const handleLogin = async (e) => {
    e.preventDefault(); // 防止页面刷新
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  // === 2. 处理注册（发送验证码）===
  const handleRegister = async (e) => {
    e.preventDefault(); // 防止页面刷新
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUiState('verifyOtp');
    }
    setLoading(false);
  };

  // === 3. 处理验证码验证 ===
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); // 防止页面刷新
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup', 
    });
    if (error) {
      alert('验证码错误或过期: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-4 selection:bg-red-900 selection:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/20 blur-[120px]" />
      </div>

      <motion.div 
        layout
        className="relative z-10 w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-red-700 to-red-900 p-3 rounded-full shadow-lg">
               <Sparkles className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Theater Log</h1>
          <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase">Your Digital Stage Collection</p>
        </div>

        <AnimatePresence mode="wait">
          {/* === 登录界面 === */}
          {uiState === 'login' && (
            <FormWrapper formKey="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider pl-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2.5 pl-10 text-white focus:border-red-800 focus:ring-1 focus:ring-red-900 outline-none transition-all" 
                      placeholder="name@example.com" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider pl-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2.5 pl-10 text-white focus:border-red-800 focus:ring-1 focus:ring-red-900 outline-none transition-all" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 mt-6">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : '登 录'}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setUiState('register')} className="text-xs text-zinc-500 hover:text-white transition-colors">没有账号？点击注册</button>
                </div>
              </form>
            </FormWrapper>
          )}

          {/* === 注册界面 === */}
          {uiState === 'register' && (
            <FormWrapper formKey="register">
              <form onSubmit={handleRegister} className="space-y-4">
                 <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider pl-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2.5 pl-10 text-white focus:border-red-800 focus:ring-1 focus:ring-red-900 outline-none transition-all" 
                      placeholder="name@example.com" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider pl-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2.5 pl-10 text-white focus:border-red-800 focus:ring-1 focus:ring-red-900 outline-none transition-all" 
                      placeholder="设置你的密码" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : '注册并发送验证码'}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setUiState('login')} className="text-xs text-zinc-500 hover:text-white transition-colors">已有账号？返回登录</button>
                </div>
              </form>
            </FormWrapper>
          )}

          {/* === 验证码界面 === */}
          {uiState === 'verifyOtp' && (
            <FormWrapper formKey="verify">
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-zinc-400">验证码已发送至</p>
                  <p className="text-white font-mono mt-1">{email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider pl-1">Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <input 
                      type="text" 
                      required 
                      maxLength={6} 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value.trim())} 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2.5 pl-10 text-white focus:border-red-800 focus:ring-1 focus:ring-red-900 outline-none transition-all font-mono tracking-widest text-lg placeholder-zinc-700" 
                      placeholder="123456" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : '完成注册'}
                </button>
                <button type="button" onClick={() => setUiState('register')} className="w-full text-zinc-500 text-sm hover:text-white mt-4 flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft size={14} /> 返回修改邮箱或密码
                </button>
              </form>
            </FormWrapper>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}