import React from 'react';

export default function DefaultPoster({ title = '', date = '', color = null, variant = 'card' }) {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 默认配色方案
  const palettes = [
    { bg: 'bg-gradient-to-br from-[#800020] to-[#2b0a0d]', text: 'text-white/90', accent: 'border-white/20' }, 
    { bg: 'bg-gradient-to-br from-[#1a1a1a] to-[#000000]', text: 'text-[#d4af37]', accent: 'border-[#d4af37]/30' },
    { bg: 'bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]', text: 'text-white/80', accent: 'border-white/20' },
    { bg: 'bg-gradient-to-br from-[#3f3f46] to-[#18181b]', text: 'text-white/90', accent: 'border-white/10' },
    { bg: 'bg-gradient-to-br from-[#5c2e0e] to-[#2e1302]', text: 'text-[#fbbf24]', accent: 'border-[#fbbf24]/20' },
  ];

  let theme = palettes[hash % palettes.length];

  // === 核心逻辑：如果有自定义颜色，覆盖默认主题 ===
  // 我们手动构建 style 对象，而不是使用 Tailwind 的类名
  const customStyle = color ? {
    background: `linear-gradient(135deg, ${color}, #000000)`,
    color: '#ffffff', // 假设 AI 生成的颜色通常较深，文字用白色
    borderColor: 'rgba(255,255,255,0.2)'
  } : {};

  // 1. 智能分段
  const titleParts = title.split(/[\s+＋]+/).map(t => t.trim()).filter(Boolean);
  const isChinese = /[\u4e00-\u9fa5]/.test(title);
  
  // 2. 布局判断
  const isLongText = titleParts.some(part => part.length > 8) || titleParts.length > 4;
  const useVerticalLayout = isChinese && !isLongText; 

  let config = {
    padding: 'p-4',
    gap: 'gap-4',
    textSize: 'text-3xl',
    tracking: 'tracking-[0.2em]',
    showDate: true,
    bgNoise: true
  };

  if (variant === 'card') {
    config.padding = 'p-6';
    if (isLongText) {
      config.textSize = title.length > 20 ? 'text-2xl' : 'text-3xl';
      config.gap = 'gap-2';
    } else {
      if (titleParts.length <= 1) config.textSize = 'text-5xl';
      else if (titleParts.length === 2) config.textSize = 'text-4xl';
      else config.textSize = 'text-3xl';
      config.gap = titleParts.length === 2 ? 'gap-8' : 'gap-4';
    }
  } else if (variant === 'stub') {
    config.padding = 'p-3';
    config.showDate = false;
    config.textSize = isLongText ? 'text-lg' : 'text-xl';
    config.gap = 'gap-2';
  } else if (variant === 'mini') {
    config.padding = 'p-1';
    config.showDate = false;
    config.bgNoise = false;
    config.textSize = 'text-[10px] scale-90';
    config.gap = 'gap-0.5';
  }

  const content = (
    <div className={`relative z-10 flex-1 flex items-center justify-center w-full h-full`}>
      {useVerticalLayout ? (
        <div className={`flex flex-row-reverse items-center justify-center ${config.gap} w-full h-full`}>
          {titleParts.map((part, index) => (
            <div key={index} className="flex flex-col items-center justify-center h-full">
              <h2 
                className={`
                  font-serif font-bold leading-none drop-shadow-md 
                  writing-vertical-rl 
                  ${config.tracking}
                  ${config.textSize}
                  opacity-95 whitespace-nowrap
                  ${color ? 'text-white' : theme.text} 
                `}
                style={{ fontFamily: '"Songti SC", "Noto Serif SC", serif' }}
              >
                {part}
              </h2>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center w-full text-center ${config.gap}`}>
          {titleParts.map((part, index) => (
            <h2 
              key={index} 
              className={`
                font-serif font-bold leading-tight 
                ${config.textSize} 
                ${variant === 'mini' ? 'tracking-normal' : 'tracking-widest'}
                break-words max-w-full
                ${color ? 'text-white' : theme.text}
              `}
            >
              {part}
            </h2>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`w-full h-full relative flex flex-col items-center justify-center ${config.padding} overflow-hidden select-none ${!color && theme.bg}`}
      style={customStyle} // 应用自定义颜色背景
    >
      {config.bgNoise && (
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      )}

      {/* 边框 */}
      <div className={`absolute inset-2 border opacity-40 rounded-sm ${color ? 'border-white/20' : theme.accent}`}></div>
      {variant === 'card' && <div className={`absolute inset-[14px] border-[0.5px] opacity-20 rounded-sm ${color ? 'border-white/20' : theme.accent}`}></div>}

      {/* 年份 */}
      {config.showDate && (
        <div className={`absolute top-4 text-[10px] font-mono tracking-[0.2em] uppercase opacity-50 z-20 ${color ? 'text-white' : theme.text}`}>
          {date ? date.split('-')[0] : 'THEATER'}
        </div>
      )}

      {content}

      {variant === 'card' && (
        <div className="absolute -bottom-6 -right-6 text-9xl opacity-5 font-serif select-none pointer-events-none text-white mix-blend-overlay">
          {titleParts[0]?.[0]}
        </div>
      )}
    </div>
  );
}