import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronLeft, Upload, Loader2, Save, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '../supabase';
import TicketStub from './TicketStub'; // 复用你的票根组件

export default function ActorView({ plays }) {
  const [selectedActor, setSelectedActor] = useState(null); // 当前选中的演员名字
  
  // 1. 提取所有演员并统计出演次数（已修正：同一部戏多角色只算一次）
  const actorStats = React.useMemo(() => {
    const stats = {};
    
    plays.forEach(play => {
      // === 判断是否为演唱会 ===
      const isConcert = play.category === '演唱会' || play.type === '演唱会' || play.title?.includes('演唱会');
      
      const weightVal = isConcert ? 0.1 : 1;
      const countVal = isConcert ? 1 : 1;

      // === 修改核心：使用 Set 在单部剧集内去重 ===
      const uniqueActorsInPlay = new Set();

      if (play.cast_list && Array.isArray(play.cast_list)) {
        play.cast_list.forEach(cast => {
          if (cast.name) {
            // 这里只收集名字，不立即统计，利用 Set 特性自动去重
            uniqueActorsInPlay.add(cast.name);
          }
        });
      }

      // === 遍历去重后的演员名单进行统计 ===
      uniqueActorsInPlay.forEach(actorName => {
        if (!stats[actorName]) {
          stats[actorName] = { weight: 0, count: 0 };
        }
        // 累加权重和显示场数（现在一部剧只会被加一次）
        stats[actorName].weight += weightVal;
        stats[actorName].count += countVal;
      });
    });

    // 转为数组 -> 过滤掉权重 < 0.5 的 -> 按权重从大到小排序
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .filter(actor => actor.weight >= 0.5) 
      .sort((a, b) => b.weight - a.weight);
  }, [plays]);

  return (
    <div className="max-w-7xl mx-auto min-h-[60vh]">
      <AnimatePresence mode="wait">
        {!selectedActor ? (
          <ActorList key="list" actors={actorStats} onSelect={setSelectedActor} />
        ) : (
          <ActorDetail 
            key="detail" 
            name={selectedActor} 
            // 详情页逻辑不变：依然传入包含演唱会在内的所有相关演出
            plays={plays.filter(p => p.cast_list?.some(c => c.name === selectedActor))}
            onBack={() => setSelectedActor(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 子组件：演员列表墙
function ActorList({ actors, onSelect }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-8 border-l-4 border-yellow-600 pl-4">
        <h2 className="text-3xl font-serif text-white">演员名录</h2>
        <p className="text-zinc-500 text-sm mt-1">
          {/* 这里显示的数字是过滤后的有效演员数量 */}
          共收录 {actors.length} 位表演艺术家
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {actors.map((actor) => (
          <div 
            key={actor.name}
            onClick={() => onSelect(actor.name)}
            className="group bg-[#161616] border border-white/5 hover:border-yellow-600/50 rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-900/20"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-yellow-900/20 group-hover:text-yellow-500 transition-colors">
                 <User size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold truncate w-full max-w-[120px]">{actor.name}</h3>
                {/* 这里只显示计算后的场数，不显示权重 */}
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {actor.count} 部作品
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// 子组件：演员详情页（包含简介编辑 + 票根墙）
function ActorDetail({ name, plays, onBack }) {
  const [profile, setProfile] = useState({ bio: '', image: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    fetchProfile();
  }, [name]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase.from('actors').select('*').eq('name', name).single();
    if (data) {
      setProfile(data);
    } else {
      setProfile({ bio: '', image: '' });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('actors').upsert({
      name: name,
      bio: profile.bio,
      image: profile.image
    }, { onConflict: 'name' });
    
    setSaving(false);
    setIsEditing(false);
    if (error) alert('保存失败: ' + error.message);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileName = `actor_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error } = await supabase.storage.from('posters').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
      
      const newUrl = data.publicUrl;
      setProfile(prev => ({ ...prev, image: newUrl }));
      
      await supabase.from('actors').upsert({
        name: name,
        bio: profile.bio,
        image: newUrl
      }, { onConflict: 'name' });

    } catch (error) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={18} className="mr-1"/> 返回列表
      </button>

      {/* 顶部：档案卡片 */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 blur-[100px] pointer-events-none"/>

        {/* 头像区域 */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <div 
            onClick={() => fileInputRef.current.click()}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-dashed border-zinc-700 hover:border-yellow-600 cursor-pointer overflow-hidden relative group"
          >
            {profile.image ? (
              <img src={profile.image} className="w-full h-full object-cover" alt={name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                <User size={40} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="animate-spin text-white"/> : <Upload className="text-white"/>}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-serif font-bold text-white mb-2">{name}</h1>
              <div className="flex items-center gap-2 text-yellow-600/80 text-sm font-mono mb-4">
                <Trophy size={14}/>
                {/* 详情页顶部的统计：这里显示的是传进来的全部列表长度（包含演唱会） */}
                <span>已收录演出 {plays.length} 场</span>
              </div>
            </div>
            <button 
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              className="text-xs border border-white/20 hover:bg-white/10 text-zinc-300 px-3 py-1.5 rounded flex items-center gap-2 transition-all"
            >
              {isEditing ? (saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>) : <Sparkles size={12}/>}
              {isEditing ? '保存档案' : '编辑资料'}
            </button>
          </div>

          {isEditing ? (
            <textarea 
              value={profile.bio || ''}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              placeholder="输入演员简介..."
              className="w-full h-32 bg-black/30 border border-white/10 rounded-lg p-3 text-zinc-300 text-sm focus:border-yellow-600 outline-none resize-none"
            />
          ) : (
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {profile.bio || "暂无简介信息，点击右上角编辑添加..."}
            </div>
          )}
        </div>
      </div>

      {/* 底部：票根墙 */}
      <h3 className="text-xl font-serif text-white mb-6 pl-2 border-l-2 border-yellow-600">演出履历</h3>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {plays.map(play => (
          <TicketStub key={play.id} data={play} onEdit={() => {}} />
        ))}
      </div>
    </motion.div>
  );
}