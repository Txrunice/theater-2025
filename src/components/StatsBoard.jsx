import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Coins, Theater } from 'lucide-react';

const StatCard = ({ label, value, unit, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay, duration: 0.5 }}
    className="relative overflow-hidden bg-ink-900/40 backdrop-blur-md border border-white/5 p-8 rounded-xl group hover:border-cinnabar/30 transition-all duration-500"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cinnabar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 font-sans">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-gold-light to-gold drop-shadow-sm">
            {value}
          </span>
          <span className="text-sm text-gray-500 font-serif italic">{unit}</span>
        </div>
      </div>
      <div className="p-3 bg-white/5 rounded-full text-gray-600 group-hover:text-cinnabar group-hover:bg-cinnabar/10 transition-colors">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  </motion.div>
);

export default function StatsBoard({ plays }) {
  const totalSpent = plays.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const categories = [...new Set(plays.map(p => p.category))];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4 px-2 max-w-7xl mx-auto">
      <StatCard label="观演总数" value={plays.length} unit="部" icon={Ticket} delay={0.1} />
      <StatCard label="年度开销" value={totalSpent} unit="元" icon={Coins} delay={0.2} />
      <StatCard label="涉猎剧种" value={categories.length} unit="类" icon={Theater} delay={0.3} />
    </div>
  );
}