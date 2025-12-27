import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronLeft, Upload, Loader2, Save, Sparkles, Trophy, Check, Heart } from 'lucide-react'; 
import { supabase } from '../supabase';
import TicketStub from './TicketStub'; 
import imageCompression from 'browser-image-compression'; 
import Cropper from 'react-easy-crop';

export default function ActorView({ plays }) {
  const [selectedActor, setSelectedActor] = useState(null); 
  
  // 统一存储演员的附加信息：头像、是否喜欢、收藏时间
  // 结构: { "杨洋": { image: "...", is_favorite: true, favorite_at: "2023-..." } }
  const [actorDataMap, setActorDataMap] = useState({});

  // 1. 加载数据
  useEffect(() => {
    const fetchActorData = async () => {
      // 🟢 关键：获取 favorite_at 字段，这是排序的依据
      const { data } = await supabase
        .from('actors')
        .select('name, image, is_favorite, favorite_at');

      if (data) {
        const map = {};
        data.forEach(item => {
          map[item.name] = item;
        });
        setActorDataMap(map);
      }
    };

    fetchActorData();
  }, []);

  // 2. 切换喜欢状态
  const toggleFavorite = async (actorName) => {
    const currentInfo = actorDataMap[actorName] || {};
    const oldStatus = currentInfo.is_favorite;
    const newStatus = !oldStatus;
    
    // 如果变成喜欢 -> 记录当前时间
    // 如果取消 -> 设为 null
    const newTime = newStatus ? new Date().toISOString() : null;

    // 乐观更新 UI (让用户觉得快)
    setActorDataMap(prev => ({
      ...prev,
      [actorName]: { 
        ...prev[actorName], 
        image: prev[actorName]?.image, // 保持图片不变
        is_favorite: newStatus,
        favorite_at: newTime
      }
    }));

    // 提交数据库
    const { error } = await supabase.from('actors').upsert({
      name: actorName,
      is_favorite: newStatus,
      favorite_at: newTime
    }, { onConflict: 'name' });

    if (error) {
      console.error('更新关注失败', error);
      // 实际项目中这里可以加回滚逻辑
    }
  };

  // 3. 基础统计（计算场次权重、去重）
  const baseActorStats = useMemo(() => {
    const stats = {};
    plays.forEach(play => {
      const isConcert = play.category === '演唱会' || play.type === '演唱会' || play.title?.includes('演唱会');
      const weightVal = isConcert ? 0.1 : 1;
      const uniqueActorsInPlay = new Set();

      // 单部剧内去重
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
      .sort((a, b) => b.weight - a.weight); // 默认按权重降序
  }, [plays]);

  // 4. 分流 & 排序逻辑
  const { favoriteList, normalList } = useMemo(() => {
    const favs = [];
    const norms = [];

    baseActorStats.forEach(stat => {
      const info = actorDataMap[stat.name];
      const isFav = info?.is_favorite;
      
      // 合并统计数据和数据库里的信息
      const actorObj = { 
        ...stat, 
        image: info?.image, 
        favorite_at: info?.favorite_at 
      };

      if (isFav) {
        favs.push(actorObj);
      } else {
        norms.push(actorObj);
      }
    });

    // 🟢 关键排序逻辑：按照 favorite_at 从早到晚 (Ascending)
    // 逻辑：时间戳小的（旧的）排前面，时间戳大的（新的）排后面
    favs.sort((a, b) => {
      const timeA = a.favorite_at ? new Date(a.favorite_at).getTime() : 0;
      const timeB = b.favorite_at ? new Date(b.favorite_at).getTime() : 0;
      return timeA - timeB; 
    });

    return { favoriteList: favs, normalList: norms };
  }, [baseActorStats, actorDataMap]);


  return (
    <div className="max-w-7xl mx-auto min-h-[60vh]">
      <AnimatePresence mode="wait">
        {!selectedActor ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* === 特别关注栏 (置顶) === */}
            {favoriteList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 text-pink-500">
                  <Heart className="fill-pink-500" size={20} />
                  <h2 className="text-xl font-serif font-bold text-white">特别关注</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favoriteList.map(actor => (
                    <ActorCard 
                      key={actor.name} 
                      actor={actor} 
                      image={actor.image} 
                      onClick={() => setSelectedActor(actor.name)}
                      isFavorite={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* === 所有演员栏 (已剔除关注的) === */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <User size={20} />
                <h2 className="text-xl font-serif font-bold text-zinc-300">所有演员</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {normalList.map(actor => (
                  <ActorCard 
                    key={actor.name} 
                    actor={actor} 
                    image={actor.image} 
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
            // 传递关注状态给详情页
            isFavorite={actorDataMap[selectedActor]?.is_favorite}
            onToggleFavorite={() => toggleFavorite(selectedActor)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === 子组件部分 ===

function ActorCard({ actor, image, onClick, isFavorite }) {
  return (
    <div 
      onClick={onClick}
      className={`group bg-[#161616] border rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-900/20
        ${isFavorite ? 'border-pink-500/30 hover:border-pink-500' : 'border-white/5 hover:border-yellow-600/50'}
      `}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden relative border transition-colors
           ${isFavorite ? 'border-pink-500/50 group-hover:border-pink-500' : 'border-white/5 group-hover:border-yellow-600/50'}
        `}>
           {image ? (
             <img src={image} alt={actor.name} className="w-full h-full object-cover object-top" />
           ) : (
             <User size={24} className={isFavorite ? "text-pink-500" : "group-hover:text-yellow-500 transition-colors"}/>
           )}
        </div>
        <div>
          <h3 className={`font-bold truncate w-full max-w-[120px] ${isFavorite ? 'text-pink-100' : 'text-white'}`}>
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

function ActorDetail({ name, plays, onBack, isFavorite, onToggleFavorite }) {
  const [profile, setProfile] = useState({ bio: '', image: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  // 裁剪相关
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [name]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase.from('actors').select('*').eq('name', name).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('actors').upsert({
      name: name, bio: profile.bio, image: profile.image
    }, { onConflict: 'name' });
    setSaving(false);
    setIsEditing(false);
    if (error) alert('保存失败: ' + error.message);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      setUploading(true);
      setShowCropper(false);
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/jpeg' };
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const compressedFile = await imageCompression(croppedFile, options);
      const fileName = `actors/img_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
      const newUrl = data.publicUrl;
      setProfile(prev => ({ ...prev, image: newUrl }));
      await supabase.from('actors').upsert({ name: name, bio: profile.bio, image: newUrl }, { onConflict: 'name' });
    } catch (error) {
      console.error(error);
      alert('处理失败: ' + error.message);
    } finally {
      setUploading(false);
      setCropImageSrc(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={18} className="mr-1"/> 返回列表
        </button>
      </div>

      {/* 顶部档案卡片 */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-12 relative overflow-hidden">
        
        {/* 头像 */}
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
            <input type="file" ref={fileInputRef} onChange={onSelectFile} className="hidden" accept="image/*"/>
          </div>
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-serif font-bold text-white mb-2">{name}</h1>
              
              {/* ❤️ 喜欢/收藏按钮 */}
              <button 
                onClick={onToggleFavorite}
                className={`p-2 rounded-full border transition-all duration-300 ${
                  isFavorite 
                    ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:text-pink-400 hover:border-pink-500/50'
                }`}
                title={isFavorite ? "取消特别关注" : "设为特别关注"}
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

      <h3 className="text-xl font-serif text-white mb-6 pl-2 border-l-2 border-yellow-600">演出履历</h3>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {plays.map(play => (
          <TicketStub key={play.id} data={play} onEdit={() => {}} />
        ))}
      </div>

      {/* 裁剪弹窗 */}
      <AnimatePresence>
        {showCropper && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative w-full h-80 bg-black">
                <Cropper
                  image={cropImageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                  onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs text-zinc-500">缩放</span>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-600" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowCropper(false); setCropImageSrc(null); }} className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 text-sm font-medium transition-colors">取消</button>
                  <button onClick={handleCropAndUpload} className="flex-1 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-bold transition-colors flex justify-center items-center gap-2"><Check size={16} /> 确认使用</button>
                </div>
              </div>
            </div>
          </motion.div>
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
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => { canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 0.95); });
}