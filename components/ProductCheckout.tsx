
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomerRecord, ShippingDetails, PricingStrategy } from '../types';
import ShippingForm from './ShippingForm';
import { ProductEntry } from '../services/productDatabase';

interface ProductCheckoutProps {
  record: CustomerRecord;
  product: ProductEntry;
  onBack: () => void;
  onShippingSubmit: (details: ShippingDetails) => void;
  isSyncing: boolean;
}

const ProductCheckout: React.FC<ProductCheckoutProps> = ({ record, product, onBack, onShippingSubmit, isSyncing }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isBenefitsOpen, setIsBenefitsOpen] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentUrlCopied, setIsPaymentUrlCopied] = useState(false);

  // FIX: Track mount state to prevent scrolling on page load/tab switch
  const isMounted = useRef(false);

  // Define Pricing Strategy for Marketplace (Peanut Series)
  // Strategy: Base price (2480) includes shipping.
  // Size limit: > 14cm (threshold 14). Surcharge: 200.
  const STANDARD_STRATEGY: PricingStrategy = {
      type: 'standard',
      basePrice: product.price, // Uses the price from DB (e.g. 2480)
      shippingCost: 0,          // Included in base price
      sizeThreshold: 14,        // 14cm
      surcharge: 200            // +200 if >= 14cm
  };

  // Auto-scroll logic for success
  useEffect(() => {
    if (isMounted.current) {
        if (record.shippingDetails && successRef.current) {
            successRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // Initial mount - do not scroll, just set flag
        isMounted.current = true;
    }
  }, [record.shippingDetails]);
  
  // SCROLL LOCK EFFECT for Payment Modal
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPaymentModal]);

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
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-12 pt-4">
        {/* PAYMENT MODAL (PORTAL) */}
        {showPaymentModal && createPortal(paymentModalContent, document.body)}

        {/* Back Button */}
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition group bg-slate-800/50 px-4 py-2 rounded-full border border-white/5 w-fit">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            回到市集
        </button>

        <div className="flex flex-col lg:flex-row gap-10 items-start mb-12">
            
            {/* Product Image */}
            <div className="w-full lg:w-1/2 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative bg-slate-900 h-fit">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900/80 to-slate-950 z-0"></div>
                
                {product.imageUrl ? (
                    <img 
                        src={product.imageUrl} 
                        alt={record.name} 
                        className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] block" 
                    />
                ) : (
                    <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 relative z-10">
                        <span className="text-4xl mb-4 opacity-50">💎</span>
                        <span className="text-sm">暫無實品圖</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="w-full lg:w-1/2 space-y-8 pt-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold font-display text-white mb-4 leading-tight">
                        {record.name}
                    </h1>
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="text-xs font-bold text-gold-400 bg-gold-900/20 px-3 py-1 rounded-full border border-gold-500/20">
                            ✨ 好事花生系列
                        </span>
                        {product.tags.map(tag => (
                            <span key={tag} className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    {/* Typography improvements: text-base on mobile, text-lg on desktop. text-left to avoid gaps. Increased tracking. */}
                    <p className="text-slate-300 leading-[2] md:leading-loose text-left text-base md:text-lg opacity-90 font-light whitespace-pre-line tracking-wide">
                        {product.description}
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-800/40 border border-white/10 flex items-center justify-between shadow-inner">
                    <span className="text-slate-400 font-medium">商品單價</span>
                    <span className="text-4xl font-bold text-gold-400 font-sans tracking-wide">
                        ${product.price.toLocaleString()}
                    </span>
                </div>

                {/* Benefits List (Collapsible) */}
                <div className="border-t border-white/10 pt-4">
                     <button 
                        onClick={() => setIsBenefitsOpen(!isBenefitsOpen)}
                        className="w-full flex justify-between items-center py-2 text-left group"
                     >
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 group-hover:text-gold-400 transition-colors">
                            <span className="text-gold-500">✦</span> 能量與材質
                        </h3>
                        <span className={`text-slate-500 transition-transform duration-300 ${isBenefitsOpen ? 'rotate-180' : ''}`}>▼</span>
                     </button>
                     
                     <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isBenefitsOpen ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <ul className="space-y-3 text-slate-400">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0"></div>
                                <span>精選天然礦石，獨一無二的紋理與色澤</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0"></div>
                                <span>14K 包金/鍍金高保色配件</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0"></div>
                                <span>大師級淨化與啟動儀式，注入正向能量</span>
                            </li>
                        </ul>
                     </div>
                </div>
            </div>
        </div>

        {/* Shipping Form or Success View */}
        <div ref={scrollRef} className="border-t border-white/10 pt-12 mt-8">
            <h3 className="text-3xl font-bold text-white mb-2 text-center font-display">
                立即訂購
            </h3>
            <p className="text-center text-slate-400 mb-10">填寫下方資料，將好運帶回家</p>
            
            {!record.shippingDetails ? (
                <ShippingForm 
                    onSubmit={onShippingSubmit} 
                    isSubmitting={isSyncing} 
                    pricingStrategy={STANDARD_STRATEGY} // Pass standard strategy
                />
            ) : (
                /* SUCCESS SECTION */
                <div 
                   ref={successRef}
                   className="bg-slate-800/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden animate-fade-in-up"
                >
                    {/* Header */}
                    <div className="text-center mb-10">
                       <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <h3 className="text-3xl font-sans font-bold text-white mb-2">訂單資料已送出</h3>
                       <p className="text-slate-300 font-sans">請完成以下步驟以正式成立訂單</p>
                    </div>

                    {/* Timeline Steps */}
                    <div className="space-y-10 max-w-lg mx-auto relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700/50">
                        
                        {/* Step 1 */}
                        <div className="relative pl-16">
                            <div className="absolute left-0 top-1 w-10 h-10 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 font-bold z-10 shadow-lg font-display">1</div>
                            <h4 className="text-xl font-bold text-white mb-2 font-sans">確認付款</h4>
                            <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5 inline-block">
                               <p className="text-sm text-slate-400 font-sans">
                                   訂單總金額 (含運)： <span className="text-gold-400 font-bold font-sans text-xl ml-2">${(record.shippingDetails.totalPrice).toLocaleString()}</span>
                               </p>
                               {/* Discount Badge */}
                               {record.shippingDetails.discountAmount && record.shippingDetails.discountAmount > 0 && (
                                   <div className="block mt-2 px-3 py-1 bg-green-900/20 border border-green-500/20 rounded text-xs text-green-400 font-bold text-center">
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
                            <div className="bg-slate-900/80 p-5 rounded-2xl border border-gold-500/30 relative group overflow-hidden shadow-lg">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-gold-500/10 rounded-full blur-xl pointer-events-none"></div>
                               <p className="text-xs text-slate-400 mb-1 font-sans">玉山銀行 (808)</p>
                               <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-2xl font-mono text-gold-300 tracking-wider font-bold">0897-9790-32175</span>
                                  <button 
                                    onClick={handleCopyAccount}
                                    className={`text-xs px-4 py-2 rounded-lg border transition-all flex items-center gap-1 font-sans font-bold
                                      ${isCopied 
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                                      }`}
                                  >
                                    {isCopied ? '已複製' : '複製帳號'}
                                  </button>
                               </div>
                            </div>
                        </div>

                        {/* Step 2 (Highlighted) */}
                        <div className="relative pl-16">
                            <div className="absolute left-0 top-1 w-10 h-10 bg-mystic-600 border border-mystic-400 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-[0_0_15px_rgba(192,38,211,0.5)] animate-pulse-slow font-display">2</div>
                            <h4 className="text-xl font-bold text-mystic-200 mb-1 font-sans">私訊確認 (關鍵)</h4>
                            <p className="text-sm text-slate-300 mb-4 font-sans leading-relaxed">
                               匯款後，請務必私訊 <strong className="text-white">FWP Boutique</strong> 官方 IG 確認訂單。
                            </p>
                            
                            <a href="https://www.instagram.com/fwp_boutique/" target="_blank" rel="noopener noreferrer" className="w-full text-center py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:opacity-90 transition shadow-lg flex items-center justify-center gap-3 group font-sans hover:scale-[1.02]">
                               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.072 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                               私訊 Instagram 通知已匯款
                            </a>
                        </div>
                        
                         {/* Step 3 */}
                        <div className="relative pl-16">
                            <div className="absolute left-0 top-1 w-10 h-10 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 font-bold z-10 font-display">3</div>
                            <h4 className="text-xl font-bold text-slate-300 mb-1 font-sans">等待製作</h4>
                            <p className="text-sm text-slate-400 font-sans">
                               確認款項後，製作時間約 30 個工作天 (不含假日)。
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 text-center border-t border-white/5 pt-6">
                        <button onClick={onBack} className="text-slate-400 hover:text-white transition underline text-sm font-sans">
                            繼續購物
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProductCheckout;
