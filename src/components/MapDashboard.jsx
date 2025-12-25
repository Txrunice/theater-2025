import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { MapPin, Trophy, Activity, ArrowLeft, Ticket } from 'lucide-react';
import { CHINA_CITIES_COORDINATES } from '../constants/cityCoordinates';
import DefaultPoster from './DefaultPoster';

// 提取同样的格式化函数
const formatTitle = (title) => {
  if (!title) return '';
  if (/[+＋]/.test(title)) {
    const parts = title.split(/\s*[+＋]\s*/).filter(Boolean);
    return `折子戏：${parts.map(p => `《${p}》`).join('')}`;
  }
  return title;
};

export default function MapDashboard({ plays = [] }) {
  const [geoJson, setGeoJson] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const { cityData, mapData, topCity, scatterData } = useMemo(() => {
    const counts = plays.reduce((acc, curr) => {
      if (!curr.city) return acc;
      const city = curr.city.replace(/(市|盟|州|地区|自治州)$/g, ''); 
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const mapSeriesData = Object.keys(counts).map(city => ({
      name: city, 
      value: counts[city],
      plays: plays.filter(p => (p.city || '').includes(city)) 
    }));

    const scatterSeriesData = Object.keys(counts).map(city => {
      const coords = CHINA_CITIES_COORDINATES[city];
      if (!coords) return null;
      return {
        name: city,
        value: [...coords, counts[city]] 
      };
    }).filter(Boolean);

    const sortedProps = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const top = sortedProps.length > 0 ? sortedProps[0] : ['暂无数据', 0];

    return { cityData: counts, mapData: mapSeriesData, topCity: top, scatterData: scatterSeriesData };
  }, [plays]);

  const selectedCityPlays = useMemo(() => {
    if (!selectedCity) return [];
    return plays
      .filter(p => (p.city || '').includes(selectedCity))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCity, plays]);

  useEffect(() => {
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(response => response.json())
      .then(data => {
        echarts.registerMap('china', data);
        setGeoJson(data);
      })
      .catch(e => console.error("地图加载失败:", e));
  }, []);

  const onChartClick = (params) => {
    if (params.name && cityData[params.name]) {
      setSelectedCity(params.name);
    }
  };

  const getOption = () => {
    if (!geoJson) return {};
    return {
      backgroundColor: 'transparent', 
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        borderColor: '#800020', 
        padding: 10,
        textStyle: { color: '#fff', fontFamily: 'serif' },
        formatter: (params) => {
          if (!params.data) return;
          const count = Array.isArray(params.value) ? params.value[2] : params.value;
          return `
            <div style="font-size:14px; font-weight:bold; color:#d4af37;">
              ${params.name} 
              <span style="color:#fff; margin-left:8px;">${count} 场</span>
            </div>
            <div style="font-size:10px; color:#aaa; margin-top:4px;">点击查看详情</div>
          `;
        }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        label: { show: false },
        itemStyle: {
          areaColor: '#1a1a1a',
          borderColor: '#444',
          borderWidth: 1,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          shadowBlur: 10
        },
        emphasis: {
          itemStyle: { areaColor: '#252525', borderColor: '#666' },
          label: { show: false }
        }
      },
      series: [
        {
          name: '底图',
          type: 'map',
          geoIndex: 0,
          data: [],
          tooltip: { show: false },
          silent: true 
        },
        {
           name: '城市涟漪',
           type: 'effectScatter',
           coordinateSystem: 'geo',
           data: scatterData,
           tooltip: { show: true },
           symbolSize: function (val) { return Math.min(val[2] * 5 + 5, 20); },
           showEffectOn: 'render',
           rippleEffect: { brushType: 'stroke', scale: 3 },
           itemStyle: { color: '#d4af37', shadowBlur: 10, shadowColor: '#d4af37' },
           zlevel: 1
        }
      ]
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-xl h-[500px] lg:h-[600px] relative overflow-hidden shadow-2xl">
        {geoJson ? (
          <ReactECharts 
            option={getOption()} 
            style={{ height: '100%', width: '100%' }}
            key="map-loaded" 
            onEvents={{ click: onChartClick }} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
             <Activity className="animate-spin text-yellow-800" size={32} />
             <span className="text-xs uppercase tracking-widest">Loading Map Data...</span>
          </div>
        )}
        
        <div className="absolute top-6 left-6 pointer-events-none z-10">
           <h3 className="text-2xl serif text-white font-bold flex items-center gap-2">
             <MapPin className="text-yellow-600"/> 
             China Footprints
           </h3>
           <p className="text-zinc-500 text-sm mt-1">Light up the cities you've visited.</p>
        </div>
      </div>

      <div className="space-y-6 flex flex-col h-[600px] relative">
        {!selectedCity ? (
          <>
            <div className="bg-gradient-to-br from-[#161616] to-black border border-white/10 p-8 rounded-xl relative overflow-hidden group hover:border-yellow-600/30 transition-all shrink-0 animate-in slide-in-from-right-4">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-600/10 rounded-full blur-3xl group-hover:bg-yellow-600/20 transition-all"/>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-yellow-600 mb-3">
                     <Trophy size={16} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Most Visited</span>
                  </div>
                  <div className="text-5xl font-serif text-white mb-2">{topCity[0]}</div>
                  <div className="text-zinc-500 text-sm">
                    累计打卡 <span className="text-white font-bold text-lg mx-1">{topCity[1]}</span> 部剧目
                  </div>
               </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-xl flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-8 delay-100">
               <div className="p-4 border-b border-white/5 bg-[#161616]">
                  <h4 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">City Rankings</h4>
               </div>
               
               <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {Object.entries(cityData).sort((a,b) => b[1] - a[1]).map(([city, count], idx) => (
                     <div 
                        key={city} 
                        onClick={() => setSelectedCity(city)} 
                        className="flex items-center justify-between p-3 rounded hover:bg-white/10 cursor-pointer transition-colors group"
                     >
                        <div className="flex items-center gap-4">
                           <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded font-bold transition-all 
                             ${idx === 0 ? 'bg-yellow-600 text-black' : 
                               idx === 1 ? 'bg-zinc-400 text-black' :
                               idx === 2 ? 'bg-amber-700 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                             {idx + 1}
                           </span>
                           <span className="text-zinc-300 font-serif group-hover:text-white">{city}</span>
                        </div>
                        <div className="text-sm font-mono text-zinc-600 group-hover:text-yellow-600 transition-colors">{count}</div>
                     </div>
                  ))}
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
               <button 
                  onClick={() => setSelectedCity(null)}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm group"
               >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                  Back to Rankings
               </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-xl flex-1 flex flex-col overflow-hidden relative">
               <div className="p-6 bg-gradient-to-r from-yellow-900/20 to-transparent border-b border-white/5 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif text-white font-bold">{selectedCity}</h2>
                    <p className="text-zinc-400 text-xs uppercase tracking-widest mt-1">City Logs</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-mono text-yellow-600/50 font-bold">{selectedCityPlays.length}</span>
                    <span className="text-xs text-zinc-500 ml-1 block">Records</span>
                  </div>
               </div>

               <div className="overflow-y-auto custom-scrollbar p-4 space-y-4 flex-1">
                  {selectedCityPlays.map((p, idx) => (
                      <div 
                        key={p.id || idx} 
                        className="bg-[#1a1a1a] p-3 rounded-lg border border-white/10 group hover:border-yellow-600/30 transition-all flex gap-4"
                      >
                         <div className="w-20 h-28 shrink-0 rounded overflow-hidden bg-[#0a0a0a] border border-white/5">
                            {p.image ? (
                              <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            ) : (
                              <DefaultPoster title={p.title} variant="mini" />
                            )}
                         </div>

                         <div className="flex flex-col justify-center min-w-0">
                            {/* 修改点：使用格式化后的标题 */}
                            <h3 className="text-base font-bold text-white mb-1 truncate group-hover:text-yellow-500 transition-colors" title={formatTitle(p.title)}>
                              {formatTitle(p.title)}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                               <Ticket size={12}/>
                               <span className="truncate">{p.venue || '未知场馆'}</span>
                            </div>
                            <div className="text-xs text-zinc-600 font-mono mb-2">
                               {p.date ? p.date.split('T')[0] : 'Unknown Date'}
                            </div>
                            {p.seat_info && (
                               <div className="inline-block bg-white/5 px-2 py-0.5 rounded text-[10px] text-zinc-400 w-fit">
                                 {p.seat_info}
                               </div>
                            )}
                         </div>
                      </div>
                  ))}
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}