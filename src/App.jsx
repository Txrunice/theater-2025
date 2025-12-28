import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, Ticket, Search, Loader2, Map as MapIcon, CalendarRange, List, Sparkles, Users, LogOut } from 'lucide-react'; // 引入了 LogOut
import { supabase } from './supabase';

import StatsBoard from './components/StatsBoard';
import DramaCard from './components/DramaCard';
import TicketStub from './components/TicketStub';
import EditorModal from './components/EditorModal';
import MapDashboard from './components/MapDashboard';
import TimelineView from './components/TimelineView';
import ActorView from './components/ActorView';
import Auth from './components/Auth'; // 引入 Auth 组件
import WelcomeCurtain from './components/WelcomeCurtain'; 

import AdminDashboard from './components/AdminDashboard'; // 1. 引入后台组件
const ADMIN_EMAIL = "txrun2004@163.com"; // 2. ⚠️ 这里改成你的管理员邮箱

// === BigHeader 组件 (保持不变) ===
const BigHeader = () => (
  <motion.header 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className="relative min-h-[50vh] w-full flex flex-col justify-center items-center overflow-hidden"
  >
    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none overflow-hidden">
       <div className="absolute w-[800px] h-[800px] border border-dashed border-white/20 rounded-full animate-[spin_60s_linear_infinite]" />
       <div className="absolute w-[600px] h-[600px] border border-white/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
       <div className="absolute w-[400px] h-[400px] bg-gradient-radial from-cinnabar/10 via-transparent to-transparent blur-3xl" />
    </div>
    <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-cinnabar/20 to-transparent blur-[120px] pointer-events-none" />
    <div className="relative z-10 text-center px-4 w-full max-w-4xl mt-10">
      <div className="flex items-center justify-center gap-4 mb-6 opacity-60">
        <Sparkles size={12} className="text-gold" />
        <span className="text-[10px] md:text-xs font-mono text-gold tracking-[0.6em] uppercase">Digital Collection</span>
        <Sparkles size={12} className="text-gold" />
      </div>
      <h1 className="text-9xl md:text-[10rem] font-serif font-black text-white mb-4 drop-shadow-2xl tracking-tighter leading-none relative inline-block">
        <span className="relative z-10 mix-blend-overlay opacity-50">20</span>
        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-cinnabar-glow to-cinnabar">25</span>
        <span className="absolute top-1 left-1 text-cinnabar/20 blur-sm -z-10 select-none">2025</span>
      </h1>
      <div className="flex flex-col items-center mt-2">
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4"></div>
        <p className="text-paper-200/80 font-serif text-sm md:text-base tracking-[0.4em] uppercase font-bold text-shadow-sm">"All the world's a stage"</p>
      </div>
    </div>
  </motion.header>
);

// === 主组件 ===
export default function App() {
  const [session, setSession] = useState(null); // 添加 session 状态
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [galleryMode, setGalleryMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditing, setCurrentEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAsAdmin, setViewAsAdmin] = useState(true); // 3. 默认优先看后台

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  // 1. 初始化鉴权监听
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchPlays(); // 如果有session直接获取数据
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

      // 👇👇👇 这里的逻辑必须和 Auth.jsx 里的 key 保持一致 ('SHOW_WELCOME') 👇👇👇
      if (_event === 'SIGNED_IN' && session) {
        // 检查口袋里有没有刚才 Auth.jsx 塞进去的票
        if (sessionStorage.getItem('SHOW_WELCOME') === 'true') {
          const name = session.user?.user_metadata?.display_name || '观众';
          setWelcomeName(name);
          setShowWelcome(true);
          
          // ⚠️ 检票进场后，立刻销毁票据，防止刷新重复显示
          sessionStorage.removeItem('SHOW_WELCOME'); 
        }
      }
      
      setSession(session);
      if (session) fetchPlays();
      else setPlays([]); // 登出清空数据
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlays = async () => {
    setLoading(true);
    // RLS 会自动处理只获取当前用户的数据
    const { data, error } = await supabase.from('plays').select('*').order('date', { ascending: false });
    if (!error) setPlays(data || []);
    setLoading(false);
  };

  const handleSave = () => { setIsModalOpen(false); fetchPlays(); };
  
  const handleDelete = async (id) => {
    if(window.confirm("确定要删除这条记录吗？")) {
      await supabase.from('plays').delete().eq('id', id);
      setPlays(plays.filter(p => p.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 如果没有登录，显示 Auth 界面
  if (!session) {
    return <Auth />;
  }

  // === 4. 插入管理员逻辑 ===
  const isUserAdmin = session.user.email === ADMIN_EMAIL;

  // 如果是管理员，并且处于后台模式，直接显示后台
  if (isUserAdmin && viewAsAdmin) {
    return (
      <>
        <AdminDashboard session={session} onLogout={handleLogout} />
        {/* 悬浮按钮：让管理员能切换去前台看看 */}
        <button 
          onClick={() => setViewAsAdmin(false)}
          className="fixed bottom-6 right-6 z-[100] bg-cinnabar text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs hover:scale-105 transition-transform"
        >
          预览前台视图
        </button>
      </>
    );
  }
  // ========================================

  const filteredPlays = plays.filter(play => 
    (play.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'gallery', label: '剧目列表', icon: List },
    { id: 'actors', label: '演员', icon: Users },
    { id: 'timeline', label: '时间轴', icon: CalendarRange },
    { id: 'map', label: '足迹', icon: MapIcon },
  ];

  const isHome = activeTab === 'home';

  return (
    <div className="min-h-screen pb-20 selection:bg-cinnabar selection:text-white bg-[#0b0c10]">
      {/* 4. 欢迎幕布动画 */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeCurtain 
            displayName={welcomeName} 
            onAnimationComplete={() => setShowWelcome(false)} 
          />
        )}
      </AnimatePresence>


      {/* 5. 前台界面的悬浮按钮：切回后台 */}
      {isUserAdmin && (
        <button 
            onClick={() => setViewAsAdmin(true)}
            className="fixed top-4 right-20 z-[60] bg-zinc-800/80 backdrop-blur text-zinc-300 border border-zinc-600 px-3 py-1.5 rounded text-xs font-mono hover:bg-zinc-700 transition-colors"
        >
            ADMIN CONSOLE
        </button>
      )}
      
      <AnimatePresence>
        {isHome && <BigHeader />}
      </AnimatePresence>

      <div className={`z-50 transition-all duration-500 ease-in-out flex justify-center w-full ${isHome ? 'relative -mt-8 mb-12' : 'sticky top-4 mb-6'}`}>
        <div className={`
          flex items-center justify-between transition-all duration-500
          ${isHome 
            ? 'bg-[#0b0c10]/80 border-white/10 p-1.5 pl-3 min-w-[340px] md:min-w-[600px]' 
            : 'bg-[#0b0c10]/90 border-white/20 p-2 pl-4 w-[95%] max-w-[1400px] shadow-2xl shadow-black/50'
          }
          backdrop-blur-xl border rounded-full
        `}>
           <div className="flex items-center gap-4">
             <AnimatePresence>
               {!isHome && (
                 <motion.button
                   initial={{ opacity: 0, width: 0, x: -20 }}
                   animate={{ opacity: 1, width: 'auto', x: 0 }}
                   exit={{ opacity: 0, width: 0, x: -20 }}
                   onClick={() => setActiveTab('home')}
                   className="flex items-center gap-2 pr-4 border-r border-white/10 mr-1 group overflow-hidden whitespace-nowrap"
                 >
                    <div className="bg-gradient-to-br from-cinnabar to-red-900 text-white p-1.5 rounded-full shadow-lg group-hover:rotate-12 transition-transform">
                      <Sparkles size={14} />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] text-gold tracking-widest font-mono">THEATER</span>
                      <span className="text-sm font-serif font-bold text-white tracking-wide">2025</span>
                    </div>
                 </motion.button>
               )}
             </AnimatePresence>

             <div className="flex gap-1">
               {tabs.map((tab) => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`relative px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold tracking-wide rounded-full transition-all duration-300 ${
                     activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   {activeTab === tab.id && (
                     <motion.div 
                       layoutId="tab-bg" 
                       className="absolute inset-0 bg-gradient-to-b from-ink-800 to-ink-900 border border-white/10 rounded-full shadow-inner" 
                       transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
                     />
                   )}
                   <span className="relative z-10 flex items-center gap-2">
                     <tab.icon size={15} className={activeTab === tab.id ? "text-cinnabar-glow" : ""} />
                     <span className={`${!isHome ? 'hidden md:inline' : 'inline'}`}>{tab.label}</span>
                   </span>
                 </button>
               ))}
             </div>
           </div>

           <div className="flex items-center gap-2 pr-1">
              {(activeTab === 'gallery' || isHome) && (
                 <div className={`hidden md:flex items-center bg-black/30 rounded-full px-3 py-2 border border-white/5 focus-within:border-cinnabar/50 transition-colors mr-1 ${isHome ? '' : 'w-40'}`}>
                   <Search size={13} className="text-gray-500 mr-2" />
                   <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      className="bg-transparent border-none outline-none text-xs text-white w-20 focus:w-full transition-all placeholder-gray-600" 
                      placeholder="搜索剧目..."
                   />
                 </div>
              )}
              <button 
                onClick={() => { setCurrentEditing(null); setIsModalOpen(true); }} 
                className="bg-cinnabar hover:bg-cinnabar-glow text-white p-2.5 rounded-full shadow-[0_0_15px_rgba(192,57,43,0.4)] transition-all hover:rotate-90 hover:scale-110 active:scale-95"
              >
                <Plus size={18} />
              </button>
              
              {/* 退出登录按钮 */}
              <button 
                onClick={handleLogout}
                className="ml-2 text-zinc-500 hover:text-white transition-colors"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
           </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <Loader2 className="animate-spin text-cinnabar mb-4" size={40}/>
            <p className="text-xs text-gray-500 tracking-widest font-serif">正在读取档案...</p>
          </div>
        ) : (
          <AnimatePresence mode='wait'>
            {isHome && (
              <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                 <StatsBoard 
                  plays={plays}
                  userId={session?.user?.id}
                 />
                 <div className="mt-20 text-center opacity-30">
                    <p className="text-[10px] font-mono tracking-[0.5em] text-white">SELECT A TAB TO START</p>
                 </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <div className="flex justify-between items-end mb-8 px-2 max-w-7xl mx-auto border-b border-white/5 pb-4 mt-4">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-3xl font-serif text-white/90">剧目存档</h2>
                      <span className="text-xs text-cinnabar font-mono border border-cinnabar/30 px-2 py-0.5 rounded bg-cinnabar/10">共 {filteredPlays.length} 部</span>
                    </div>
                    <div className="flex bg-ink-900 p-1 rounded-lg border border-white/5">
                       <button onClick={() => setGalleryMode('grid')} className={`p-2 rounded transition-colors ${galleryMode === 'grid' ? 'bg-ink-800 text-white shadow' : 'text-gray-600 hover:text-gray-400'}`}><LayoutGrid size={16} /></button>
                       <button onClick={() => setGalleryMode('ticket')} className={`p-2 rounded transition-colors ${galleryMode === 'ticket' ? 'bg-ink-800 text-white shadow' : 'text-gray-600 hover:text-gray-400'}`}><Ticket size={16} /></button>
                    </div>
                 </div>

                 {filteredPlays.length === 0 ? (
                   <div className="text-center text-gray-600 py-32">
                     <p className="font-serif text-xl italic mb-2">暂无记录</p>
                     <p className="text-xs font-mono">NO DATA FOUND</p>
                   </div>
                 ) : (
                   galleryMode === 'grid' ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 max-w-7xl mx-auto pb-20">
                       {filteredPlays.map(p => <DramaCard key={p.id} data={p} onEdit={(d) => {setCurrentEditing(d); setIsModalOpen(true)}} onDelete={handleDelete} />)}
                     </div>
                   ) : (
                     <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
                       {filteredPlays.map(p => <TicketStub key={p.id} data={p} onEdit={(d) => {setCurrentEditing(d); setIsModalOpen(true)}} />)}
                     </div>
                   )
                 )}
              </motion.div>
            )}

            {activeTab === 'actors' && (
              <motion.div key="actors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ActorView plays={plays} />
              </motion.div>
            )}

            {activeTab === 'timeline' && <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><TimelineView plays={plays} /></motion.div>}
            
            {activeTab === 'map' && <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><MapDashboard plays={plays} /></motion.div>}

          </AnimatePresence>
        )}
      </main>

      {/* 将当前用户 ID 传给 Modal */}
      <EditorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        play={currentEditing} 
        onSave={handleSave} 
        allPlays={plays} 
        userId={session.user.id} 
      />
    </div>
  );
}