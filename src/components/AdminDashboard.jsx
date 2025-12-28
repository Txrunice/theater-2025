import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Search, 
  LogOut, 
  Trash2, 
  Edit3, 
  ChevronRight,
  ArrowLeft,
  Drama,
  User,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Save,
  Star,
  Image as ImageIcon,
  Globe,
  Database,
  Server,
  Bell,
  HardDrive,
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import EditorModal from './EditorModal';

// === 1. 侧边栏 ===
const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#0F0F12] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cinnabar to-red-800 rounded-lg flex items-center justify-center text-white font-bold font-serif">
          T
        </div>
        <div>
          <h1 className="text-white font-bold tracking-wide">THEATER</h1>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase">Admin System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </div>
  );
};

// === 2. 用户头像组件 ===
const UserAvatar = ({ userId, size = "sm" }) => {
  const color = '#' + userId.slice(0, 6);
  const sizeClasses = size === "lg" ? "w-12 h-12 text-sm" : "w-8 h-8 text-[10px]";
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0 ${sizeClasses}`} style={{ backgroundColor: color }}>
      {userId.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default function AdminDashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 数据状态
  const [plays, setPlays] = useState([]);
  const [userActors, setUserActors] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // 统计状态 (动态)
  const [stats, setStats] = useState({
      totalActors: 0,
      totalImages: 0,
      totalFavorites: 0,
      dbLatency: 0,
      lastBackup: new Date().toLocaleDateString() // 模拟: 实际上应该存数据库
  });

  // UI 状态
  const [selectedUser, setSelectedUser] = useState(null); 
  const [userSubTab, setUserSubTab] = useState('plays'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditing, setCurrentEditing] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // 设置状态 (初始化时尝试从 localStorage 读取)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('admin_settings');
    return saved ? JSON.parse(saved) : {
      maintenance: false,
      allowRegistration: true,
      emailAlerts: true,
      autoBackup: true,
      siteName: 'Theater 2025 Collection',
      maxUploadSize: '50',
    };
  });

  // === 核心数据获取 ===
  const fetchAllPlays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plays')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setPlays(data || []);
    setLoading(false);
  };

  // === 真实统计数据获取 ===
  const fetchDashboardStats = async () => {
    // 1. 测量延迟
    const start = performance.now();
    await supabase.from('plays').select('id').limit(1); // 轻量级 Ping
    const end = performance.now();
    const latency = Math.round(end - start);

    // 2. 获取演员总数 (使用 count 方法)
    const { count: actorCount } = await supabase
        .from('actors')
        .select('*', { count: 'exact', head: true });

    // 3. 获取更多演员细节 (为了统计图片和收藏，我们需要拉取数据)
    // 注意：如果数据量巨大，这里应该改写为后端 RPC，但现在前端计算即可
    const { data: allActors } = await supabase
        .from('actors')
        .select('image, is_favorite');
    
    const imageCount = allActors?.filter(a => a.image).length || 0;
    const favCount = allActors?.filter(a => a.is_favorite).length || 0;

    setStats(prev => ({
        ...prev,
        dbLatency: latency,
        totalActors: actorCount || 0,
        totalImages: imageCount,
        totalFavorites: favCount
    }));
  };

  // 获取特定用户的演员
  const fetchUserActors = async (userId) => {
    const { data, error } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (!error) setUserActors(data || []);
    else setUserActors([]);
  };

  // 初始化
  useEffect(() => {
    fetchAllPlays();
    fetchDashboardStats();
    
    // 设置一个定时器，每30秒刷新一次延迟
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // 监听 Tab 切换，懒加载
  useEffect(() => {
    if (selectedUser && userSubTab === 'actors') {
        fetchUserActors(selectedUser);
    }
  }, [selectedUser, userSubTab]);

  const handleDeletePlay = async (id) => {
    if (window.confirm('确认删除此剧目记录？')) {
      await supabase.from('plays').delete().eq('id', id);
      fetchAllPlays();
      fetchDashboardStats(); // 刷新统计
    }
  };

  const handleDeleteActor = async (id) => {
    if (window.confirm('确认删除此演员资料？')) {
      await supabase.from('actors').delete().eq('id', id);
      fetchUserActors(selectedUser);
      fetchDashboardStats(); // 刷新统计
    }
  };

  const handleEdit = (play) => {
    setCurrentEditing(play);
    setIsModalOpen(true);
  };

  const handleSaveSettings = () => {
    // 持久化到本地存储
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 算出唯一用户
  const uniqueUsers = Array.from(new Set(plays.map(p => p.user_id))).map(userId => {
    const userPlays = plays.filter(p => p.user_id === userId);
    return {
      id: userId,
      playCount: userPlays.length,
      lastActive: userPlays[0]?.date || 'Unknown',
      latestPlay: userPlays[0]?.title
    };
  });

  const filteredUsers = uniqueUsers.filter(u => 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUserPlays = selectedUser 
    ? plays.filter(p => p.user_id === selectedUser)
    : [];

  return (
    <div className="min-h-screen bg-black font-sans text-gray-300 flex">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSelectedUser(null); }} onLogout={onLogout} />

      <div className="flex-1 ml-64 p-8 relative">
        
        {/* 保存成功提示 */}
        {showToast && (
            <div className="fixed top-6 right-6 z-[100] bg-white text-black px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
                <CheckCircle2 size={20} className="text-green-600"/>
                <span className="font-bold text-sm">设置已更新并保存</span>
            </div>
        )}

        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'settings' ? 'System Settings' : 'User Management'}
              {selectedUser && (
                 <>
                   <ChevronRight size={20} className="text-gray-600" />
                   <span className="text-cinnabar">Detail View</span>
                 </>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
             <div className="text-right">
               <div className="text-sm text-white font-medium">Administrator</div>
               <div className="text-xs text-gray-500">{session.user.email}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white"><User size={20}/></div>
          </div>
        </header>

        {/* === 1. 仪表盘 (真实数据版) === */}
        {activeTab === 'dashboard' && (
           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-[#18181B] p-6 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">活跃用户</h3>
                        <p className="text-3xl text-white font-mono">{uniqueUsers.length}</p>
                    </div>
                    <div className="p-2 bg-blue-900/20 rounded text-blue-500"><Users size={20}/></div>
                  </div>
               </div>
               <div className="bg-[#18181B] p-6 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">剧目总数</h3>
                        <p className="text-3xl text-white font-mono">{plays.length}</p>
                    </div>
                    <div className="p-2 bg-purple-900/20 rounded text-purple-500"><Drama size={20}/></div>
                  </div>
               </div>
               <div className="bg-[#18181B] p-6 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">演员资料库</h3>
                        <p className="text-3xl text-white font-mono">{stats.totalActors}</p>
                    </div>
                    <div className="p-2 bg-green-900/20 rounded text-green-500"><User size={20}/></div>
                  </div>
               </div>
               <div className="bg-[#18181B] p-6 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">媒体资源</h3>
                        <p className="text-3xl text-white font-mono">{stats.totalImages}</p>
                    </div>
                    <div className="p-2 bg-orange-900/20 rounded text-orange-500"><ImageIcon size={20}/></div>
                  </div>
               </div>
             </div>

             {/* 数据库健康状态 */}
             <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Activity size={18} className="text-cinnabar"/> 
                        实时系统状态
                    </h3>
                    <button onClick={fetchDashboardStats} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12}/> Refresh Ping
                    </button>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/5">
                    <div className="p-6 text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">API Latency</div>
                        <div className={`text-2xl font-mono font-bold flex items-center justify-center gap-2 ${stats.dbLatency < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${stats.dbLatency < 100 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                            {stats.dbLatency} ms
                        </div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Global Favorites</div>
                        <div className="text-2xl text-white font-mono font-bold">{stats.totalFavorites}</div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Database Connection</div>
                        <div className="text-2xl text-green-400 font-mono font-bold">Active</div>
                    </div>
                </div>
             </div>
           </div>
        )}

        {/* === 2. 用户管理 === */}
        {activeTab === 'users' && (
          <>
            {!selectedUser ? (
              <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                 <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-medium flex items-center gap-2"><Users size={18}/> 用户列表</h3>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 w-64">
                       <Search size={14} className="text-gray-500" />
                       <input 
                         type="text" 
                         placeholder="搜索用户ID..." 
                         className="bg-transparent border-none outline-none text-xs text-white flex-1"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                       />
                    </div>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs text-gray-500 uppercase">
                       <tr>
                         <th className="px-6 py-4">用户</th>
                         <th className="px-6 py-4">剧目数量</th>
                         <th className="px-6 py-4">最近活跃</th>
                         <th className="px-6 py-4 text-right">操作</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {filteredUsers.map(user => (
                         <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <UserAvatar userId={user.id} />
                                  <div className="flex flex-col">
                                     <span className="text-sm text-white font-mono">User_{user.id.slice(0,6)}...</span>
                                     <span className="text-[10px] text-gray-600">{user.id}</span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-white font-mono">{user.playCount}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                               {user.lastActive}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button onClick={() => setSelectedUser(user.id)} className="px-3 py-1.5 bg-white/5 hover:bg-cinnabar hover:text-white rounded text-xs transition-all text-gray-300">管理详情</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 
                 <div className="bg-[#18181B] p-6 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <ArrowLeft size={20} className="text-gray-300"/>
                       </button>
                       <UserAvatar userId={selectedUser} size="lg" />
                       <div>
                          <h2 className="text-xl font-bold text-white mb-1">User_{selectedUser.slice(0,6)}...</h2>
                          <p className="text-xs text-gray-500 font-mono">{selectedUser}</p>
                       </div>
                    </div>
                    <div className="flex gap-4 text-center">
                       <div>
                          <div className="text-2xl font-bold text-white">{currentUserPlays.length}</div>
                          <div className="text-xs text-gray-500 uppercase">剧目总数</div>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-1 border-b border-white/10 pb-1">
                    <button onClick={() => setUserSubTab('plays')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${userSubTab === 'plays' ? 'border-cinnabar text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                      <Drama size={16}/> 剧目管理
                    </button>
                    <button onClick={() => setUserSubTab('actors')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${userSubTab === 'actors' ? 'border-cinnabar text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                      <User size={16}/> 演员管理
                    </button>
                 </div>

                 {userSubTab === 'plays' && (
                    <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-black/20 text-xs text-gray-500 uppercase">
                             <tr>
                               <th className="px-6 py-4">剧目名称 / ID</th>
                               <th className="px-6 py-4">地点</th>
                               <th className="px-6 py-4">时间</th>
                               <th className="px-6 py-4 text-right">操作</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {currentUserPlays.map(play => (
                               <tr key={play.id} className="group hover:bg-white/[0.02]">
                                  <td className="px-6 py-4">
                                     <div className="font-medium text-white">{play.title}</div>
                                     <div className="text-xs text-gray-600 font-mono">{play.id}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-400">
                                     {play.city} · {play.theater}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-400">
                                     {play.date}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(play)} className="p-1.5 hover:text-white hover:bg-white/10 rounded"><Edit3 size={16}/></button>
                                        <button onClick={() => handleDeletePlay(play.id)} className="p-1.5 hover:text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={16}/></button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                             {currentUserPlays.length === 0 && (
                               <tr><td colSpan="4" className="text-center py-8 text-gray-500">暂无剧目记录</td></tr>
                             )}
                          </tbody>
                        </table>
                    </div>
                 )}

                 {userSubTab === 'actors' && (
                    <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                        <thead className="bg-black/20 text-xs text-gray-500 uppercase">
                            <tr>
                            <th className="px-6 py-4">演员姓名</th>
                            <th className="px-6 py-4">收藏</th>
                            <th className="px-6 py-4">简介</th>
                            <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {userActors.map((actor) => (
                            <tr key={actor.id} className="hover:bg-white/[0.02]">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {actor.image ? (
                                            <img src={actor.image} alt={actor.name} className="w-8 h-8 rounded-full object-cover border border-white/10"/>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                                                <ImageIcon size={14}/>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-bold text-sm">{actor.name}</div>
                                            <div className="text-[10px] text-gray-600 font-mono">ID: {actor.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {actor.is_favorite ? (
                                        <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded w-fit">
                                            <Star size={12} fill="currentColor"/> 已收藏
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {actor.bio || <span className="text-gray-700 italic">无简介</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteActor(actor.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                            ))}
                            {userActors.length === 0 && (
                            <tr><td colSpan="4" className="text-center py-10 text-gray-500">暂无演员资料</td></tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                 )}
              </div>
            )}
          </>
        )}

        {/* === 3. 系统设置 (持久化版) === */}
        {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* 通用设置 */}
                   <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                       <div className="p-5 border-b border-white/5 flex justify-between items-center">
                           <h3 className="text-white font-bold flex items-center gap-2">
                               <Globe size={18} className="text-blue-400"/> 
                               通用设置
                           </h3>
                       </div>
                       <div className="p-6 space-y-4">
                           <div>
                               <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">站点名称 (Site Name)</label>
                               <input 
                                 type="text" 
                                 value={settings.siteName}
                                 onChange={e => setSettings({...settings, siteName: e.target.value})}
                                 className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-cinnabar outline-none"
                               />
                           </div>
                           <div className="flex items-center justify-between pt-2">
                               <div>
                                   <div className="text-white text-sm">邮件通知</div>
                                   <div className="text-xs text-gray-500">接收系统关键警报</div>
                               </div>
                               <button onClick={() => setSettings(s => ({...s, emailAlerts: !s.emailAlerts}))}>
                                   {settings.emailAlerts ? <ToggleRight size={28} className="text-cinnabar"/> : <ToggleLeft size={28} className="text-gray-600"/>}
                               </button>
                           </div>
                       </div>
                   </div>

                   {/* 安全设置 */}
                   <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                       <div className="p-5 border-b border-white/5">
                           <h3 className="text-white font-bold flex items-center gap-2">
                               <ShieldAlert size={18} className="text-cinnabar"/> 
                               访问控制
                           </h3>
                       </div>
                       <div className="p-6 space-y-6">
                           <div className="flex items-center justify-between">
                               <div>
                                   <div className="text-white text-sm">维护模式</div>
                                   <div className="text-xs text-gray-500">开启后普通用户无法登录</div>
                               </div>
                               <button onClick={() => setSettings(s => ({...s, maintenance: !s.maintenance}))}>
                                   {settings.maintenance ? <ToggleRight size={28} className="text-cinnabar"/> : <ToggleLeft size={28} className="text-gray-600"/>}
                               </button>
                           </div>
                           <div className="flex items-center justify-between">
                               <div>
                                   <div className="text-white text-sm">开放注册</div>
                                   <div className="text-xs text-gray-500">允许新用户创建账号</div>
                               </div>
                               <button onClick={() => setSettings(s => ({...s, allowRegistration: !s.allowRegistration}))}>
                                   {settings.allowRegistration ? <ToggleRight size={28} className="text-green-500"/> : <ToggleLeft size={28} className="text-gray-600"/>}
                               </button>
                           </div>
                       </div>
                   </div>
               </div>

               {/* 存储与数据 */}
               <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                   <div className="p-5 border-b border-white/5">
                       <h3 className="text-white font-bold flex items-center gap-2">
                           <HardDrive size={18} className="text-purple-400"/> 
                           数据概览
                       </h3>
                   </div>
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                           <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-400">演员资料图片</span>
                               <span className="text-white font-mono">{stats.totalImages} 张</span>
                           </div>
                           <div className="w-full bg-white/5 rounded-full h-2 mb-6">
                               <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(stats.totalImages, 100)}%` }}></div>
                           </div>
                           
                           <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-400">已收藏演员</span>
                               <span className="text-white font-mono">{stats.totalFavorites} 人</span>
                           </div>
                           <div className="w-full bg-white/5 rounded-full h-2">
                               <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(stats.totalFavorites, 100)}%` }}></div>
                           </div>
                       </div>
                       <div className="space-y-4 border-l border-white/5 pl-0 md:pl-8">
                           <div className="flex items-center justify-between">
                               <div>
                                   <div className="text-white text-sm">每日自动备份</div>
                                   <div className="text-xs text-gray-500">下次备份: 04:00 AM</div>
                               </div>
                               <button onClick={() => setSettings(s => ({...s, autoBackup: !s.autoBackup}))}>
                                   {settings.autoBackup ? <ToggleRight size={28} className="text-purple-500"/> : <ToggleLeft size={28} className="text-gray-600"/>}
                               </button>
                           </div>
                           <button className="w-full text-center py-2 border border-white/10 rounded text-xs hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                               清理系统缓存
                           </button>
                       </div>
                   </div>
               </div>

               <div className="flex justify-end pt-4">
                   <button 
                     onClick={handleSaveSettings}
                     className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                   >
                       <Save size={16}/> 保存所有更改
                   </button>
               </div>
           </div>
        )}
      </div>

      <EditorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        play={currentEditing} 
        onSave={() => { setIsModalOpen(false); fetchAllPlays(); }} 
        allPlays={plays}
        userId={selectedUser || session.user.id} 
      />
    </div>
  );
}