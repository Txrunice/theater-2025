import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// ⚠️ 注意：请确保这两个引用路径相对于当前文件是正确的
import { CHINA_CITIES_COORDINATES } from '../constants/cityCoordinates'; 
import mapData from '../assets/china.json';

// ==========================================
// 地图投影配置
// ==========================================
const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 600;
const MIN_LNG = 73.33;  
const MAX_LNG = 135.05;
const MIN_LAT = 18.15;  
const MAX_LAT = 53.55;

const project = ([lng, lat]) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * VIEWBOX_WIDTH;
    const y = VIEWBOX_HEIGHT - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * VIEWBOX_HEIGHT;
    return { x, y };
};

export const CityMapAnimation = ({ cityVisits }) => {
    // ... 原有的 mapPath useMemo 逻辑 ...
    const mapPath = useMemo(() => {
        const paths = [];
        mapData.features.forEach((feature, index) => {
            const geometry = feature.geometry;
            const drawPolygon = (rings) => {
                let d = "";
                rings.forEach((ring) => {
                    ring.forEach((point, j) => {
                        const { x, y } = project(point);
                        if (j === 0) d += `M${x},${y}`;
                        else d += `L${x},${y}`;
                    });
                    d += "Z ";
                });
                return d;
            };
            if (geometry.type === "Polygon") {
                paths.push(<path key={`p-${index}`} d={drawPolygon(geometry.coordinates)} className="fill-white/5 stroke-white/10" strokeWidth="0.5" />);
            } else if (geometry.type === "MultiPolygon") {
                geometry.coordinates.forEach((polygon, i) => {
                    paths.push(<path key={`mp-${index}-${i}`} d={drawPolygon(polygon)} className="fill-white/5 stroke-white/10" strokeWidth="0.5" />);
                });
            }
        });
        return paths;
    }, []);

    // ... 原有的 calculate logic ...
    const { uniquePath, cityCount, viewBox } = useMemo(() => {
        if (!cityVisits || cityVisits.length === 0) {
            return { uniquePath: [], cityCount: 0, viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` };
        }
        const validVisits = cityVisits.map(visit => {
            let coords = CHINA_CITIES_COORDINATES[visit.city] || 
                         CHINA_CITIES_COORDINATES[visit.city.replace('市', '')];
            if (!coords) {
                const key = Object.keys(CHINA_CITIES_COORDINATES).find(k => visit.city.includes(k));
                if (key) coords = CHINA_CITIES_COORDINATES[key];
            }
            return coords ? { city: visit.city.replace('市', ''), ...project(coords) } : null;
        }).filter(Boolean);

        const cityCount = new Set(validVisits.map(v => v.city)).size;
        const path = [];
        if (validVisits.length > 0) {
            path.push(validVisits[0]);
            for (let i = 1; i < validVisits.length; i++) {
                if (validVisits[i].city !== validVisits[i - 1].city) path.push(validVisits[i]);
            }
        }
        
        // 简化的视口计算
        const xs = validVisits.map(p => p.x);
        const ys = validVisits.map(p => p.y);
        if (xs.length === 0) return { uniquePath: [], cityCount: 0, viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` };
        
        const minX = Math.min(...xs); const maxX = Math.max(...xs);
        const minY = Math.min(...ys); const maxY = Math.max(...ys);
        const width = maxX - minX; const height = maxY - minY;
        const padding = 60;
        const finalW = Math.max(width + padding * 2, 200);
        const finalH = Math.max(height + padding * 2, 200);
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        return { uniquePath: path, cityCount, viewBox: `${centerX - finalW / 2} ${centerY - finalH / 2} ${finalW} ${finalH}` };
    }, [cityVisits]);

    // ... 原有的 animation effect ...
    const [visibleCount, setVisibleCount] = useState(0);
    useEffect(() => {
        if (uniquePath.length < 2) return;
        setVisibleCount(0);
        let currentStep = 0;
        const timer = setInterval(() => {
            if (currentStep >= uniquePath.length - 1) { clearInterval(timer); return; }
            currentStep += 1;
            setVisibleCount(currentStep);
        }, 800);
        return () => clearInterval(timer);
    }, [uniquePath]);

    return (
        <div className="w-full h-full bg-[#151921]/50 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-4 left-6 z-20">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                    Travel Footprint • {cityCount} Cities
                </div>
            </div>
            <svg viewBox={viewBox} className="w-full h-full transition-all duration-1000 ease-in-out">
                <g className="opacity-40">{mapPath}</g>
                <g>
                    {uniquePath.map((start, i) => {
                        if (i >= uniquePath.length - 1 || i >= visibleCount) return null;
                        const end = uniquePath[i + 1];
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2 - 20;
                        return (
                            <motion.path key={`trip-path-${i}`} d={`M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}`}
                                stroke="#f1c40f" strokeWidth="1.5" fill="none" 
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} 
                            />
                        );
                    })}
                </g>
                {uniquePath.map((p, i) => (
                    <g key={`city-point-${i}`}>
                        <circle cx={p.x} cy={p.y} r={2} fill="#fff" />
                        <motion.text
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.8 }}
                            x={p.x + 5} y={p.y - 5} fill="rgba(255,255,255,0.6)" className="text-[10px] font-serif pointer-events-none"
                        >
                            {p.city}
                        </motion.text>
                    </g>
                ))}
            </svg>
        </div>
    );
};