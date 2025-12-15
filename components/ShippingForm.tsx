
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShippingDetails, PricingStrategy } from '../types';
import { COUPON_CONFIG } from '../config/coupons';

interface ShippingFormProps {
  onSubmit: (details: ShippingDetails) => void;
  isSubmitting?: boolean;
  pricingStrategy: PricingStrategy;
}

const STORAGE_KEY = 'fwp_shipping_draft_v1';

const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit, isSubmitting = false, pricingStrategy }) => {
  const isStandard = pricingStrategy.type === 'standard';

  // --- 1. Lazy Initialization Strategy (Fixes Data Loss) ---
  const initialDraft = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse draft", e);
      return {};
    }
  }, []);

  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Initialize states with saved data or defaults
  const [realName, setRealName] = useState(initialDraft.realName || '');
  const [phone, setPhone] = useState(initialDraft.phone || '');
  const [storeCode, setStoreCode] = useState(initialDraft.storeCode || '');
  const [storeName, setStoreName] = useState(initialDraft.storeName || '');
  const [socialId, setSocialId] = useState(initialDraft.socialId || '');
  
  // Logic for Wrist Size initialization
  const [wristSize, setWristSize] = useState(() => {
      if (initialDraft.wristSize) return initialDraft.wristSize;
      return isStandard ? '14' : '';
  });
  
  const [isCustomSize, setIsCustomSize] = useState(() => {
      // If standard mode and saved size is NOT 14, it implies custom was toggled
      if (isStandard && initialDraft.wristSize && initialDraft.wristSize !== '14') return true;
      return false;
  });

  const [addPurificationBag, setAddPurificationBag] = useState(initialDraft.addPurificationBag || false);
  const [preferredColors, setPreferredColors] = useState<string[]>(initialDraft.preferredColors || []);
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, amount: number} | null>(null);
  const [couponError, setCouponError] = useState('');

  // Terms agreement state
  const [agreed, setAgreed] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // In-App Browser Detection
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false); // New state for copy feedback

  // Validation & UX State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState<string | null>(null);

  // Refs for Scroll-to-Error
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const storeCodeRef = useRef<HTMLInputElement>(null);
  const storeNameRef = useRef<HTMLInputElement>(null);
  const socialRef = useRef<HTMLInputElement>(null);
  const wristRef = useRef<HTMLInputElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Constants
  const PURIFICATION_BAG_COST = 200;

  // --- Dynamic Pricing Logic ---
  const isSurchargeApplicable = isStandard
    ? isCustomSize
    : (wristSize !== '' && !isNaN(Number(wristSize)) && Number(wristSize) >= pricingStrategy.sizeThreshold);
  
  const baseTotal = 
    pricingStrategy.basePrice + 
    pricingStrategy.shippingCost + 
    (isSurchargeApplicable ? pricingStrategy.surcharge : 0) + 
    (addPurificationBag ? PURIFICATION_BAG_COST : 0);

  // Apply Discount (Ensure total doesn't go below 0)
  const discount = appliedCoupon ? appliedCoupon.amount : 0;
  const totalPrice = Math.max(0, baseTotal - discount);

  // Colors Configuration
  const availableColors = ['紅', '橙', '黃', '綠', '藍', '紫', '白', '黑', '粉'];
  const colorMap: Record<string, string> = {
    '紅': 'bg-red-600', '橙': 'bg-orange-500', '黃': 'bg-yellow-400',
    '綠': 'bg-emerald-600', '藍': 'bg-blue-600', '紫': 'bg-purple-600',
    '白': 'bg-slate-100 border border-slate-300', '黑': 'bg-slate-900 border border-slate-600',
    '粉': 'bg-pink-400',
  };

  // --- Auto-Save Logic (Simplified) ---
  useEffect(() => {
    const draft = {
      realName, phone, storeCode, storeName, socialId, wristSize, addPurificationBag, preferredColors
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    
    // Clear field-specific errors dynamically
    if (realName) clearError('realName');
    if (phone) clearError('phone');
    if (storeCode) clearError('storeCode');
    if (storeName) clearError('storeName');
    if (socialId) clearError('socialId');
    if (wristSize) clearError('wristSize');
    if (agreed) clearError('agreement');

  }, [realName, phone, storeCode, storeName, socialId, wristSize, addPurificationBag, preferredColors, agreed]);

  // Check for restored data on mount
  useEffect(() => {
    if (initialDraft.realName || initialDraft.storeCode) {
      setHasRestoredData(true);
      const timer = setTimeout(() => setHasRestoredData(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [initialDraft]);

  // Detect In-App Browser
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/Line|Instagram|FBAN|FBAV/i.test(ua)) {
      setIsInAppBrowser(true);
    }
  }, []);

  // SCROLL LOCK EFFECT for Modal
  useEffect(() => {
    if (showMapModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMapModal]);

  const clearError = (field: string) => {
    setErrors(prev => {
        if (!prev[field]) return prev;
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
    });
  };

  const triggerShake = (field: string) => {
    setShakingField(field);
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => setShakingField(null), 500);
  };

  // Focus Scroll Helper
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
       target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // --- Handlers ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < phone.length) {
        setPhone(val);
        return;
    }
    const rawValue = val.replace(/[^\d]/g, '');
    const truncated = rawValue.slice(0, 10);
    
    let formatted = truncated;
    if (truncated.length > 7) {
      formatted = `${truncated.slice(0, 4)}-${truncated.slice(4, 7)}-${truncated.slice(7)}`;
    } else if (truncated.length > 4) {
      formatted = `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
    }
    setPhone(formatted);
  };

  const handleStoreCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Auto-parse copy-pasted text from 7-11 map (e.g., "7-11 鑫泰門市 (123456) 台北市...")
    if (val.length > 8) {
       const codeMatch = val.match(/(\d{6})/);
       if (codeMatch) {
          setStoreCode(codeMatch[0]);
          clearError('storeCode');
          
          // Improved Name Parsing
          let possibleName = val.replace(codeMatch[0], '')
              .replace(/7-11/gi, '')
              .replace(/店號/g, '')
              .replace(/[()（）]/g, ' ') // Replace brackets with space
              .replace(/門市/g, '門市 ') // Add space after 門市 to help split
              .trim();
          
          // Try to capture text ending with "門市"
          const nameMatch = possibleName.match(/(\S+門市)/);
          
          if (nameMatch) {
             setStoreName(nameMatch[0]);
             clearError('storeName');
          } else {
             // Fallback: take first significant chunk
             const parts = possibleName.split(/\s+/);
             if (parts.length > 0 && parts[0].length >= 2) {
                 setStoreName(parts[0]);
                 clearError('storeName');
             }
          }
          return;
       }
    }
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setStoreCode(cleanVal);
  };
  
  const handleWristSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      val = val.replace(/cm/i, '').replace(/[^\d.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) return;
      setWristSize(val);
  };

  const toggleColor = (color: string) => {
      if (preferredColors.includes(color)) {
          setPreferredColors(preferredColors.filter(c => c !== color));
      } else {
          setPreferredColors([...preferredColors, color]);
      }
  };

  const handleApplyCoupon = () => {
      setCouponError('');
      if (!couponInput.trim()) return;

      if (!COUPON_CONFIG.isEnabled) {
          setCouponError('目前無進行中的優惠活動');
          return;
      }

      if (couponInput.trim().toUpperCase() === COUPON_CONFIG.code.toUpperCase()) {
          setAppliedCoupon({
              code: COUPON_CONFIG.code,
              amount: COUPON_CONFIG.discountAmount
          });
          setCouponError('');
      } else {
          setCouponError('優惠碼無效或已過期');
          setAppliedCoupon(null);
      }
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!realName.trim()) newErrors.realName = "請填寫真實姓名，以利取貨核對";
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = phone;
    if (!/^09\d{8}$/.test(cleanPhone)) newErrors.phone = "請輸入有效的 10 碼手機號碼 (09開頭)";
    else {
        finalPhone = `${cleanPhone.slice(0,4)}-${cleanPhone.slice(4,7)}-${cleanPhone.slice(7)}`;
        setPhone(finalPhone);
    }
    if (!/^\d{6}$/.test(storeCode)) newErrors.storeCode = "7-11 店號需為 6 碼數字";
    if (!storeName.trim()) newErrors.storeName = "請輸入店名";
    if (!socialId.trim()) newErrors.socialId = "請填寫 IG 或 FB 帳號";
    
    // Updated Wrist Validation
    const sizeNum = parseFloat(wristSize);
    if (!wristSize || isNaN(sizeNum) || sizeNum <= 0 || sizeNum > 30) {
        newErrors.wristSize = "請輸入有效的手圍 (cm)";
    } 

    if (!agreed) newErrors.agreement = "請先閱讀並勾選同意購買須知";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        const firstField = Object.keys(newErrors)[0];
        triggerShake(firstField);
        const refs: Record<string, React.RefObject<HTMLElement>> = {
            realName: nameRef, phone: phoneRef, storeCode: storeCodeRef, storeName: storeNameRef, socialId: socialRef, wristSize: wristRef, agreement: agreementRef
        };
        const targetRef = refs[firstField];
        if (targetRef && targetRef.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (targetRef.current instanceof HTMLInputElement) targetRef.current.focus();
        }
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    onSubmit({
      realName: realName.trim(),
      phone: finalPhone, 
      storeCode: storeCode, 
      storeName: storeName.trim(),
      socialId: socialId.trim(),
      wristSize: wristSize,
      addPurificationBag: addPurificationBag,
      preferredColors: preferredColors,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount: appliedCoupon ? appliedCoupon.amount : undefined,
      totalPrice: totalPrice
    });
  };

  const open711Map = () => {
    setShowMapModal(true);
  };

  const handleCopyMapUrl = () => {
    const url = "https://emap.pcsc.com.tw/";
    navigator.clipboard.writeText(url).then(() => {
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000);
    }).catch(() => {
        // Fallback or explicit instruction if clipboard fails
        alert("無法自動複製，請手動長按網址複製");
    });
  };

  const getInputClass = (field: string) => `
    w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 
    outline-none transition-all duration-300 shadow-inner backdrop-blur-sm font-sans
    ${errors[field] 
       ? 'border-red-500/80 ring-2 ring-red-500/20 bg-red-900/10' 
       : 'border-slate-600/50 focus:ring-2 focus:ring-mystic-500/50 focus:border-mystic-500'}
    ${shakingField === field ? 'animate-shake' : ''}
  `;

  const buttonGradient = isStandard 
      ? 'from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
      : 'from-mystic-600 to-purple-600 hover:from-mystic-500 hover:to-purple-500 hover:shadow-[0_0_20px_rgba(192,38,211,0.4)]';

  // --- Updated Modal Portal Content (Optimized for Mobile) ---
  const mapModalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 font-sans touch-none" style={{ margin: 0 }}>
        {/* Backdrop */}
        <div 
           className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" 
           onClick={() => setShowMapModal(false)}
        ></div>
        
        {/* Modal Card - Compact & Center */}
        <div 
          className="relative z-10 bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-scale-in flex flex-col gap-5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
            <div>
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-slate-700">
                    🌏
                </div>
                <h3 className="text-xl font-bold text-white mb-2">7-11 門市查詢</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                    為避免瀏覽器兼容問題<br/>
                    請複製網址至 <span className="text-white">Safari</span> 或 <span className="text-white">Chrome</span> 開啟
                </p>
            </div>

            <div 
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group cursor-pointer active:scale-95 transition-transform" 
                onClick={handleCopyMapUrl}
            >
                <div className="text-left overflow-hidden pl-2">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">Map URL</p>
                    <p className="text-sm text-blue-400 font-mono truncate">emap.pcsc.com.tw</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg ${isUrlCopied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    {isUrlCopied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                </div>
            </div>

            <button 
                onClick={() => setShowMapModal(false)} 
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold tracking-wide shadow-lg hover:shadow-orange-900/20 transition-all active:scale-[0.98]"
            >
                查詢完畢，返回填寫
            </button>
        </div>
    </div>
  );

  return (
    <div className="mt-8 bg-slate-800/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[50px] rounded-full pointer-events-none"></div>
      
      {/* Data Restored Toast */}
      {hasRestoredData && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className="bg-emerald-600/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold backdrop-blur-md border border-emerald-400/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                已自動恢復您的填寫資料
            </div>
        </div>
      )}

      {/* Render Map Modal via Portal to avoid clipping */}
      {showMapModal && createPortal(mapModalContent, document.body)}

      {/* Integrated Pricing & Order Configuration Card */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-gold-500/30 mb-8 relative overflow-hidden shadow-lg">
         <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 blur-[40px] rounded-full pointer-events-none"></div>
         
         <h4 className="text-gold-400 font-bold mb-5 flex items-center gap-2 text-lg font-sans border-b border-white/10 pb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            訂製規格與費用
         </h4>

         <div className="space-y-6">
            
            {/* 1. Wrist Size Input Area */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 transition-colors duration-300">
               <label className={`text-sm font-medium font-sans flex items-center gap-2 mb-3 ${errors.wristSize ? 'text-red-400' : 'text-white'}`}>
                 <span>📏 手圍尺寸 (cm)</span>
                 {!isStandard && <span className="text-red-400 text-xs bg-red-900/20 px-1.5 py-0.5 rounded border border-red-500/20">*必填</span>}
               </label>

               {isStandard ? (
                   /* STANDARD MODE UI */
                   <div className="space-y-4">
                       {/* Default Badge */}
                       {!isCustomSize && (
                           <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <p className="text-white text-sm font-bold font-sans">固定手圍 14cm</p>
                                    <p className="text-xs text-slate-400 font-sans">若有需要訂製其他尺寸，請勾選下方選項</p>
                                </div>
                           </div>
                       )}

                       {/* Toggle Custom */}
                       <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={isCustomSize}
                                    onChange={(e) => {
                                        setIsCustomSize(e.target.checked);
                                        // Reset logic
                                        if (!e.target.checked) setWristSize('14'); 
                                        else setWristSize('');
                                    }}
                                    className="peer sr-only" 
                                />
                                <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                            </div>
                            <span className={`text-sm font-sans transition-colors ${isCustomSize ? 'text-gold-400 font-bold' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                客製尺寸 (+NT${pricingStrategy.surcharge})
                            </span>
                       </label>

                       {/* Custom Input Slide Down */}
                       <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCustomSize ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="pt-2 pl-2 border-l-2 border-slate-700 ml-5">
                                <p className="text-xs text-slate-400 mb-2">請輸入您實際測量的手圍：</p>
                                <div className="relative w-full max-w-[150px]">
                                    <input
                                        ref={wristRef}
                                        type="text"
                                        required={isCustomSize}
                                        value={wristSize}
                                        onChange={handleWristSizeChange}
                                        onFocus={handleFocus}
                                        className={`${getInputClass('wristSize')} text-center text-lg h-12`}
                                        placeholder="例如 15.5"
                                        inputMode="decimal"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                                </div>
                                {errors.wristSize && <p className="text-xs text-red-400 animate-pulse font-sans mt-1">⚠ {errors.wristSize}</p>}
                            </div>
                       </div>
                   </div>
               ) : (
                   /* CUSTOM MODE UI (Original) */
                   <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-[150px]">
                                <input
                                    ref={wristRef}
                                    type="text"
                                    required
                                    value={wristSize}
                                    onChange={handleWristSizeChange}
                                    onFocus={handleFocus}
                                    className={`${getInputClass('wristSize')} text-center text-lg`}
                                    placeholder="15.0"
                                    inputMode="decimal"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                            </div>
                            
                            <div className={`transition-all duration-300 overflow-hidden flex items-center ${isSurchargeApplicable ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                <span className="text-xs text-gold-400 bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20 whitespace-nowrap font-bold flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                加大費 +${pricingStrategy.surcharge}
                                </span>
                            </div>
                        </div>
                        {errors.wristSize && <p className="text-xs text-red-400 animate-pulse font-sans">⚠ {errors.wristSize}</p>}
                        <p className="text-[10px] text-slate-400 mt-2 font-sans">
                            請服貼測量手腕最細處，不需預留空間。
                            若 <strong className="text-gold-400">{pricingStrategy.sizeThreshold}cm (含) 以上</strong> 將酌收材料費。
                        </p>
                   </div>
               )}
            </div>

            {/* 2. Purification Bag */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group select-none flex-1">
                   <div className="relative flex items-center">
                      <input 
                          type="checkbox" 
                          checked={addPurificationBag}
                          onChange={(e) => setAddPurificationBag(e.target.checked)}
                          className="peer sr-only" 
                      />
                      <div className="w-6 h-6 border-2 border-slate-500 rounded-md bg-slate-800 peer-checked:bg-gold-500 peer-checked:border-gold-500 transition shadow-inner"></div>
                      <svg className="absolute w-4 h-4 text-white left-[4px] top-[5px] opacity-0 peer-checked:opacity-100 pointer-events-none transition transform scale-0 peer-checked:scale-100 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-sm font-medium text-white group-hover:text-gold-300 transition">加購淨化袋</span>
                       <span className="text-xs text-slate-400">定期淨化水晶，保持能量純淨</span>
                   </div>
                </label>
                {addPurificationBag && (
                    <span className="text-xs text-gold-400 bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20 whitespace-nowrap font-bold self-start sm:self-center ml-9 sm:ml-0">
                       +${PURIFICATION_BAG_COST}
                     </span>
                )}
            </div>

            {/* 3. Total Price Summary & Coupon */}
            <div className="bg-slate-950/50 rounded-lg p-4 flex flex-col gap-4 border border-white/5 w-full">
               {/* Coupon Input - FIXED: Using flex-col by default on mobile, ensured w-full */}
               {COUPON_CONFIG.isEnabled && !appliedCoupon && (
                   <div className="flex flex-col sm:flex-row gap-2 w-full">
                       <input 
                           type="text" 
                           placeholder="輸入優惠碼" 
                           value={couponInput}
                           onChange={(e) => setCouponInput(e.target.value)}
                           onFocus={handleFocus}
                           className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-gold-500 outline-none transition min-w-0"
                       />
                       <button 
                           type="button"
                           onClick={handleApplyCoupon}
                           className="w-full sm:w-auto px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition whitespace-nowrap flex-shrink-0"
                       >
                           套用
                       </button>
                   </div>
               )}
               {couponError && <p className="text-xs text-red-400 font-sans">{couponError}</p>}
               {appliedCoupon && (
                   <div className="flex items-center justify-between bg-green-900/20 border border-green-500/30 p-2 rounded-lg w-full">
                       <div className="flex items-center gap-2 overflow-hidden">
                           <span className="w-5 h-5 rounded-full bg-green-500 text-slate-900 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                           <span className="text-sm text-green-400 font-sans truncate">
                               已套用 {COUPON_CONFIG.eventName}
                           </span>
                       </div>
                       <button 
                           type="button" 
                           onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                           className="text-xs text-slate-400 hover:text-white underline ml-2 flex-shrink-0"
                       >
                           移除
                       </button>
                   </div>
               )}

               <div className="h-px bg-white/10 my-1"></div>

               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-slate-400 space-y-1 w-full sm:w-auto font-sans">
                        <div className="flex justify-between sm:justify-start gap-4"><span>商品單價:</span> <span className="text-slate-200">${pricingStrategy.basePrice.toLocaleString()}</span></div>
                        
                        <div className="flex justify-between sm:justify-start gap-4">
                            <span>運費:</span> 
                            {pricingStrategy.shippingCost > 0 ? (
                            <span className="text-slate-200">${pricingStrategy.shippingCost}</span>
                            ) : (
                            <span className="text-green-400 font-bold">免運費 (已包含)</span>
                            )}
                        </div>

                        {isSurchargeApplicable && <div className="flex justify-between sm:justify-start gap-4 text-gold-500/80"><span>客製手圍:</span> <span>+${pricingStrategy.surcharge}</span></div>}
                        {addPurificationBag && <div className="flex justify-between sm:justify-start gap-4 text-gold-500/80"><span>淨化袋:</span> <span>+${PURIFICATION_BAG_COST}</span></div>}
                        {appliedCoupon && <div className="flex justify-between sm:justify-start gap-4 text-green-400 font-bold"><span>優惠折抵:</span> <span>-${appliedCoupon.amount}</span></div>}
                    </div>
                    
                    <div className="flex items-baseline gap-2 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                        <span className="text-sm text-white font-medium">總金額：</span>
                        <span className="text-3xl font-bold text-gold-400 font-sans tracking-wide">
                            ${totalPrice.toLocaleString()}
                        </span>
                    </div>
               </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-400 pt-2 font-sans leading-relaxed">
               <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span>
                  製作時間：確認訂單後約 <span className="text-white font-bold">30 個工作天</span> (不含例假日)。<br/>
                  <span className="opacity-70">* 如需寄送其他國家，請先行私訊詢問運費。</span>
               </span>
            </div>
         </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold font-sans text-white mb-2">填寫出貨資訊</h3>
        <p className="text-slate-400 text-sm font-sans">系統將自動暫存您輸入的資料，請安心填寫。</p>
      </div>

      <form onSubmit={validateAndSubmit} className="space-y-5 relative z-10">
        
        {/* Real Name */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ml-1 font-sans transition-colors ${errors.realName ? 'text-red-400' : 'text-mystic-100'}`}>
            真實姓名 <span className="text-slate-500 text-xs font-normal">(取貨核對用)</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            onFocus={handleFocus}
            className={getInputClass('realName')}
            placeholder="例如：王小美"
          />
          {errors.realName && <p className="text-xs text-red-400 mt-1.5 ml-1 animate-pulse font-sans">⚠ {errors.realName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ml-1 font-sans transition-colors ${errors.phone ? 'text-red-400' : 'text-mystic-100'}`}>
            手機號碼 <span className="text-slate-500 text-xs font-normal">(取貨通知用)</span>
          </label>
          <div className="relative">
            <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onFocus={handleFocus}
                className={`${getInputClass('phone')} font-mono tracking-wider`}
                placeholder="09xx-xxx-xxx"
                inputMode="numeric"
                maxLength={12}
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1.5 ml-1 animate-pulse font-sans">⚠ {errors.phone}</p>}
          </div>
        </div>
        
        {/* 7-11 Store Info Group (Simplified UI) */}
        <div className={`p-5 rounded-2xl border transition-colors duration-300 space-y-4
            ${errors.storeCode || errors.storeName 
                ? 'bg-red-900/10 border-red-500/50' 
                : 'bg-slate-900/30 border-slate-700/50'}
        `}>
            <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                     <label className="text-sm font-medium text-mystic-100 font-sans">7-11 店到店資訊</label>
                 </div>
            </div>

            {/* In-App Browser Warning (Already handled in modal, but hint kept) */}
            {isInAppBrowser && (
                <div className="bg-yellow-900/10 border border-yellow-500/20 p-2.5 rounded-lg flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <div className="text-xs text-yellow-200/80 leading-relaxed font-sans mt-0.5">
                        若地圖無法開啟，請點右上角「...」選擇「在瀏覽器中開啟」。
                    </div>
                </div>
            )}

            {/* Step 1: Find Store */}
            <div>
                <button 
                    type="button"
                    onClick={open711Map}
                    className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-800 hover:from-slate-700 hover:to-slate-700 border border-slate-600 rounded-xl text-orange-400 font-medium text-sm flex items-center justify-center gap-2 transition group cursor-pointer shadow-sm"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    查詢 7-11 門市 (獲取店號)
                </button>
            </div>

            {/* Step 2: Fill Data */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Store Code */}
                <div>
                    <input
                        ref={storeCodeRef}
                        type="text"
                        value={storeCode}
                        onChange={handleStoreCodeChange}
                        onFocus={handleFocus}
                        className={`${getInputClass('storeCode')} font-mono tracking-wider text-center`}
                        placeholder="店號 (6碼)"
                        inputMode="numeric"
                    />
                    {errors.storeCode && <p className="text-xs text-red-400 mt-1.5 animate-pulse font-sans text-center">⚠ {errors.storeCode}</p>}
                </div>

                {/* Store Name */}
                <div>
                    <input
                        ref={storeNameRef}
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        onFocus={handleFocus}
                        className={`${getInputClass('storeName')} text-center`}
                        placeholder="門市名稱"
                    />
                        {errors.storeName && <p className="text-xs text-red-400 mt-1.5 animate-pulse font-sans text-center">⚠ {errors.storeName}</p>}
                </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center">* 支援直接貼上地圖複製的完整文字，系統會自動辨識</p>
        </div>

        {/* Social ID */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ml-1 font-sans transition-colors ${errors.socialId ? 'text-red-400' : 'text-mystic-100'}`}>
            IG 或 FB 帳號 <span className="text-slate-500 text-xs font-normal">(溝通聯繫用)</span>
          </label>
          <input
            ref={socialRef}
            type="text"
            value={socialId}
            onChange={(e) => setSocialId(e.target.value)}
            onFocus={handleFocus}
            className={getInputClass('socialId')}
            placeholder="例如：@crystal_aura_123"
          />
          {errors.socialId && <p className="text-xs text-red-400 mt-1.5 ml-1 animate-pulse font-sans">⚠ {errors.socialId}</p>}
        </div>
        
        {/* Preferred Colors - ONLY FOR CUSTOM ORDERS */}
        {pricingStrategy.type === 'custom' && (
            <div>
            <label className="block text-sm font-medium text-mystic-100 mb-3 ml-1 font-sans">
                喜好色系 <span className="text-slate-400 text-xs font-sans">(選填、可多選)</span>
            </label>
            <div className="flex flex-wrap gap-4 mb-4">
                {availableColors.map(color => {
                    const isSelected = preferredColors.includes(color);
                    const colorClass = colorMap[color] || 'bg-slate-800';
                    
                    return (
                        <button
                            key={color}
                            type="button"
                            onClick={() => toggleColor(color)}
                            title={color}
                            className={`relative w-10 h-10 rounded-full transition-all duration-300 shadow-md
                            ${colorClass}
                            ${isSelected 
                                ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-mystic-500 scale-110 z-10' 
                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                            <span className="sr-only">{color}</span>
                            {/* Selected Checkmark */}
                            {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className={`w-5 h-5 ${['白','黃'].includes(color) ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            )}
                        </button>
                    );
                })}
            </div>
            </div>
        )}

        {/* Purchase Terms Accordion */}
        <div 
           ref={agreementRef}
           className={`border rounded-xl overflow-hidden mt-6 transition-colors duration-300
             ${errors.agreement 
                ? 'border-red-500/50 bg-red-900/10' 
                : 'border-slate-700/50 bg-slate-900/30'}
             ${shakingField === 'agreement' ? 'animate-shake' : ''}
           `}
        >
            <button
               type="button"
               onClick={() => setIsTermsOpen(!isTermsOpen)}
               className="w-full flex justify-between items-center p-4 bg-slate-800/50 hover:bg-slate-800 transition text-left group"
            >
               <span className={`text-sm font-medium flex items-center gap-2 font-sans transition-colors ${errors.agreement ? 'text-red-400' : 'text-slate-200'}`}>
                  <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  購買須知 {errors.agreement && '(請開啟閱讀)'}
               </span>
               <span className={`transform transition-transform duration-300 text-slate-400 ${isTermsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${isTermsOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
               <div className="p-4 text-xs text-slate-400 space-y-3 leading-relaxed border-t border-slate-700/50 bg-slate-950/30 h-64 overflow-y-auto custom-scrollbar font-sans">
                  <p><strong className="text-slate-300">1.</strong> 由於此商品屬客製化產品，因此恕不接受退換貨服務。</p>
                  <p><strong className="text-slate-300">2.</strong> 天然石或多或少都會有冰棉裂坑或是偶有黑點，這些都是天然的共生所在，並非瑕疵或損壞。</p>
                  <p><strong className="text-slate-300">3.</strong> 每批礦石的產地、大小、形狀、色澤皆不同，因此每款水晶飾品皆為獨一無二的單品，照片僅為參考示意圖，無法要求產品完全相同，但設計時都會使用同款水晶搭配，所以功效都是相同的喔！</p>
                  <p><strong className="text-slate-300">4.</strong> 資料填寫完成，並完成付款後，請務必要私訊給我們，才算確認訂單喔！（若未完成、將不會另行通知）</p>
                  <p><strong className="text-slate-300">5.</strong> 手鍊皆是依據個人命盤及需求搭配設計，設計完成後才會提供照片，為使功效能完整發揮，所以是沒辦法調整設計的喔😊</p>
                  <p><strong className="text-slate-300">6.</strong> 手鍊中之金屬佩飾為14K金包金，因個人使用習慣及配戴方式，隨著配戴時間增加將可能有磨損及氧化現象，建議配戴時建議避免摩擦及保持乾燥，將有助拉長使用壽命。</p>
                  <p><strong className="text-slate-300">7.</strong> 飾品自售出後將提供30天保固服務，若飾品非人為因素損壞（如拉扯、掉落損壞）將可免費寄回維修，自售出後第31天起，將不再提供保固。另水晶手鏈若非人為因素自行斷裂，代表水晶為我們擋下了不好的磁場，因此也不建議繼續維修配戴喔。</p>
                  <p><strong className="text-slate-300">8.</strong> 飾品皆屬於消耗性產品，若希望商品永遠不會磨損、氧化或損壞之高標準者，請勿訂購。</p>
                  <p><strong className="text-slate-300">9.</strong> 請確認要購買再填寫表單，若填寫後48小時內未付款將是為棄單，未來將列為黑名單，無法再購買店內任何商品。</p>
               </div>
            </div>
         </div>

         {/* Agreement Checkbox */}
         <label className="flex items-start gap-3 mt-4 cursor-pointer group select-none">
            <div className="relative flex items-center mt-0.5">
               <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer sr-only"
               />
               <div className={`w-5 h-5 border-2 rounded transition shadow-inner
                  ${errors.agreement 
                    ? 'border-red-500 bg-red-900/30' 
                    : 'border-slate-500 bg-slate-900/50 peer-checked:bg-mystic-600 peer-checked:border-mystic-500'}
               `}></div>
               <svg className="absolute w-3.5 h-3.5 text-white left-[3px] top-[4px] opacity-0 peer-checked:opacity-100 pointer-events-none transition transform scale-0 peer-checked:scale-100 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className={`text-sm transition duration-300 font-sans ${errors.agreement ? 'text-red-400' : agreed ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
               我已詳閱並同意上述購買須知與條款
            </span>
         </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-4 py-4 rounded-xl font-bold text-lg tracking-widest shadow-lg transition-all duration-300 font-sans flex items-center justify-center gap-3
            ${isSubmitting
              ? 'bg-slate-700/50 cursor-not-allowed text-slate-500'
              : `bg-gradient-to-r ${buttonGradient} text-white hover:scale-[1.01] active:scale-[0.99]`
            }`}
        >
          {isSubmitting && (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          {isSubmitting ? '雲端同步中...' : '確認送出訂單'}
        </button>
      </form>
    </div>
  );
};

export default ShippingForm;
