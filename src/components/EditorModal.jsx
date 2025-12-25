import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Plus, Trash2, Loader2, MapPin, Building2, List, Type, Mic2, Sparkles, ScanLine } from 'lucide-react';
import { supabase } from '../supabase';
import { InteractiveRating } from './StarRating';

// === 配置区域 ===
const ENV_API_KEY = import.meta.env.VITE_SILICONFLOW_KEY || ''; 

// 智能建议输入框组件
const SmartInput = ({ label, value, onChange, suggestions = [], icon: Icon }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = suggestions.filter(s => s && s.toLowerCase().includes(value.toLowerCase()) && s !== value);

  return (
    <div className="relative group">
      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">{label}</label>
      <div className="relative">
        <input 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 pl-9 text-white focus:border-yellow-600 outline-none transition-colors" 
        />
        {Icon && <Icon size={14} className="absolute left-3 top-3 text-zinc-500" />}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 w-full bg-[#1a1a1a] border border-white/10 rounded mt-1 shadow-xl max-h-40 overflow-y-auto">
            {filtered.map((item, i) => (
              <div key={i} className="px-3 py-2 text-sm text-zinc-300 hover:bg-yellow-900/30 hover:text-white cursor-pointer" onClick={() => onChange(item)}>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditorModal({ isOpen, onClose, play, onSave, allPlays = [] }) {
  const fileInputRef = useRef(null);
  const programInputRef = useRef(null); 
  
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [isMultiTitle, setIsMultiTitle] = useState(false);
  const TITLE_SEPARATOR = " + "; 

  const existingVenues = [...new Set(allPlays.map(p => p.venue))].filter(Boolean);
  const existingCities = [...new Set(allPlays.map(p => p.city))].filter(Boolean);

  const [formData, setFormData] = useState({
    title: '', date: '', venue: '', city: '', category: '京剧', image: '', repo: '', price: '', seat_info: '',
    ratings_detail: { story: 0, acting: 0, visual: 0, music: 0 },
    cast_list: []
  });

  const isConcert = formData.category === '演唱会';
  
  const castLabels = {
    title: isConcert ? '节目单 / 演唱者' : '主演 Cast',
    namePlaceholder: isConcert ? '演唱者' : '演员姓名',
    actionText: isConcert ? '演唱' : '饰', 
    rolePlaceholder: isConcert ? '具体唱段名' : '角色名',
    addButton: isConcert ? '添加节目' : '添加演员'
  };

  useEffect(() => {
    if (play) {
      let initialCast = play.cast_list || [];
      initialCast = initialCast.map(c => ({ ...c, group_index: c.group_index ?? 0 }));

      setFormData({
        ...play,
        ratings_detail: play.ratings_detail || { story: 0, acting: 0, visual: 0, music: 0 },
        cast_list: initialCast
      });
      setIsMultiTitle(!!(play.title && play.title.includes(TITLE_SEPARATOR)));
    } else {
      setFormData({ 
        title: '', date: '', venue: '', city: '', category: '京剧', 
        image: '', repo: '', price: '', seat_info: '',
        ratings_detail: { story: 3, acting: 3, visual: 3, music: 3 },
        cast_list: [{ name: '', role: '', group_index: 0 }] 
      });
      setIsMultiTitle(false);
    }
  }, [play, isOpen]);

  const toggleMultiTitle = () => {
    const nextMode = !isMultiTitle;
    setIsMultiTitle(nextMode);
    if (!nextMode) {
      const mergedCast = formData.cast_list.map(c => ({ ...c, group_index: 0 }));
      setFormData(prev => ({ ...prev, cast_list: mergedCast }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('posters').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('posters').getPublicUrl(fileName);
      setFormData({ ...formData, image: data.publicUrl });
    } catch (error) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // === 增强版 AI 识别逻辑 ===
const handleSiliconFlowRecognition = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let apiKey = ENV_API_KEY;
    if (!apiKey) {
      apiKey = window.prompt("请输入硅基流动(SiliconFlow) API Key (sk-xxxx):");
      if (!apiKey) return;
    }

    setRecognizing(true);

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-VL-72B-Instruct", 
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `请分析这张${formData.category}的演员表/节目单图片。
                  提取所有的'姓名'和'饰演角色(或曲目)'。
                  请严格按照以下文本格式输出，每行一个，不要输出任何其他文字：
                  姓名:角色
                  姓名:角色` 
                },
                { 
                  type: "image_url", 
                  image_url: { url: base64Image } 
                }
              ]
            }
          ],
          max_tokens: 2048,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API 请求失败");
      }

      const data = await response.json();
      const rawContent = data.choices[0].message.content.trim();
      
      console.log("AI 原始输出:", rawContent); // 调试用

      // === 使用正则解析非 JSON 格式，容错率极高 ===
      // 匹配格式如 "张三:林冲" 或 "张三：林冲" 或 "姓名:角色"
      const lines = rawContent.split('\n');
      const results = [];
      
      lines.forEach(line => {
        // 兼容中英文冒号
        const parts = line.split(/[:：]/);
        if (parts.length >= 2) {
          const name = parts[0].trim().replace(/^[-*数\d. ]+/, ''); // 去掉行首的列表符号
          const role = parts.slice(1).join(':').trim();
          if (name && name.length < 20) { // 简单过滤掉太长的非人名行
            results.push({ name, role });
          }
        }
      });

      if (results.length > 0) {
        const newCast = results.map(item => ({
          name: item.name,
          role: item.role,
          group_index: 0 
        }));
        
        // 保留原有已输入的有效行
        const cleanCurrent = formData.cast_list.filter(c => c.name?.trim() || c.role?.trim());
        
        setFormData(prev => ({
          ...prev,
          cast_list: [...cleanCurrent, ...newCast]
        }));
      } else {
        throw new Error("未能从文字中提取出有效的姓名和角色格式");
      }

    } catch (error) {
      console.error("识别详情错误:", error);
      alert('识别失败: ' + error.message + '\n\n提示：请确保上传的图片中“演员/节目”文字清晰，且背景不宜过杂。');
    } finally {
      setRecognizing(false);
      if(programInputRef.current) programInputRef.current.value = '';
    }
  };
  // --- 辅助逻辑 ---
  const getTitleList = () => formData.title ? formData.title.split(TITLE_SEPARATOR) : [''];
  const updateTitleRow = (index, value) => {
    const list = getTitleList();
    list[index] = value;
    setFormData({ ...formData, title: list.join(TITLE_SEPARATOR) });
  };
  const addTitleRow = () => {
    const list = getTitleList();
    list.push('');
    setFormData({ ...formData, title: list.join(TITLE_SEPARATOR) });
  };
  const removeTitleRow = (index) => {
    const list = getTitleList();
    if (list.length <= 1) {
      setFormData({ ...formData, title: '', cast_list: [] });
      return;
    }
    const newList = list.filter((_, i) => i !== index);
    const newTitle = newList.join(TITLE_SEPARATOR);
    const newCast = formData.cast_list
      .filter(c => c.group_index !== index)
      .map(c => {
        if (c.group_index > index) return { ...c, group_index: c.group_index - 1 };
        return c;
      });
    setFormData({ ...formData, title: newTitle, cast_list: newCast });
  };
  const getCastByGroup = (groupIndex) => {
    return formData.cast_list
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter(item => item.group_index === groupIndex);
  };
  const updateCast = (originalIndex, field, value) => {
    const newCast = [...formData.cast_list];
    newCast[originalIndex][field] = value;
    setFormData({ ...formData, cast_list: newCast });
  };
  const addCastRow = (groupIndex = 0) => {
    setFormData({ 
      ...formData, 
      cast_list: [...formData.cast_list, { name: '', role: '', group_index: groupIndex }] 
    });
  };
  const removeCastRow = (originalIndex) => {
    setFormData({ 
      ...formData, 
      cast_list: formData.cast_list.filter((_, i) => i !== originalIndex) 
    });
  };
  const updateRating = (field, value) => {
    setFormData({ 
      ...formData, 
      ratings_detail: { ...formData.ratings_detail, [field]: value } 
    });
  };

  const handleSaveClick = async () => {
    try {
      setUploading(true);
      const cleanTitle = isMultiTitle 
        ? formData.title.split(TITLE_SEPARATOR).map(t => t.trim()).filter(Boolean).join(TITLE_SEPARATOR)
        : formData.title.trim();

      const cleanCast = formData.cast_list.filter(c => c.name?.trim() || c.role?.trim());

      const dataToSave = { 
        ...formData,
        title: cleanTitle,
        cast_list: cleanCast,
        rating: (Object.values(formData.ratings_detail).reduce((a, b) => a + b, 0) / 4).toFixed(1)
      };
      delete dataToSave.id; delete dataToSave.created_at;

      const query = play?.id 
        ? supabase.from('plays').update(dataToSave).eq('id', play.id)
        : supabase.from('plays').insert([dataToSave]);
      
      const { error } = await query;
      if (error) throw error;

      const uniqueActors = [...new Set(cleanCast.map(c => c.name?.trim()).filter(Boolean))];
      if (uniqueActors.length > 0) {
        await supabase.from('actors').upsert(uniqueActors.map(name => ({ name })), { onConflict: 'name', ignoreDuplicates: true });
      }

      onSave(); 
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;
  const titleList = getTitleList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-[#111] w-full max-w-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#161616] shrink-0">
          <div className="flex items-center gap-3">
             <h3 className="text-lg serif font-bold text-white">Editor</h3>
             {isConcert && (
               <span className="px-2 py-0.5 rounded-full bg-yellow-600/20 border border-yellow-600/30 text-yellow-600 text-[10px] font-bold tracking-wider flex items-center gap-1">
                 <Mic2 size={10} /> 演唱会模式
               </span>
             )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* 1. 图片上传 */}
          <div onClick={() => !uploading && fileInputRef.current.click()} className={`relative w-full h-40 rounded-lg border-2 border-dashed ${uploading ? 'cursor-wait border-zinc-700' : 'cursor-pointer border-zinc-700 hover:border-yellow-600/50'} flex flex-col items-center justify-center overflow-hidden transition-colors`}>
            {formData.image ? <img src={formData.image} className="w-full h-full object-cover opacity-60" /> : <div className="text-zinc-500 flex flex-col items-center"><ImageIcon className="mb-2"/><span className="text-xs">上传海报</span></div>}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" disabled={uploading} />
          </div>

          {/* 2. 基础信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <div className="flex justify-between items-center mb-1.5">
                 <label className="block text-xs uppercase tracking-wider text-zinc-500">剧名 Title</label>
                 <button onClick={toggleMultiTitle} className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-yellow-500 transition-colors">
                   {isMultiTitle ? <Type size={12}/> : <List size={12}/>}
                   {isMultiTitle ? '切换单行' : '折子戏/分段模式'}
                 </button>
               </div>
               
               {isMultiTitle ? (
                 <div className="space-y-2 border border-white/10 rounded p-2 bg-[#0f0f0f]">
                    {titleList.map((titleStr, idx) => (
                      <div key={idx} className="flex gap-2">
                         <div className="flex items-center justify-center w-6 h-full text-xs text-zinc-600 font-mono select-none">{idx + 1}</div>
                         <input 
                           placeholder={`折子戏/节目 ${idx + 1}`}
                           value={titleStr} 
                           onChange={e => updateTitleRow(idx, e.target.value)} 
                           className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-600 outline-none" 
                         />
                         <button onClick={() => removeTitleRow(idx)} className="text-zinc-600 hover:text-red-500 p-1">
                           <Trash2 size={14}/>
                         </button>
                      </div>
                    ))}
                    <button onClick={addTitleRow} className="w-full py-1 border border-dashed border-zinc-700 text-zinc-500 text-xs hover:border-yellow-600 hover:text-yellow-600 rounded flex justify-center items-center gap-1">
                      <Plus size={12} /> 添加剧目
                    </button>
                 </div>
               ) : (
                 <input 
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})} 
                   className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:border-yellow-600 outline-none" 
                   placeholder="输入剧目名称"
                 />
               )}
             </div>

             <div>
               <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">分类 Category</label>
               <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:border-yellow-600 outline-none">
                 <option>京剧</option><option>昆曲</option><option>评剧</option><option>演唱会</option><option>话剧</option><option>音乐剧</option><option>舞剧</option><option>其他</option>
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SmartInput label="城市 City" value={formData.city} onChange={v => setFormData({...formData, city: v})} suggestions={existingCities} icon={MapPin} />
            <SmartInput label="剧场 Venue" value={formData.venue} onChange={v => setFormData({...formData, venue: v})} suggestions={existingVenues} icon={Building2} />
            <div>
               <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">日期 Date</label>
               <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white scheme-dark" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">座位号 Seat</label>
              <input value={formData.seat_info || ''} onChange={e => setFormData({...formData, seat_info: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:border-yellow-600 outline-none placeholder-zinc-700" placeholder="例如: 1楼 5排 12座" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">评分 Rating</label>
            <div className="grid grid-cols-2 gap-3">
              <InteractiveRating label="演员 Acting" value={formData.ratings_detail.acting} onChange={v => updateRating('acting', v)} />
              <InteractiveRating label="剧情 Story" value={formData.ratings_detail.story} onChange={v => updateRating('story', v)} />
              <InteractiveRating label="声腔 Music" value={formData.ratings_detail.music} onChange={v => updateRating('music', v)} />
              <InteractiveRating label="舞美 Visual" value={formData.ratings_detail.visual} onChange={v => updateRating('visual', v)} />
            </div>
          </div>

          {/* 4. 演员表 / 节目单 */}
          <div className={`rounded-lg transition-colors ${recognizing ? 'bg-indigo-500/5' : ''}`}>
            
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                 {isConcert ? <Mic2 size={12} className="text-yellow-600"/> : <Sparkles size={12} className="text-indigo-400"/>}
                 {castLabels.title}
              </label>

              <div className="flex gap-2">
                {/* 所有的模式现在都可以识别 */}
                <div className="relative">
                  <button 
                    onClick={() => !recognizing && programInputRef.current.click()}
                    className={`text-[10px] flex items-center gap-1 border px-2 py-0.5 rounded transition-all 
                      ${recognizing 
                        ? 'opacity-50 cursor-wait border-zinc-500 bg-zinc-500/10' 
                        : 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'}`}
                  >
                    {recognizing ? <Loader2 size={10} className="animate-spin"/> : <ScanLine size={10}/>}
                    {recognizing ? '识别中...' : 'AI 扫描节目单'}
                  </button>
                  <input 
                      type="file" 
                      ref={programInputRef} 
                      onChange={handleSiliconFlowRecognition} 
                      accept="image/*" 
                      className="hidden" 
                      disabled={recognizing} 
                  />
                </div>
                
                {!isMultiTitle && (
                  <button onClick={() => addCastRow(0)} className="text-xs text-yellow-600 flex items-center gap-1 hover:text-yellow-500 px-1">
                    <Plus size={12}/> {castLabels.addButton}
                  </button>
                )}
              </div>
            </div>

            {!isMultiTitle && (
               <div className="space-y-2">
                {getCastByGroup(0).map((cast) => (
                  <div key={cast.originalIndex} className="flex gap-2 items-center">
                    <input 
                        placeholder={castLabels.namePlaceholder} 
                        value={cast.name} 
                        onChange={e => updateCast(cast.originalIndex, 'name', e.target.value)} 
                        className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-600 outline-none" 
                    />
                    <span className={`self-center text-[10px] whitespace-nowrap px-1 ${isConcert ? 'text-yellow-600/70 font-bold' : 'text-zinc-600'}`}>
                        {castLabels.actionText}
                    </span>
                    <input 
                        placeholder={castLabels.rolePlaceholder} 
                        value={cast.role} 
                        onChange={e => updateCast(cast.originalIndex, 'role', e.target.value)} 
                        className="flex-[1.5] bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-600 outline-none" 
                    />
                    <button onClick={() => removeCastRow(cast.originalIndex)} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                  </div>
                ))}
                {getCastByGroup(0).length === 0 && !recognizing && (
                    <div className="text-xs text-zinc-700 italic text-center py-4 border border-dashed border-zinc-800 rounded">
                        暂无{isConcert ? '演唱者' : '演员'}信息
                    </div>
                )}
              </div>
            )}

            {isMultiTitle && (
              <div className="space-y-4">
                {titleList.map((currentTitle, groupIdx) => {
                  const groupCast = getCastByGroup(groupIdx);
                  return (
                    <div key={groupIdx} className="border border-white/5 rounded-lg p-3 bg-[#111]">
                      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                        <div className="flex items-center gap-2">
                           <div className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 rounded font-mono">{groupIdx + 1}</div>
                           <span className="text-sm text-zinc-300 font-serif truncate max-w-[200px]">{currentTitle || '（未命名）'}</span>
                        </div>
                        <button onClick={() => addCastRow(groupIdx)} className="text-[10px] text-yellow-600 flex items-center gap-1 hover:text-yellow-500">
                          <Plus size={10}/> 添加
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {groupCast.map((cast) => (
                          <div key={cast.originalIndex} className="flex gap-2 items-center">
                            <input placeholder={castLabels.namePlaceholder} value={cast.name} onChange={e => updateCast(cast.originalIndex, 'name', e.target.value)} className="w-1/3 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-xs text-white" />
                            <span className={`self-center text-[10px] whitespace-nowrap px-1 ${isConcert ? 'text-yellow-600/70 font-bold' : 'text-zinc-600'}`}>{castLabels.actionText}</span>
                            <input placeholder={castLabels.rolePlaceholder} value={cast.role} onChange={e => updateCast(cast.originalIndex, 'role', e.target.value)} className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-xs text-white" />
                            <button onClick={() => removeCastRow(cast.originalIndex)} className="text-zinc-600 hover:text-red-500"><Trash2 size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">票价 Price</label>
              <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-yellow-600" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">剧评 Repo</label>
            <textarea value={formData.repo} onChange={e => setFormData({...formData, repo: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white h-32 resize-none outline-none focus:border-yellow-600 custom-scrollbar" placeholder="写下你的观后感..." />
          </div>

        </div>

        <div className="p-5 pt-2 border-t border-white/5 bg-[#161616] shrink-0">
          <button onClick={handleSaveClick} disabled={uploading} className="w-full bg-[#800020] hover:bg-[#600018] text-white/90 font-bold py-3 rounded shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="animate-spin" size={20}/> : '保存记录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}