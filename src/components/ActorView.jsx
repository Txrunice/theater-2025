import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronLeft, Upload, Loader2, Save, Sparkles, Trophy, Check, Heart, ChevronRight } from 'lucide-react'; 
import { supabase } from '../supabase';
import TicketStub from './TicketStub'; 
import imageCompression from 'browser-image-compression'; 
import Cropper from 'react-easy-crop';

export default function ActorView({ plays }) {
  const [selectedActor, setSelectedActor] = useState(null); 
  const [actorDataMap, setActorDataMap] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);

  // 1. 加载数据 - 增加 bio 字段查询
  useEffect(() => {
    const fetchActorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInitializing(false);
          return;
        }

        const { data } = await supabase
          .from('actors')
          .select('name, image, is_favorite, favorite_at, bio')
          .eq('user_id', user.id);

        if (data) {
          const map = {};
          data.forEach(item => {
            map[item.name] = item;
          });
          setActorDataMap(map);
        }
      } catch (error) {
        console.error("加载关注信息失败", error);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchActorData();
  }, []);

  // 2. 切换喜欢状态
  const toggleFavorite = async (actorName) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("请先登录");
      return;
    }
    const currentInfo = actorDataMap[actorName] || {};
    const newStatus = !currentInfo.is_favorite;
    const newTime = newStatus ? new Date().toISOString() : null;

    setActorDataMap(prev => ({
      ...prev,
      [actorName]: { 
        ...prev[actorName], 
        is_favorite: newStatus,
        favorite_at: newTime
      }
    }));

    await supabase.from('actors').upsert({
      user_id: user.id, 
      name: actorName,
      is_favorite: newStatus,
      favorite_at: newTime
    }, { onConflict: 'user_id,name' });
  };

  // 3. 统计逻辑
  const baseActorStats = useMemo(() => {
    const stats = {};
    plays.forEach(play => {
      const isConcert = play.category === '演唱会' || play.type === '演唱会' || play.title?.includes('演唱会');
      const weightVal = isConcert ? 0.1 : 1;
      const uniqueActorsInPlay = new Set();

      if (play.cast_list && Array.isArray(play.cast_list)) {
        play.cast_list.forEach(cast => {
          if (cast.name) uniqueActorsInPlay.add(cast.name);
        });
      }

      uniqueActorsInPlay.forEach(actorName => {
        if (!stats[actorName]) {
          stats[actorName] = { weight: 0, count: 0 };
        }
        stats[actorName].weight += weightVal;
        stats[actorName].count += 1;
      });
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .filter(actor => actor.weight >= 0.5) 
      .sort((a, b) => b.weight - a.weight); 
  }, [plays]);

  // 4. 分流与排序
  const { favoriteList, normalList } = useMemo(() => {
    const favs = [];
    const norms = [];

    baseActorStats.forEach(stat => {
      const info = actorDataMap[stat.name];
      const actorObj = { ...stat, ...info };

      if (info?.is_favorite) {
        favs.push(actorObj);
      } else {
        norms.push(actorObj);
      }
    });

    favs.sort((a, b) => {
      const timeA = a.favorite_at ? new Date(a.favorite_at).getTime() : 0;
      const timeB = b.favorite_at ? new Date(b.favorite_at).getTime() : 0;
      return timeA - timeB; 
    });

    return { favoriteList: favs, normalList: norms };
  }, [baseActorStats, actorDataMap]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Loader2 className="animate-spin text-yellow-600" size={32} />
          <p className="text-sm font-serif">正在读取演员名录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-[60vh]">
      <AnimatePresence mode="wait">
        {!selectedActor ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* === 特别关注：横向档案卡片 === */}
            {favoriteList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6 text-pink-500">
                  <Heart className="fill-pink-500" size={20} />
                  <h2 className="text-xl font-serif font-bold text-white">特别关注</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favoriteList.map(actor => (
                    <FavoriteActorCard 
                      key={actor.name} 
                      actor={actor} 
                      onClick={() => setSelectedActor(actor.name)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* === 所有演员：保持原印章风格 === */}
            <section>
              <div className="flex items-center gap-2 mb-6 text-zinc-500">
                <User size={20} />
                <h2 className="text-xl font-serif font-bold text-zinc-300">所有演员</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {normalList.map(actor => (
                  <ActorCard 
                    key={actor.name} 
                    actor={actor} 
                    onClick={() => setSelectedActor(actor.name)}
                  />
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <ActorDetail 
            key="detail" 
            name={selectedActor} 
            plays={plays.filter(p => p.cast_list?.some(c => c.name === selectedActor))}
            onBack={() => setSelectedActor(null)} 
            isFavorite={actorDataMap[selectedActor]?.is_favorite}
            onToggleFavorite={() => toggleFavorite(selectedActor)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 🟢 新增：特别关注档案卡片 (仿详情页)
function FavoriteActorCard({ actor, onClick }) {
  const initial = actor.name ? actor.name.charAt(0) : '';
  return (
    <div 
      onClick={onClick}
      className="group bg-[#111] border border-pink-500/20 rounded-xl p-5 cursor-pointer transition-all hover:border-pink-500/50 hover:bg-[#161616] flex gap-5 items-center relative overflow-hidden"
    >
      {/* 背景微光 */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors" />
      
      {/* 头像区域：有图显图 */}
      <div className="flex-shrink-0 relative">
        <div className="w-20 h-20 rounded-full border border-pink-500/30 overflow-hidden bg-zinc-900 flex items-center justify-center">
          {actor.image ? (
            <img src={actor.image} className="w-full h-full object-cover" alt={actor.name} />
          ) : (
            <span className="text-3xl font-serif font-bold text-pink-500/40">{initial}</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-pink-500 p-1 rounded-full shadow-lg">
          <Heart size={10} className="fill-white text-white" />
        </div>
      </div>

      {/* 信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-serif font-bold text-white truncate">{actor.name}</h3>
          <div className="flex items-center gap-1 text-[10px] text-yellow-600/80 font-mono">
            <Trophy size={10}/>
            <span>{actor.count} 场</span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed italic">
          {actor.bio || "点击查看详情并添加艺人简介..."}
        </p>
      </div>

      <ChevronRight size={18} className="text-zinc-800 group-hover:text-pink-500 transition-colors" />
    </div>
  );
}

// ⚪ 保持不变：普通列表卡片 (固定首字印章)
function ActorCard({ actor, onClick }) {
  const initial = actor.name ? actor.name.charAt(0) : '';
  return (
    <div 
      onClick={onClick}
      className="group bg-[#161616] border border-white/5 rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-1 hover:border-yellow-600/50 hover:shadow-lg"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/10 group-hover:border-yellow-600/50 bg-zinc-800 transition-colors">
          <span className="text-2xl font-serif font-bold text-zinc-500 group-hover:text-yellow-600/90 transition-colors">
            {initial}
          </span>
        </div>
        <div>
          <h3 className="font-bold truncate w-full max-w-[120px] text-white">
            {actor.name}
          </h3>
          <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full mt-1 inline-block">
            {actor.count} 部作品
          </span>
        </div>
      </div>
    </div>
  );
}

// 🟡 保持逻辑：演员详情页
function ActorDetail({ name, plays, onBack, isFavorite, onToggleFavorite }) {
  const [profile, setProfile] = useState({ bio: '', image: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const initial = name ? name.charAt(0) : '';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser(); 
      if (!user) return;
      const { data } = await supabase.from('actors').select('*').eq('name', name).eq('user_id', user.id).maybeSingle(); 
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [name]);

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setSaving(true);
    const { error } = await supabase.from('actors').upsert({
      user_id: user.id, name: name, bio: profile.bio, image: profile.image
    }, { onConflict: 'user_id,name' });
    setSaving(false);
    setIsEditing(false);
    if (error) alert('保存失败: ' + error.message);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => { setCropImageSrc(reader.result); setShowCropper(true); });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      setUploading(true);
      setShowCropper(false);
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const compressedFile = await imageCompression(new File([croppedBlob], "avatar.jpg"), { maxSizeMB: 0.3, maxWidthOrHeight: 1024 });
      const fileName = `actors/img_${Date.now()}.jpg`;
      await supabase.storage.from('posters').upload(fileName, compressedFile);
      const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
      const { data: { user } } = await supabase.auth.getUser();
      setProfile(prev => ({ ...prev, image: data.publicUrl }));
      await supabase.from('actors').upsert({ user_id: user.id, name, bio: profile.bio, image: data.publicUrl }, { onConflict: 'user_id,name' });
    } catch (e) { alert(e.message); } finally { setUploading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={18} className="mr-1"/> 返回列表
        </button>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-12 relative overflow-hidden">
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <div 
            onClick={() => fileInputRef.current.click()}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-dashed border-zinc-700 hover:border-yellow-600 cursor-pointer overflow-hidden relative group bg-[#1a1a1a]"
          >
            {/* 详情页：有图显图 */}
            {profile.image ? (
              <img src={profile.image} className="w-full h-full object-cover" alt={name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 font-serif font-bold text-6xl group-hover:text-yellow-600/50 transition-colors">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               {uploading ? <Loader2 className="animate-spin text-white"/> : <Upload className="text-white"/>}
            </div>
            <input type="file" ref={fileInputRef} onChange={onSelectFile} className="hidden" accept="image/*"/>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-serif font-bold text-white mb-2">{name}</h1>
              <button 
                onClick={onToggleFavorite}
                className={`p-2 rounded-full border transition-all ${isFavorite ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-white/5 border-white/10 text-zinc-500'}`}
              >
                <Heart size={20} className={isFavorite ? "fill-pink-500" : ""} />
              </button>
            </div>
            <button 
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              className="text-xs border border-white/20 hover:bg-white/10 text-zinc-300 px-3 py-1.5 rounded flex items-center gap-2 transition-all"
            >
              {isEditing ? (saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>) : <Sparkles size={12}/>}
              {isEditing ? '保存档案' : '编辑资料'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-yellow-600/80 text-sm font-mono mb-4 mt-1">
            <Trophy size={14}/>
            <span>已收录演出 {plays.length} 场</span>
          </div>
          {isEditing ? (
            <textarea 
              value={profile.bio || ''}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              className="w-full h-32 bg-black/30 border border-white/10 rounded-lg p-3 text-zinc-300 text-sm focus:border-yellow-600 outline-none resize-none"
            />
          ) : (
            <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {profile.bio || "暂无简介信息..."}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-serif text-white mb-6 pl-2 border-l-2 border-yellow-600">演出履历</h3>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {plays.map(play => (
          <TicketStub key={play.id} data={play} onEdit={() => {}} />
        ))}
      </div>

      <AnimatePresence>
        {showCropper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl overflow-hidden border border-white/10">
              <div className="relative w-full h-80">
                <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} />
              </div>
              <div className="p-6">
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full mb-6 accent-yellow-600" />
                <div className="flex gap-3">
                  <button onClick={() => setShowCropper(false)} className="flex-1 py-2 text-zinc-400">取消</button>
                  <button onClick={handleCropAndUpload} className="flex-1 py-2 bg-yellow-600 rounded text-black font-bold">确认</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 辅助函数
const createImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.addEventListener('load', () => resolve(image));
  image.addEventListener('error', (error) => reject(error));
  image.setAttribute('crossOrigin', 'anonymous');
  image.src = url;
});

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => { canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 0.95); });
}