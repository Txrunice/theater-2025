import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 这里的 X 和 Check 是裁剪弹窗按钮用到的图标，也得加上
import { User, ChevronLeft, Upload, Loader2, Save, Sparkles, Trophy, X, Check } from 'lucide-react'; 
import { supabase } from '../supabase';
import TicketStub from './TicketStub'; 
import imageCompression from 'browser-image-compression'; 
import Cropper from 'react-easy-crop';

export default function ActorView({ plays }) {
  const [selectedActor, setSelectedActor] = useState(null); // 当前选中的演员名字
  
  // 状态：用来存所有演员的头像字典 { "杨洋": "http://...", "张三": "..." }
  const [actorImages, setActorImages] = useState({});

  // 新增 useEffect：组件加载时，去数据库把所有头像拿回来
  useEffect(() => {
    const fetchActorImages = async () => {
      // 只取有头像的数据，减少流量
      const { data } = await supabase
        .from('actors')
        .select('name, image')
        .not('image', 'is', null); // 排除没头像的

      if (data) {
        // 把数组转成字典对象，方便按名字查找
        const imageMap = {};
        data.forEach(item => {
          imageMap[item.name] = item.image;
        });
        setActorImages(imageMap);
      }
    };

    fetchActorImages();
  }, []); // 空数组表示只在加载时跑一次

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
          <ActorList key="list" actors={actorStats} imageMap={actorImages} onSelect={setSelectedActor} />
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
// 👇 1. 接收 imageMap 参数
function ActorList({ actors, onSelect, imageMap }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      {/* ... 标题部分保持不变 ... */}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {actors.map((actor) => (
          <div 
            key={actor.name}
            onClick={() => onSelect(actor.name)}
            className="group bg-[#161616] border border-white/5 hover:border-yellow-600/50 rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-900/20"
          >
            <div className="flex flex-col items-center text-center gap-3">
              
              {/* 👇 2. 修改头像显示逻辑 */}
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden relative border border-white/5 group-hover:border-yellow-600/50 transition-colors">
                 
                 {/* 如果字典里有这个人的图，就显示图片 */}
                 {imageMap[actor.name] ? (
                   <img 
                     src={imageMap[actor.name]} 
                     alt={actor.name}
                     className="w-full h-full object-cover object-top" // 加上 object-top 防止切头
                   />
                 ) : (
                   // 否则显示默认图标
                   <User size={24} className="group-hover:text-yellow-500 transition-colors"/>
                 )}

              </div>

              <div>
                <h3 className="text-white font-bold truncate w-full max-w-[120px]">{actor.name}</h3>
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

  // === ✂️ 裁剪相关的 State ===
  const [cropImageSrc, setCropImageSrc] = useState(null); // 待裁剪图片的临时路径
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

  // 1. 用户选择文件 -> 读取并在弹窗中显示
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result); // 设置图片源
        setShowCropper(true);           // 打开裁剪弹窗
      });
      reader.readAsDataURL(file);
    }
  };

  // 2. 记录裁剪区域坐标 (由组件自动调用)
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 3. 确认裁剪并开始上传
  const handleCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    
    try {
      setUploading(true);
      setShowCropper(false); // 关闭弹窗

      // A. 获取裁剪后的 Blob
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      // B. 压缩 (使用之前的逻辑)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };
      // 将 Blob 转为 File 对象以便压缩库处理
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const compressedFile = await imageCompression(croppedFile, options);

      // C. 上传 Supabase
      const fileName = `actors/img_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // D. 获取 URL 并保存
      const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
      const newUrl = data.publicUrl;

      setProfile(prev => ({ ...prev, image: newUrl }));
      await supabase.from('actors').upsert({
        name: name, bio: profile.bio, image: newUrl
      }, { onConflict: 'name' });

    } catch (error) {
      console.error(error);
      alert('处理失败: ' + error.message);
    } finally {
      setUploading(false);
      setCropImageSrc(null); // 清理
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600"/></div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={18} className="mr-1"/> 返回列表
      </button>

      {/* 顶部档案卡片 */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-12 relative overflow-hidden">
        
        {/* 头像显示区 */}
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
            {/* 注意：这里 onChange 改成了 onSelectFile */}
            <input type="file" ref={fileInputRef} onChange={onSelectFile} className="hidden" accept="image/*"/>
          </div>
        </div>

        {/* 名字和简介区 (保持不变) */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-serif font-bold text-white mb-2">{name}</h1>
              <div className="flex items-center gap-2 text-yellow-600/80 text-sm font-mono mb-4">
                <Trophy size={14}/>
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

      {/* 票根墙 (保持不变) */}
      <h3 className="text-xl font-serif text-white mb-6 pl-2 border-l-2 border-yellow-600">演出履历</h3>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {plays.map(play => (
          <TicketStub key={play.id} data={play} onEdit={() => {}} />
        ))}
      </div>

      {/* === ✂️ 裁剪弹窗 Modal === */}
      <AnimatePresence>
        {showCropper && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative w-full h-80 bg-black">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // 1:1 正方形 (因为我们是圆头像)
                  cropShape="round" // ⭕️ 这里的关键：显示圆形遮罩
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs text-zinc-500">缩放</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowCropper(false); setCropImageSrc(null); }}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleCropAndUpload}
                    className="flex-1 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-bold transition-colors flex justify-center items-center gap-2"
                  >
                    <Check size={16} /> 确认使用
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// ✂️ 裁剪工具函数
// ==========================================
const createImage = (url) =>
  new Promise((resolve, reject) => {
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

  // 设置 canvas 大小为裁剪区域的大小
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 在 canvas 上绘制裁剪后的图片
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // 转换为 Blob 文件对象
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}