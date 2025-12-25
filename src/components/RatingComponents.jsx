// src/components/RatingComponents.jsx
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

// 只读星星组件 (用于展示)
export const ReadOnlyStars = ({ rating = 0, size = 14 }) => {
  const stars = [];
  // 确保 rating 是数字
  const numericRating = Number(rating) || 0;

  for (let i = 1; i <= 5; i++) {
    if (numericRating >= i) {
      // 全星
      stars.push(<Star key={i} size={size} fill="#d4af37" className="text-[#d4af37]" />);
    } else if (numericRating >= i - 0.5) {
      // 半星
      stars.push(
        <div key={i} className="relative">
          <Star size={size} className="text-zinc-700" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
             <Star size={size} fill="#d4af37" className="text-[#d4af37]" />
          </div>
        </div>
      );
    } else {
      // 空星
      stars.push(<Star key={i} size={size} className="text-zinc-700" />);
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

// 交互式评分组件 (如果你需要用的话)
export const InteractiveRating = ({ label, value, onChange }) => {
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
            <Star size={20} className="text-zinc-800 absolute inset-0" />
            {value >= star && <Star size={20} fill="#d4af37" className="text-[#d4af37] absolute inset-0 pointer-events-none" />}
            {value === star - 0.5 && (
                <div className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                     <Star size={20} fill="#d4af37" className="text-[#d4af37]" />
                </div>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs font-bold text-yellow-600 w-6 text-right">{value}</span>
    </div>
  );
};