import React from 'react';
import { Star, StarHalf } from 'lucide-react';

// 只读展示组件
export const ReadOnlyStars = ({ rating = 0, size = 14 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} size={size} fill="#d4af37" className="text-[#d4af37]" />);
    } else if (rating >= i - 0.5) {
      stars.push(<div key={i} className="relative"><Star size={size} className="text-zinc-700" /><StarHalf size={size} fill="#d4af37" className="text-[#d4af37] absolute top-0 left-0" /></div>);
    } else {
      stars.push(<Star key={i} size={size} className="text-zinc-700" />);
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

// 可交互的评分输入组件
export const InteractiveRating = ({ label, value, onChange }) => {
  // 处理点击逻辑：如果点的是左半边是X.5，右半边是X.0
  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    // 仅仅是预览样式，实际逻辑靠点击
  };

  const handleClick = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    onChange(isLeft ? index - 0.5 : index);
  };

  return (
    <div className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded border border-white/5">
      <span className="text-xs text-zinc-400 uppercase tracking-wider w-16">{label}</span>
      <div className="flex gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <div 
            key={star} 
            className="relative w-5 h-5"
            onClick={(e) => handleClick(e, star)}
          >
            {/* 底色星星 */}
            <Star size={20} className="text-zinc-800 absolute inset-0" />
            
            {/* 全星覆盖 */}
            {value >= star && <Star size={20} fill="#d4af37" className="text-[#d4af37] absolute inset-0 pointer-events-none" />}
            
            {/* 半星覆盖 */}
            {value === star - 0.5 && <StarHalf size={20} fill="#d4af37" className="text-[#d4af37] absolute inset-0 pointer-events-none" />}
          </div>
        ))}
      </div>
      <span className="text-xs font-bold text-yellow-600 w-6 text-right">{value}</span>
    </div>
  );
};