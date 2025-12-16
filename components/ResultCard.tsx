
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomerRecord, ShippingDetails, PricingStrategy } from '../types';
import ShippingForm from './ShippingForm';

// Global declaration for Chart.js loaded via CDN
declare var Chart: any;

interface ResultCardProps {
  record: CustomerRecord;
  onReset: () => void;
  onShippingSubmit: (details: ShippingDetails) => void;
  isSyncing?: boolean; // New prop for network status
}

const ResultCard: React.FC<ResultCardProps> = ({ record, onReset, onShippingSubmit, isSyncing = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // NEW: Ref for the success section
  const successRef = useRef<HTMLDivElement>(null);
  
  // FIX: Track mount state to prevent scrolling on page load/tab switch
  const isMounted = useRef(false);

  const [isCopied, setIsCopied] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentUrlCopied, setIsPaymentUrlCopied] = useState(false);

  // Read More State for Analysis
  // Optimization: Default to false (collapsed) for Mobile.
  // Desktop expansion is now handled purely via CSS (md:max-h-none), preventing hydration mismatches.
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  
  // Chart Logic
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  
  // LOGIC FIX: Instead of calculating "Weakest", we focus on the "Lucky Element" (The Solution)
  const [insightTarget, setInsightTarget] = useState<{name: string, type: 'weak' | 'lucky'} | null>(null);

  // Define Pricing Strategy for Custom Orders (Five Elements)
  // Strategy: Base 2400, Shipping 60 (Excluded).
  // Size limit: > 16cm (threshold 16). Surcharge: 200.
  const CUSTOM_STRATEGY: PricingStrategy = {
      type: 'custom',
      basePrice: 2400,
      shippingCost: 60,
      sizeThreshold: 16,
      surcharge: 200
  };

  // Auto-scroll to success section when shipping details are present (order submitted)
  // FIX: Only scroll if component is already mounted (i.e., user just clicked submit), not on initial render.
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPaymentModal]);

  useEffect(() => {
    // Check if Chart is available on window object explicitly cast to any to avoid TS errors
    if (record.analysis && chartRef.current && (window as any).Chart) {
      // Data is now strictly typed as number in the Interface/Schema
      const elements = record.analysis.fiveElements;
      
      const gold = elements.gold;
      const wood = elements.wood;
      const water = elements.water;
      const fire = elements.fire;
      const earth = elements.earth;

      const dataValues = [gold, wood, water, fire, earth];

      // LOGIC UPDATE: Use the AI-determined Lucky Element directly
      // This ensures consistency with the text report.
      // We extract the first character (e.g., "火" from "火 (Fire)") just in case
      let luckyChar = record.analysis.luckyElement ? record.analysis.luckyElement.charAt(0) : '';
      
      // Fallback: If luckyElement is missing, find lowest score (Legacy logic)
      if (!luckyChar) {
          const elementMap = [
              { name: '金', score: gold },
              { name: '木', score: wood },
              { name: '水', score: water },
              { name: '火', score: fire },
              { name: '土', score: earth },
          ];
          const sorted = elementMap.sort((a, b) => a.score - b.score);
          setInsightTarget({ name: sorted[0].name, type: 'weak' });
      } else {
          setInsightTarget({ name: luckyChar, type: 'lucky' });
      }

      // Destroy previous instance
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new (window as any).Chart(chartRef.current, {
        type: 'radar',
        data: {
          // Pure text labels without icons for professional spiritual look
          labels: ['金', '木', '水', '火', '土'],
          datasets: [{
            label: '五行能量',
            data: dataValues,
            backgroundColor: 'rgba(217, 70, 239, 0.4)', // mystic-500 with higher opacity for glow
            borderColor: '#e879f9', // lighter mystic
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#d946ef',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#d946ef',
            pointRadius: 4, // Slightly larger points
            pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0, 
              max: 100,
              angleLines: { 
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1
              },
              grid: { 
                color: 'rgba(255, 255, 255, 0.05)', // Very faint grid
                circular: true
              },
              pointLabels: {
                color: '#e2e8f0', // slate-200
                font: {
                  family: '"Noto Sans TC", sans-serif',
                  size: 14,
                  weight: '700' // Bolder text for character
                },
                padding: 12
              },
              ticks: { display: false, backdropColor: 'transparent' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e879f9',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context: any) {
                        return `能量指數: ${context.raw}`;
                    }
                }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [record.analysis]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("0897979032175");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyPaymentUrl = () => {
    const url = "https://p.ecpay.com.tw/4BCFFAA";
    navigator.clipboard.writeText(url).then(() => {
        setIsPaymentUrlCopied(true);
        setTimeout(() => setIsPaymentUrlCopied(false), 2000);
    }).catch(() => {
        alert("無法自動複製，請手動長按網址複製");
    });
  };

  if (!record.analysis) return null;

  // The Lightbox Content (Rendered via Portal)
  // Payment Modal Content (Portal)
  const paymentModalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans touch-none" style={{ margin: 0 }}>
        {/* Backdrop */}
        <div 
           className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" 
           onClick={() => setShowPaymentModal(false)}
        ></div>
        
        {/* Modal Card - Compact & Center */}
        <div 
          className="relative z-10 bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-scale-in flex flex-col gap-5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
            <div>
                <div className="w-14 h-14 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-emerald-500/30 text-emerald-400">
                    💳
                </div>
                <h3 className="text-xl font-bold text-white mb-2">線上付款</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                    為確保金流交易安全與順暢<br/>
                    請複製網址至 <span className="text-white">Safari</span> 或 <span className="text-white">Chrome</span> 開啟
                </p>
            </div>

            <div 
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group cursor-pointer active:scale-95 transition-transform" 
                onClick={handleCopyPaymentUrl}
            >
                <div className="text-left overflow-hidden pl-2">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">Payment Link</p>
                    <p className="text-sm text-emerald-400 font-mono truncate">p.ecpay.com.tw</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg ${isPaymentUrlCopied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    {isPaymentUrlCopied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <a href="https://p.ecpay.com.tw/4BCFFAA" target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-500 hover:text-white underline py-1 transition-colors">
                    嘗試直接開啟 (不推薦)
                </a>
                <button 
                    onClick={() => setShowPaymentModal(false)} 
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold tracking-wide shadow-lg hover:shadow-emerald-900/20 transition-all active:scale-[0.98]"
                >
                    完成複製 / 關閉
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-12">
  
    {/* PAYMENT MODAL (PORTAL) */}
    {showPaymentModal && createPortal(paymentModalContent, document.body)}

    {/* ✅ 改成單欄版面，移除 lg:flex-row */}
             <div className="text-slate-500 flex flex-col items-center p-6 text-center cursor-default">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               <span className="text-sm font-sans">圖片生成失敗</span>
             </div>
          )}
        </div>

        {/* Content Section */}
          <div className="w-full p-6 md:p-10 flex flex-col justify-center relative max-w-4xl mx-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-mystic-600/5 blur-[60px] pointer-events-none"></div>

          <div className="relative z-10">
            {/* Header Block: Title & Tags Integration */}
            <div className="mb-8 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Mode Badge */}
                        {record.isTimeUnsure ? (
                            <span className="px-2.5 py-1 bg-gold-900/40 border border-gold-500/50 rounded-lg text-[10px] text-gold-400 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.15)] flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                                </span>
                                願望顯化模式
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-mystic-900/40 border border-mystic-500/50 rounded-lg text-[10px] text-mystic-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-mystic-400"></span>
                                五行平衡模式
                            </span>
                        )}
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 leading-tight">
                        {record.name} 的專屬能量
                    </h2>
                </div>
                
                {/* Wish Tags - Integrated Layout */}
                <div className="flex items-start gap-3">
                   {/* Label Icon */}
                   <div className="mt-1 shrink-0 opacity-60">
                      {record.isTimeUnsure ? (
                         <div className="text-xs font-sans text-gold-400 flex flex-col items-center gap-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         </div>
                      ) : (
                         <div className="text-xs font-sans text-mystic-400 flex flex-col items-center gap-0.5">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                      )}
                   </div>

                   <div className="flex flex-wrap gap-2">
                        {record.wishes && Array.isArray(record.wishes) && record.wishes.length > 0 ? (
                            record.wishes.map((w, i) => {
                                const isPrimary = i < 3;
                                // Dynamic Color Logic based on Mode
                                const primaryStyle = record.isTimeUnsure 
                                    ? 'bg-gold-500/10 text-gold-300 border-gold-500/30 shadow-[0_0_8px_rgba(251,191,36,0.1)]' 
                                    : 'bg-mystic-500/10 text-mystic-300 border-mystic-500/30 shadow-[0_0_8px_rgba(217,70,239,0.1)]';
                                
                                const secondaryStyle = 'bg-slate-800/40 border-slate-700/50 text-slate-500 scale-95 opacity-70';

                                return (
                                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-sans border transition-all
                                        ${isPrimary ? primaryStyle : secondaryStyle}
                                    `}>
                                        {w.type}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-slate-500 text-xs italic font-sans py-1">無特別願望</span>
                        )}
                   </div>
                </div>
            </div>

            <div className="space-y-8">
              
              {/* UNIFIED CHART & INSIGHT CARD */}
              <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-1 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-mystic-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-center">
                  
                  {/* Left: Enhanced Chart */}
                  <div className="relative h-[240px] w-full md:w-1/2 flex items-center justify-center p-2 flex-col">
                    <canvas ref={chartRef}></canvas>
                    {/* Glowing Core */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                       <div className="w-16 h-16 bg-mystic-500/20 blur-xl rounded-full"></div>
                    </div>
                    {/* Optional Label for Incomplete Data */}
                    {record.isTimeUnsure && (
                        <span className="text-[10px] text-gold-500/80 mt-[-20px] mb-2 font-sans opacity-90 font-medium bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm">
                            ⚠️ 三柱推算 (僅供參考)
                        </span>
                    )}
                  </div>

                  {/* Right: Insight */}
                  {insightTarget ? (
                    <div className="w-full md:w-1/2 p-6 md:border-l border-t md:border-t-0 border-white/5 flex flex-col justify-center min-h-[200px] relative">
                       <div className="absolute top-4 left-6">
                           <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full
                               ${record.isTimeUnsure 
                                  ? 'text-gold-400 border-gold-500/20 bg-gold-900/10' 
                                  : 'text-mystic-400 border-mystic-500/20 bg-mystic-900/10'}
                           `}>
                             {record.isTimeUnsure ? '願望加持' : '命盤解析'}
                          </span>
                       </div>
                       
                       <div className="mt-6">
                           <h4 className="text-2xl font-bold text-white mb-2 font-sans flex items-center gap-2">
                              {insightTarget.name}
                              <span className="text-sm font-normal text-green-400 bg-green-900/30 px-2 py-0.5 rounded-md border border-green-500/30">
                                {record.isTimeUnsure 
                                    ? '您的顯化能量' 
                                    : (insightTarget.type === 'lucky' ? '您的喜用神' : '能量需補強')
                                }
                              </span>
                           </h4>
                           
                           <p className="text-sm text-slate-300 leading-relaxed font-sans text-justify">
                              {record.isTimeUnsure ? (
                                <>
                                  為達成您的願望，<strong className="text-gold-400 mx-1">{insightTarget.name}</strong> 是您目前最強大的顯化能量。
                                </>
                              ) : (
                                <>
                                  命盤分析顯示，<strong className="text-mystic-300 mx-1">{insightTarget.name}</strong> 是您目前最需要的平衡元素。
                                </>
                              )}
                           </p>
                           
                           <div className="mt-4 pt-4 border-t border-white/5">
                               <p className="text-xs text-slate-400 flex items-start gap-2">
                                  <span className="text-gold-400 mt-0.5">✦</span>
                                  {record.isTimeUnsure ? (
                                     <span>針對您的主要願望，透過特定水晶的{insightTarget.name}行磁場，能有效增強運勢。</span>
                                  ) : (
                                     <span>透過五行互補原理，此手鍊將為您注入{insightTarget.name}行能量，協助達成五行圓滿。</span>
                                  )}
                               </p>
                           </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">
                       分析中...
                    </div>
                  )}
                </div>
              </div>

              {/* Energy Analysis Text (Hybrid Collapsible/Always-Open) */}
              <div>
                <button 
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="w-full flex items-center justify-between text-mystic-300 font-bold mb-4 text-lg font-sans group md:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-mystic-500/10 rounded-full border border-mystic-500/20 text-mystic-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </span>
                    詳細能量報告
                  </div>
                  {/* Arrow: Hidden on Desktop */}
                  <span className={`text-sm text-slate-500 transform transition-transform duration-300 md:hidden ${isAnalysisExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {/* 
                   Content Visibility Logic:
                   - Mobile: Uses max-h-[1500px]/max-h-0 based on React State
                   - Desktop (md:): Forces max-h-none (expanded) & opacity-100 regardless of state
                */}
                <div className={`bg-slate-900/40 rounded-3xl border relative overflow-hidden transition-all duration-500 ease-in-out 
                    ${isAnalysisExpanded ? 'max-h-[1500px] opacity-100 border-white/5' : 'max-h-0 opacity-0 border-transparent'}
                    md:max-h-none md:opacity-100 md:border-white/5
                `}>
                  <div className="p-6 md:p-8 relative z-10">
                    <p className="text-slate-200 leading-loose text-justify text-base md:text-lg font-sans tracking-wide whitespace-pre-line opacity-90">
                      {record.analysis.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping / Order Form Section */}
      <div ref={scrollRef}>
        {!record.shippingDetails ? (
            <ShippingForm 
                onSubmit={onShippingSubmit} 
                isSubmitting={isSyncing} 
                pricingStrategy={CUSTOM_STRATEGY} // Pass Custom Strategy
            />
        ) : (
            /* 
              SUCCESS SECTION (Ref attached here for auto-scroll)
            */
            <div 
               ref={successRef}
               className="mt-8 bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden animate-fade-in-up"
            >
                {/* Header */}
                <div className="text-center mb-10">
                   <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h3 className="text-3xl font-sans font-bold text-white mb-2">訂單資料已送出</h3>
                   <p className="text-slate-300 font-sans">請完成以下步驟以正式成立訂單</p>
                </div>

                {/* Timeline Steps */}
                <div className="space-y-8 max-w-lg mx-auto relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/50">
                    
                    {/* Step 1 */}
                    <div className="relative pl-14">
                        <div className="absolute left-0 top-1 w-10 h-10 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 font-bold z-10 shadow-lg font-display">1</div>
                        <h4 className="text-lg font-bold text-white mb-2 font-sans">確認付款</h4>
                        <div className="mb-3">
                           {/* Calculate Total for Display */}
                           <p className="text-sm text-slate-400 font-sans">總金額 <span className="text-gold-400 font-bold font-sans">${(record.shippingDetails.totalPrice).toLocaleString()}</span></p>
                           {/* Discount Badge */}
                           {record.shippingDetails.discountAmount && record.shippingDetails.discountAmount > 0 && (
                               <div className="inline-block mt-2 px-3 py-1 bg-green-900/20 border border-green-500/20 rounded text-xs text-green-400 font-bold">
                                   已折抵 ${record.shippingDetails.discountAmount} (優惠碼: {record.shippingDetails.couponCode})
                               </div>
                           )}
                        </div>
                        
                        {/* ECPay Button (Mobile Fixed - MODAL TRIGGER) */}
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-[95%] mx-auto block py-3 mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl flex items-center justify-center gap-2 text-white font-bold shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-all group font-sans border border-emerald-400/30 cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            綠界金流線上支付 (信用卡/ATM)
                            <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </button>
                        
                        <div className="text-center text-xs text-slate-500 mb-4 flex items-center justify-center gap-2">
                             <span className="h-px bg-slate-700 w-12"></span>
                             <span>或 銀行轉帳</span>
                             <span className="h-px bg-slate-700 w-12"></span>
                        </div>

                        {/* Bank Info Card */}
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-gold-500/30 relative group overflow-hidden">
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/10 rounded-full blur-xl pointer-events-none"></div>
                           <p className="text-xs text-slate-400 mb-1 font-sans">玉山銀行 (808)</p>
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-xl font-mono text-gold-300 tracking-wider font-bold">0897-9790-32175</span>
                              <button 
                                onClick={handleCopyAccount}
                                className={`text-xs px-3 py-1.5 rounded-md border transition-all flex items-center gap-1 font-sans
                                  ${isCopied 
                                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                                  }`}
                              >
                                {isCopied ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    已複製
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    複製
                                  </>
                                )}
                              </button>
                           </div>
                        </div>
                    </div>

                    {/* Step 2 (Highlighted) */}
                    <div className="relative pl-14">
                        <div className="absolute left-0 top-1 w-10 h-10 bg-mystic-600 border border-mystic-400 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-[0_0_15px_rgba(192,38,211,0.5)] animate-pulse-slow font-display">2</div>
                        <h4 className="text-lg font-bold text-mystic-200 mb-1 font-sans">私訊確認 (關鍵步驟)</h4>
                        <p className="text-sm text-slate-300 mb-3 font-sans">
                           匯款後，請務必私訊 <strong className="text-white">FWP Boutique</strong> 官方 IG 確認訂單。
                        </p>
                        <p className="text-xs text-red-300 bg-red-900/20 p-2 rounded mb-4 border border-red-500/20 flex items-center gap-2 font-sans">
                           <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           待小幫手確認後，訂單才算成立！
                        </p>
                        <div>
                            <a href="https://www.instagram.com/fwp_boutique/" target="_blank" rel="noopener noreferrer" className="w-full text-center py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm font-medium hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 group font-sans">
                               <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.072 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                               私訊 Instagram 確認
                            </a>
                        </div>
                    </div>
                    
                     {/* Step 3 */}
                    <div className="relative pl-14">
                        <div className="absolute left-0 top-1 w-10 h-10 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 font-bold z-10 font-display">3</div>
                        <h4 className="text-lg font-bold text-slate-300 mb-1 font-sans">等待製作</h4>
                        <p className="text-sm text-slate-400 font-sans">
                           確認款項後，製作時間約 30 個工作天 (不含假日)。
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center border-t border-white/5 pt-6">
                    <button onClick={onReset} className="text-slate-400 hover:text-white transition underline text-sm font-sans">
                        回到首頁
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
