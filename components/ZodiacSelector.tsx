
import React, { useState, useEffect } from 'react';
import { getProductByZodiac, ProductEntry, ZodiacInsight } from '../services/productDatabase';

interface ZodiacSelectorProps {
  onBack: () => void;
  onProductSelect: (product: ProductEntry & { name: string }) => void;
}

interface ZodiacSign {
  name: string;
  date: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  tagline: string;
  constellationPath: string; 
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  // Fire Signs
  { name: '牡羊座', date: '3/21 - 4/19', element: 'fire', tagline: '衝破限制的勇氣', constellationPath: 'M15 60 L45 50 L70 50 L85 65' },
  { name: '獅子座', date: '7/23 - 8/22', element: 'fire', tagline: '閃耀舞台的主角', constellationPath: 'M75 20 Q90 10 80 40 L50 60 L20 60 L20 85 L80 85' },
  { name: '射手座', date: '11/23 - 12/21', element: 'fire', tagline: '自由與擴張的旅程', constellationPath: 'M30 80 L70 80 L60 40 L30 50 L30 80 M60 40 L85 25 M60 40 L90 50' },
  
  // Earth Signs
  { name: '金牛座', date: '4/20 - 5/20', element: 'earth', tagline: '豐盛正在累積', constellationPath: 'M20 30 L50 70 L80 30 M50 70 L30 90 M50 70 L70 90' },
  { name: '處女座', date: '8/23 - 9/22', element: 'earth', tagline: '秩序中的完美蛻變', constellationPath: 'M30 20 L60 30 L50 60 L20 50 L30 20 M50 60 L40 90 L80 80' },
  { name: '摩羯座', date: '12/22 - 1/19', element: 'earth', tagline: '登峰造極的時刻', constellationPath: 'M20 30 L50 85 L90 30 L70 20 L20 30' },
  
  // Air Signs
  { name: '雙子座', date: '5/21 - 6/21', element: 'air', tagline: '靈感與機遇的交會', constellationPath: 'M30 20 L30 80 M70 20 L70 80 M30 50 L70 50' },
  { name: '天秤座', date: '9/23 - 10/23', element: 'air', tagline: '關係與平衡的藝術', constellationPath: 'M50 20 L20 70 L80 70 L50 20 M20 70 L10 50 M80 70 L90 50' },
  { name: '水瓶座', date: '1/20 - 2/18', element: 'air', tagline: '重塑自我的革新', constellationPath: 'M20 50 L40 30 L50 40 L65 20 L75 40 L50 40 L50 90' },
  
  // Water Signs
  { name: '巨蟹座', date: '6/22 - 7/22', element: 'water', tagline: '溫柔的內在力量', constellationPath: 'M50 40 L20 80 M50 40 L80 80 M50 40 L50 15' },
  { name: '天蠍座', date: '10/24 - 11/22', element: 'water', tagline: '深刻的轉化重生', constellationPath: 'M85 20 L85 50 L65 75 L40 85 L20 75 L15 50 M85 20 L95 10 M85 20 L75 10' },
  { name: '雙魚座', date: '2/19 - 3/20', element: 'water', tagline: '夢想顯化的魔法', constellationPath: 'M20 30 L50 80 L80 30 M50 80 L50 95' },
];

// Color mapping for Elements
const ELEMENT_STYLES = {
    fire: {
        border: 'border-orange-500/30 group-hover:border-orange-500',
        bg: 'group-hover:bg-orange-900/20',
        text: 'text-orange-500',
        gradient: 'from-red-600 via-orange-500 to-amber-500',
        iconColor: '#f97316'
    },
    earth: {
        border: 'border-emerald-500/30 group-hover:border-emerald-500',
        bg: 'group-hover:bg-emerald-900/20',
        text: 'text-emerald-500',
        gradient: 'from-emerald-600 via-green-500 to-teal-500',
        iconColor: '#10b981'
    },
    air: {
        border: 'border-sky-500/30 group-hover:border-sky-500',
        bg: 'group-hover:bg-sky-900/20',
        text: 'text-sky-400',
        gradient: 'from-indigo-500 via-sky-500 to-cyan-400',
        iconColor: '#38bdf8'
    },
    water: {
        border: 'border-blue-500/30 group-hover:border-blue-500',
        bg: 'group-hover:bg-blue-900/20',
        text: 'text-blue-400',
        gradient: 'from-blue-600 via-indigo-500 to-violet-500',
        iconColor: '#60a5fa'
    }
};

const ZodiacSelector: React.FC<ZodiacSelectorProps> = ({ onBack, onProductSelect }) => {
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [matchData, setMatchData] = useState<{ product: ProductEntry & { name: string }, insight: ZodiacInsight } | null>(null);
  
  // Reveal Animation States
  const [isReading, setIsReading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (zodiac: ZodiacSign) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    setSelectedZodiac(zodiac);
    const result = getProductByZodiac(zodiac.name);
    setMatchData(result);
    
    // Start Ritual
    setIsReading(true);
    setShowResult(false);
    
    // Sequence: Reading (1.5s) -> Show Result
    setTimeout(() => {
        setIsReading(false);
        setShowResult(true);
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]); // Success vibration
    }, 1500);
  };

  const closeModal = () => {
    setShowResult(false);
    // Delay clearing data to allow exit animation if implemented, but for now instant is fine
    setTimeout(() => {
        setSelectedZodiac(null);
        setMatchData(null);
    }, 200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-32 pt-8">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between animate-fade-in-up">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition group bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
             <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             回到首頁
          </button>
          
          <div className="text-right">
             <h2 className="text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-mystic-300">
                2026 星引
             </h2>
             <p className="text-[10px] text-slate-400 font-sans tracking-[0.2em] uppercase">Astral Guidance</p>
          </div>
      </div>

      <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-slate-300 text-sm md:text-base font-light">
             點擊您的星座，連結宇宙能量，<br/>
             揭示 <span className="text-gold-400 font-bold">2026 年度關鍵字</span> 與專屬守護石。
          </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto pb-10">
         {ZODIAC_SIGNS.map((sign, index) => {
             const style = ELEMENT_STYLES[sign.element];
             return (
                <button
                key={sign.name}
                onClick={() => handleSelect(sign)}
                className={`
                    relative overflow-hidden rounded-2xl p-2 md:p-6 flex flex-col items-center justify-center gap-2 
                    bg-slate-900/40 backdrop-blur-md border border-white/5 
                    transition-all duration-500 group aspect-[4/5] md:aspect-square
                    hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,0,0,0.5)]
                    ${style.border} ${style.bg}
                `}
                style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
                >
                {/* Constellation SVG */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 mb-2">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                        <path 
                            d={sign.constellationPath} 
                            fill="none" 
                            stroke={style.iconColor} 
                            strokeWidth="1.5"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="opacity-50 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-draw"
                            strokeDasharray="1000"
                            strokeDashoffset="0"
                        />
                        {/* Stars at vertices (simple approximation for visual effect) */}
                        <circle cx="50" cy="50" r="40" fill="url(#star-glow)" className="opacity-0"/>
                    </svg>
                    {/* Hover Glow */}
                    <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-${sign.element === 'fire' ? 'orange' : sign.element === 'water' ? 'blue' : sign.element === 'earth' ? 'emerald' : 'sky'}-500`}></div>
                </div>
                
                <h3 className="text-sm md:text-lg font-bold text-white group-hover:text-white transition-colors z-10">{sign.name}</h3>
                <span className="text-[9px] md:text-xs text-slate-500 group-hover:text-slate-300 transition-colors font-sans z-10">
                    {sign.date}
                </span>

                {/* Tagline Suspense - FIXED: Default Hidden (translate-y-full), Reveal on Hover (group-hover:translate-y-0) */}
                <div className="absolute bottom-0 left-0 w-full p-1.5 md:p-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                    <span className={`text-[9px] md:text-[10px] font-bold ${style.text} tracking-wider whitespace-nowrap`}>{sign.tagline}</span>
                </div>
                </button>
             );
         })}
      </div>

      {/* 
         FULL SCREEN REVEAL OVERLAY 
      */}
      {(selectedZodiac && (isReading || showResult)) && (
         <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden">
             
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
             {/* Dynamic Gradient Background based on Element */}
             <div className={`absolute inset-0 bg-gradient-to-br ${ELEMENT_STYLES[selectedZodiac.element].gradient} opacity-10 transition-opacity duration-1000`}></div>
             
             {/* Close Button (Only visible when result is shown) */}
             {showResult && (
                 <button onClick={closeModal} className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition animate-fade-in">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             )}

             {/* PHASE 1: CONNECTING / READING */}
             {isReading && (
                 <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                      <div className="relative w-32 h-32 mb-8">
                           {/* Spinning Magic Circle */}
                           <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-[spin_3s_linear_infinite]"></div>
                           <div className="absolute inset-2 border-t-2 border-white/50 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                           {/* Constellation Pulsing */}
                           <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                                <svg viewBox="0 0 100 100" className="w-16 h-16">
                                     <path 
                                        d={selectedZodiac.constellationPath} 
                                        fill="none" 
                                        stroke="white" 
                                        strokeWidth="2"
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                     />
                                </svg>
                           </div>
                      </div>
                      <h3 className="text-xl font-display font-bold text-white tracking-widest animate-pulse">
                          星象連結中...
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 font-sans tracking-wide">正在讀取 2026 星盤指引</p>
                 </div>
             )}

             {/* PHASE 2: THE REVEAL (THE DESTINY CARD) */}
             {showResult && (
                 <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                     {/* Layout Adjustment: justify-start + padding for mobile to fix overlap */}
                     <div className="min-h-[85dvh] flex flex-col items-center justify-start pt-16 md:justify-center md:pt-0 p-6 md:p-12 animate-scale-in">
                        
                        {/* 1. THE KEYWORD - Reduced size for better desktop fit */}
                        <div className="mb-6 md:mb-8 text-center relative">
                            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr ${ELEMENT_STYLES[selectedZodiac.element].gradient} rounded-full blur-[80px] opacity-40 animate-pulse-slow`}></div>
                            <h4 className="text-slate-400 text-xs font-sans tracking-[0.3em] uppercase mb-2">2026 Keyword</h4>
                            <h2 className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                {matchData ? matchData.insight.keyword.split('、')[0] : '奧秘'}
                            </h2>
                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mt-6"></div>
                        </div>

                        {/* 2. THE FORECAST - Tighter margins */}
                        <div className="max-w-md mx-auto text-center space-y-6 mb-8 md:mb-10 relative z-10">
                             {matchData ? (
                                 <>
                                     <p className="text-lg md:text-xl text-slate-200 font-light leading-loose font-sans">
                                        「{matchData.insight.forecast}」
                                     </p>
                                     <p className="text-sm text-slate-400 leading-relaxed font-sans px-4">
                                        {matchData.insight.reason}
                                     </p>
                                 </>
                             ) : (
                                 <p className="text-slate-400">星象顯示，您需要更深層的探索。暫無特定商品對應。</p>
                             )}
                        </div>

                        {/* 3. THE TALISMAN (Interactive Reveal) */}
                        {matchData && (
                            <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                {/* Reduced bottom margin */}
                                <div className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-4 flex items-center gap-3 opacity-80">
                                   <span className="w-8 h-px bg-gold-500/50"></span>
                                   宇宙為你挑選
                                   <span className="w-8 h-px bg-gold-500/50"></span>
                                </div>
                                
                                {/* Magic Circle Container - SIZE OPTIMIZATION */}
                                {/* Reduced desktop size from w-80 (320px) to w-64 (256px) for better fit */}
                                <button 
                                    className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center mb-4 group cursor-pointer outline-none tap-highlight-transparent transition-transform active:scale-95 duration-500" 
                                    onClick={() => onProductSelect(matchData.product)}
                                >
                                     {/* Rotating Ring - Outer */}
                                     <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_20s_linear_infinite] group-hover:border-gold-500/30 transition-colors duration-700"></div>
                                     {/* Rotating Ring - Inner */}
                                     <div className="absolute inset-4 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] group-hover:border-gold-500/20 transition-colors duration-700"></div>
                                     
                                     {/* Glow */}
                                     <div className="absolute inset-0 bg-gold-500/5 rounded-full blur-[60px] group-hover:bg-gold-500/20 transition-colors duration-700 animate-pulse-slow"></div>
                                     
                                     {/* Mystery Symbol (Question Mark) */}
                                     <div className="relative z-10 flex flex-col items-center justify-center animate-float">
                                         <div className="w-20 h-20 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(253,224,71,0.1)] backdrop-blur-md group-hover:shadow-[0_0_60px_rgba(253,224,71,0.3)] group-hover:border-gold-400/50 transition-all duration-500">
                                            <svg className="w-8 h-8 md:w-10 md:h-10 text-gold-200 group-hover:text-gold-400 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                            </svg>
                                         </div>
                                         <span className="text-[10px] md:text-xs text-gold-300/70 tracking-[0.2em] font-sans mt-4 md:mt-4 group-hover:text-gold-300 transition-colors duration-500">
                                             點擊圖騰 喚醒能量
                                         </span>
                                     </div>
                                </button>
                            </div>
                        )}
                     </div>
                 </div>
             )}
         </div>
      )}
    </div>
  );
};

export default ZodiacSelector;
