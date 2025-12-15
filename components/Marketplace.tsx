
import React, { useMemo } from 'react';
import { getProductList, ProductEntry } from '../services/productDatabase';

interface MarketplaceProps {
  onProductSelect?: (product: ProductEntry & { name: string }) => void;
  onOpenZodiac: () => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onProductSelect, onOpenZodiac }) => {
  const products = useMemo(() => getProductList(), []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-32 animate-fade-in space-y-12">
      
      {/* 
        HERO SECTION
      */}
      <div className="relative mt-4 md:mt-8 rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl isolate group">
        
        {/* Inner Background Ambience */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900/80 to-slate-950 z-0"></div>
        <div className="absolute top-0 right-0 w-[80%] h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 mix-blend-overlay"></div>

        {/* 
           LAYOUT ADJUSTMENT:
           - Changed p-8 to p-6 py-10 for mobile to give more vertical breathing room but tight horizontal fit.
        */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 py-10 md:p-12 gap-8 md:gap-12">
            
            {/* Text Content */}
            <div className="w-full md:w-3/5 space-y-6 text-center md:text-left relative z-20">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] md:text-xs font-bold tracking-[0.2em] font-sans mb-1 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
                    NEW ARRIVAL 2026
                 </div>
                 
                 <h2 className="font-display font-black leading-[0.9] tracking-tight drop-shadow-2xl">
                    <span className="block text-4xl md:text-6xl lg:text-7xl text-white mb-2 md:mb-4">好事</span>
                    <span className="block text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 drop-shadow-[0_4px_10px_rgba(251,191,36,0.3)] pb-2">
                      花生系列
                    </span>
                 </h2>
                 
                 <div className="md:border-l-2 md:border-white/10 md:pl-6 mx-auto md:mx-0 max-w-lg pt-2">
                    <p className="text-slate-300 text-base md:text-lg font-sans leading-relaxed font-light">
                        以天然水晶凝聚天地能量，<br className="hidden md:block"/>
                        為您的 2026 簽收一整年的小幸運。
                    </p>
                 </div>

                 {/* DUAL CTA BUTTONS */}
                 <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
                    
                    {/* Zodiac Button */}
                    <button 
                      onClick={onOpenZodiac}
                      className="relative px-6 py-3 rounded-full bg-gradient-to-r from-mystic-600 to-purple-700 text-white font-medium text-sm tracking-widest shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 overflow-hidden font-sans group/btn w-full sm:w-auto min-w-[180px] border border-white/10"
                    >
                       <span>2026 星引</span>
                       <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                       <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    </button>

                    {/* Browse All Button */}
                    <button 
                      onClick={() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })}
                      className="relative px-6 py-3 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white font-medium text-sm tracking-widest transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 font-sans w-full sm:w-auto min-w-[160px]"
                    >
                       <span>瀏覽全系列</span>
                    </button>
                 </div>
            </div>

            {/* 
                VISUAL FOCUS
                - Adjusted margins: mt-4 md:mt-0 to pull it slightly closer on mobile but distinct.
            */}
            <div className="w-full md:w-2/5 flex justify-center md:justify-end relative mt-4 md:mt-0 pr-0 md:pr-8 lg:pr-12 pointer-events-none pb-4 md:pb-0">
                 
                 {/* Core Glow (Intensified Gold) */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 bg-amber-500/30 rounded-full blur-[60px] md:blur-[80px] animate-pulse-slow"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-32 md:h-32 bg-yellow-200/20 rounded-full blur-[40px] mix-blend-screen"></div>
                 
                 {/* 
                    Orbit Container 
                    - RESPONSIVE SIZING: Adjusted desktop (lg) size to 72 (288px) down from 80 (320px)
                 */}
                 <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-72 lg:h-72 flex items-center justify-center">
                    
                    {/* Orbit Ring 1 (Outer - Bright Gold Stardust Trail) */}
                    <div className="absolute w-[135%] h-[135%] rounded-full border border-amber-500/20 animate-[spin_18s_linear_infinite]">
                        {/* Main Star */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-100 rounded-full blur-[0.5px] shadow-[0_0_20px_rgba(253,224,71,1),0_0_40px_rgba(245,158,11,0.8)]"></div>
                        {/* Trail 1 */}
                        <div className="absolute top-[2%] left-[53%] w-1.5 h-1.5 bg-amber-300 rounded-full opacity-80 blur-[0.5px]"></div>
                        {/* Trail 2 */}
                        <div className="absolute top-[5%] left-[55%] w-1 h-1 bg-amber-500 rounded-full opacity-60"></div>
                    </div>

                     {/* Orbit Ring 2 (Inner - Counter Spin - High Frequency) */}
                    <div className="absolute w-[110%] h-[110%] rounded-full border border-yellow-400/10 animate-[spin_10s_linear_infinite_reverse]">
                        {/* Particle 1 */}
                        <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full blur-[0.5px] shadow-[0_0_15px_rgba(251,191,36,0.9)]"></div>
                        {/* Particle 2 (Opposite) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[1px] opacity-80"></div>
                    </div>

                    {/* Orbit Ring 3 (Tight Ellipse - Subtle detail) */}
                    <div className="absolute w-[160%] h-[40%] rounded-[100%] border border-white/5 animate-[spin_25s_linear_infinite] opacity-40 rotate-45"></div>

                    {/* Main Image Container */}
                    <div className="w-full h-full rounded-full bg-white/5 backdrop-blur-xl shadow-[inset_0_0_50px_rgba(255,255,255,0.2)] border border-yellow-200/10 flex items-center justify-center relative overflow-hidden group-hover:shadow-[inset_0_0_80px_rgba(253,224,71,0.25)] transition-shadow duration-700 z-10">
                         {/* Image */}
                         <img 
                            src="https://duk.tw/3RsIXH.png" 
                            alt="Golden Peanut"
                            className="w-[90%] h-[90%] object-contain filter drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] animate-float relative z-20"
                         />
                         {/* Gloss Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/30 rounded-full pointer-events-none z-30 mix-blend-overlay"></div>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* 
        PRODUCT GRID (Immersive Layout)
      */}
      <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto pt-8 border-t border-white/5">
        <div className="col-span-full mb-2">
             <h3 className="text-2xl font-bold text-white mb-2 font-display">系列商品</h3>
             <p className="text-slate-400 text-sm">點擊商品查看詳細介紹與能量</p>
        </div>

        {products.map((product) => {
           return (
             <div 
                key={product.name} 
                onClick={() => onProductSelect && onProductSelect(product)}
                className="group relative bg-slate-900 rounded-[2rem] border border-white/10 overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] isolate"
             >
                {/* 
                   IMMERSIVE IMAGE AREA 
                */}
                <div className="aspect-[4/5] w-full relative overflow-hidden flex items-center justify-center bg-slate-950/50">
                   
                   {/* Background Glow */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-gold-500/5 blur-[50px] rounded-full group-hover:bg-gold-500/10 transition-colors duration-500"></div>

                   {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] transition-transform duration-[0.8s] group-hover:scale-110 ease-out will-change-transform" 
                      />
                   ) : (
                      <div className="relative z-10 flex items-center justify-center text-slate-500">Loading...</div>
                   )}

                   {/* Seamless Gradient Overlay (Bottom Up) */}
                   <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-20 pointer-events-none"></div>
                </div>

                {/* 
                   CONTENT AREA 
                */}
                <div className="px-6 pb-6 pt-2 relative z-20">
                   <div className="flex justify-between items-end mb-3">
                      <div className="flex-1 pr-4">
                          {/* Tags first for hierarchy */}
                          <div className="flex gap-2 mb-2">
                            {product.tags?.slice(0,2).map(tag => (
                                <span key={tag} className="text-[10px] text-gold-400/80 bg-gold-900/20 px-2 py-0.5 rounded border border-gold-500/10 uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                          </div>
                          <h3 className="text-2xl font-bold text-white font-display tracking-wide group-hover:text-gold-400 transition-colors">
                              {product.name}
                          </h3>
                      </div>
                      
                      {/* Price & BREATHING ACTION BUTTON */}
                      <div className="flex items-center gap-3 pb-1">
                          <span className="text-xl font-bold text-slate-300 font-sans tracking-wide">
                              ${product.price.toLocaleString()}
                          </span>
                          
                          {/* 
                             UPDATED BUTTON: 
                             - Even smaller size (w-6 h-6) for ultimate refinement.
                             - Solid Gold (High Contrast)
                             - Arrow Right Icon (Clear Navigation)
                             - Pulse/Shadow Animation (Breathing Effect)
                          */}
                          <div className="w-6 h-6 rounded-full bg-gold-500 text-slate-900 flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse-slow hover:scale-110 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)] transition-all duration-300 group/btn">
                             <svg className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </div>
                      </div>
                   </div>

                   {/* Description */}
                   {product.highlight ? (
                     <div className="relative pl-3 border-l-2 border-gold-500/30">
                        <p className="text-sm font-medium text-slate-400 leading-relaxed font-sans group-hover:text-slate-300 transition-colors line-clamp-2">
                          {product.highlight}
                        </p>
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 line-clamp-2 font-sans leading-relaxed group-hover:text-slate-400 transition-colors">
                        {product.description}
                     </p>
                   )}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
