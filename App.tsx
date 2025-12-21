
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CustomerRecord, CustomerProfile, LoadingState, ShippingDetails } from './types';
import CustomerForm from './components/CustomerForm';
import ResultCard from './components/ResultCard';
import Marketplace from './components/Marketplace';
import BottomNav from './components/BottomNav';
import CRMList from './components/CRMList';
import ProductCheckout from './components/ProductCheckout'; 
import ZodiacSelector from './components/ZodiacSelector'; // Import
import { analyzeCustomerProfile, generateBraceletImage } from './services/geminiService';
import { syncToGoogleSheet, sendTestPing } from './services/googleSheetService';
import { dbService } from './services/dbService';
import { ProductEntry } from './services/productDatabase';
import { COUPON_CONFIG } from './config/coupons';

// --- GLOBAL CONFIGURATION (PaaS Environment Variable) ---
const HARDCODED_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqYWciELSJfaK1gyD1pP2SBvjymFYXgIjD65xYDzn3seQwYIw3VyHkGSQ2O_tnf8Dq/exec";

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'shop' | 'customize' | 'mine'>('shop');
  
  // Shop State (Updated for Zodiac)
  const [shopView, setShopView] = useState<'list' | 'zodiac' | 'checkout'>('list');
  const [checkoutOrigin, setCheckoutOrigin] = useState<'list' | 'zodiac'>('list'); // Track where user came from
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry & { name: string } | null>(null);

  // --- STATE SEPARATION: Double-Track Records ---
  // Track 1: Custom Analysis Record (Persists when switching tabs)
  const [customAnalysisRecord, setCustomAnalysisRecord] = useState<CustomerRecord | null>(null);
  
  // Track 2: Shop Temporary Record (Transient for checkout)
  const [shopTempRecord, setShopTempRecord] = useState<CustomerRecord | null>(null);

  // Common State
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'result'>('form');
  
  // Ref for auto-scrolling
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Sync Status State
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Admin/Mine State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Google Sheet Configuration
  const isGlobalConfigMode = !!HARDCODED_SCRIPT_URL;
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  
  // Connection Test State
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionFeedback, setConnectionFeedback] = useState<string>('');

  // Background Stars
  const [stars, setStars] = useState<Array<{top: string, left: string, size: string, duration: string, delay: string, opacity: number}>>([]);

  // Loading Storytelling State
  const [loadingMessage, setLoadingMessage] = useState('');

  // --- SCROLL MANAGEMENT ---
  // Simple scroll to top on navigation change, allowing natural browser behavior
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, shopView, view]); 

  useEffect(() => {
    // Initialize Config Strategy
    if (isGlobalConfigMode) {
      setGoogleScriptUrl(HARDCODED_SCRIPT_URL.trim());
    } else {
      const localUrl = localStorage.getItem('crystal_google_script_url');
      if (localUrl) setGoogleScriptUrl(localUrl);
    }

    // Create random stars
    const newStars = Array.from({ length: 50 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.7 + 0.3
    }));
    setStars(newStars);

    // Load data
    const loadData = async () => {
      try {
        const records = await dbService.getAllCustomers();
        setCustomers(records);
      } catch (e) {
        console.error("Failed to load DB data", e);
      }
    };
    loadData();
    
    // Check local storage for admin session
    const savedAdmin = localStorage.getItem('fwp_admin_session');
    if (savedAdmin === 'true') setIsAdmin(true);

  }, [isGlobalConfigMode]);

  // Progressive Loading Text Logic
  useEffect(() => {
  if (loadingState === 'analyzing') {  // ✅ 移除 || loadingState === 'generating_image'
    const messages = [
      "正在繪製八字命盤...",
      "分析五行能量分佈...",
      "推算喜用神與互補元素..."
      // ❌ 刪除："正在凝聚專屬水晶能量..."
    ];
    let index = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2500);

    return () => clearInterval(interval);
  }
}, [loadingState]);

  const handleTestConnection = async () => {
    const trimmedUrl = googleScriptUrl.trim();
    if (!trimmedUrl) {
      setConnectionStatus('error');
      setConnectionFeedback('無效的網址');
      return;
    }

    setConnectionStatus('testing');
    setConnectionFeedback('正在嘗試連接 Google Apps Script...');
    
    try {
      await sendTestPing(trimmedUrl);
      setConnectionStatus('success');
    } catch (e: any) {
      console.error(e);
      setConnectionStatus('error');
      setConnectionFeedback(e.message || '發送失敗，請檢查網址與權限。');
    }
  };

const handleFormSubmit = async (profileData: Omit<CustomerProfile, 'id' | 'createdAt'>) => {
  setLoadingState('analyzing');
  setErrorMessage(null);

  const newProfile: CustomerProfile = {
    ...profileData,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    wishes: profileData.wishes || []
  };

  try {
    // 步驟 1: 分析八字
    const analysis = await analyzeCustomerProfile(newProfile);
    
    // ❌ 移除：setLoadingState('generating_image');
    // ❌ 移除：const imageUrl = await generateBraceletImage(analysis, newProfile);

    // 步驟 2: 建立完整記錄（圖片欄位直接設為空字串）
    const fullRecord: CustomerRecord = {
      ...newProfile,
      analysis,
      generatedImageUrl: "", // ✅ 不再生成圖片
    };

    // 步驟 3: 儲存到資料庫
    await dbService.addCustomer(fullRecord);
    const updatedRecords = await dbService.getAllCustomers();
    setCustomers(updatedRecords);
    
    // 步驟 4: 顯示結果
    setCustomAnalysisRecord(fullRecord);
    setLoadingState('completed');
    setView('result');

  } catch (error: any) {
    console.error(error);
    setErrorMessage(error.message || "發生未知錯誤");
    setLoadingState('error');
  }
};

  const handleCustomShippingSubmit = async (details: ShippingDetails) => {
    if (!customAnalysisRecord) return;
    setIsSyncing(true);

    const updatedRecord = { ...customAnalysisRecord, shippingDetails: details };
    await dbService.updateCustomer(updatedRecord);
    
    const updatedRecords = await dbService.getAllCustomers();
    setCustomers(updatedRecords);
    setCustomAnalysisRecord(updatedRecord);

    if (googleScriptUrl) {
      await syncToGoogleSheet(updatedRecord, googleScriptUrl);
    }
    setIsSyncing(false);
  };

  // --- Logic for Marketplace ---
  
  // Accepts origin to know where to go back
  const handleProductSelect = (product: ProductEntry & { name: string }, origin: 'list' | 'zodiac') => {
      setSelectedProduct(product);
      setCheckoutOrigin(origin); // Save origin
      
      const tempRecord: CustomerRecord = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          name: product.name,
          gender: '其他' as any,
          birthDate: '',
          birthTime: '',
          wishes: [],
          isStandardProduct: true,
          generatedImageUrl: product.imageUrl,
          analysis: {
              zodiacSign: '',
              element: product.element,
              bazi: { year: '', month: '', day: '', time: '' },
              fiveElements: { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 },
              luckyElement: product.element,
              suggestedCrystals: [product.name],
              reasoning: product.description,
              visualDescription: '標準商品',
              colorPalette: []
          }
      };
      
      setShopTempRecord(tempRecord);
      setShopView('checkout');
  };

  const handleProductBack = () => {
      // Go back to where we came from
      setShopView(checkoutOrigin); 
      setSelectedProduct(null);
      setShopTempRecord(null);
  };
  
  const handleStandardOrderSubmit = async (details: ShippingDetails) => {
      if (!shopTempRecord) return;
      setIsSyncing(true);
      
      const completedRecord = { ...shopTempRecord, shippingDetails: details };
      await dbService.addCustomer(completedRecord); 
      
      const updatedRecords = await dbService.getAllCustomers();
      setCustomers(updatedRecords);
      setShopTempRecord(completedRecord);

      if (googleScriptUrl) {
          await syncToGoogleSheet(completedRecord, googleScriptUrl);
      }
      setIsSyncing(false);
  };
  // --------------------------------

  const handleReset = () => {
    setCustomAnalysisRecord(null);
    setView('form');
    setLoadingState('idle');
    setErrorMessage(null);
  };

  const submitLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (adminPasswordInput === '8888') {
      setIsAdmin(true);
      localStorage.setItem('fwp_admin_session', 'true');
    } else {
      alert('密碼錯誤');
      setAdminPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('fwp_admin_session');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ 代碼已複製！");
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 text-slate-200 font-sans selection:bg-mystic-500 selection:text-white flex flex-col relative">
      
      {/* Global Background Effects */}
      <div className="noise-overlay"></div>
      <div className="stars">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              '--duration': star.duration,
              '--delay': star.delay,
              '--opacity': star.opacity
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Header */}
      <header className="pt-6 pb-2 md:pt-10 md:pb-6 text-center relative shrink-0 z-10 px-4 w-full">
        <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-200 via-white to-mystic-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2 md:mb-3 animate-float tracking-wider cursor-pointer" onClick={() => { setActiveTab('shop'); setShopView('list'); }}>
          FWP Boutique
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-mystic-500"></div>
          <p className="relative text-mystic-300 tracking-[0.4em] text-[10px] md:text-sm uppercase font-bold font-sans">追求最純凈的美好</p>
          <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-mystic-500"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 md:px-6 relative z-10 flex-grow w-full max-w-7xl">
        
        {/* Error Notification */}
        {errorMessage && activeTab === 'customize' && (
          <div className="max-w-md mx-auto mb-6 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-center backdrop-blur-sm shadow-lg animate-fade-in-up font-sans">
            {errorMessage}
            <button onClick={() => setErrorMessage(null)} className="ml-4 underline hover:text-white">Close</button>
          </div>
        )}

        {/* Loading Overlay */}
        {(loadingState === 'analyzing' || loadingState === 'generating_image') && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
             <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-2 border-mystic-900/50 rounded-full scale-110"></div>
              <div className="absolute inset-0 border-t-2 border-mystic-400 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-slate-800 rounded-full"></div>
            </div>
            <h3 className="text-2xl md:text-3xl font-sans font-bold text-white animate-pulse tracking-wide text-center px-4">
              {loadingMessage || '正在啟動能量分析...'}
            </h3>
            <p className="text-mystic-400/70 mt-4 text-sm font-normal tracking-wider font-sans opacity-80">
                凝聚天地能量，探尋命理奧秘
            </p>
          </div>
        )}

        {/* --- TAB CONTENT SWITCHER --- */}
        
        {/* TAB 1: SHOP / MARKETPLACE */}
        {activeTab === 'shop' && (
           <>
              {shopView === 'list' && (
                  <Marketplace 
                    onProductSelect={(p) => handleProductSelect(p, 'list')}
                    onOpenZodiac={() => setShopView('zodiac')} 
                  />
              )}
              {shopView === 'zodiac' && (
                  <ZodiacSelector 
                    onBack={() => setShopView('list')}
                    onProductSelect={(p) => handleProductSelect(p, 'zodiac')}
                  />
              )}
              {/* Checkout */}
              {shopView === 'checkout' && shopTempRecord && selectedProduct && (
                  <ProductCheckout 
                     record={shopTempRecord}
                     product={selectedProduct}
                     onBack={handleProductBack}
                     onShippingSubmit={handleStandardOrderSubmit}
                     isSyncing={isSyncing}
                  />
              )}
           </>
        )}

        {/* TAB 2: CUSTOMIZE (Original Logic) */}
        {activeTab === 'customize' && (
          <div className="flex flex-col items-center gap-8 min-h-[50vh]">
            
            {/* Intro Card */}
            {view === 'form' && (
              <div className="w-full max-w-lg mx-auto bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-white/5 animate-fade-in-up">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-sans font-bold text-mystic-200 tracking-widest">
                    五行能量 • 靈性補足
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal font-sans">
                    透過 AI 八字推算，找出您命盤中缺乏的五行元素，<br/>
                    量身打造專屬水晶手串。
                  </p>
                </div>
              </div>
            )}

            {view === 'form' ? (
                 <CustomerForm 
                   onSubmit={handleFormSubmit} 
                   isProcessing={loadingState !== 'idle' && loadingState !== 'error' && loadingState !== 'completed'} 
                 />
            ) : (
              customAnalysisRecord && (
                <div ref={resultRef} className="w-full">
                  <ResultCard 
                      record={customAnalysisRecord} 
                      onReset={handleReset}
                      onShippingSubmit={handleCustomShippingSubmit}
                      isSyncing={isSyncing} 
                  />
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 3: MINE / ADMIN */}
        {activeTab === 'mine' && (
           <div className="w-full max-w-6xl mx-auto animate-fade-in pb-12">
              {!isAdmin ? (
                 /* Login Form */
                 <div className="max-w-xs mx-auto mt-20 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold font-sans text-white mb-2 text-center">管理員登入</h3>
                    <p className="text-xs text-slate-400 text-center mb-6">請輸入後台管理密碼</p>
                    <form onSubmit={submitLogin}>
                       <input 
                         type="password" 
                         value={adminPasswordInput} 
                         onChange={(e) => setAdminPasswordInput(e.target.value)} 
                         className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white mb-6 text-center tracking-widest font-sans outline-none focus:border-mystic-500 transition" 
                         placeholder="密碼" 
                       />
                       <button type="submit" className="w-full py-3 rounded-xl bg-mystic-700 hover:bg-mystic-600 text-white font-bold transition shadow-lg">
                          登入系統
                       </button>
                    </form>
                 </div>
              ) : (
                 /* Admin Dashboard */
                 <div>
                    <div className="flex justify-between items-center mb-8 bg-slate-800/30 p-4 rounded-xl border border-white/5">
                        <div>
                           <h2 className="text-2xl font-bold text-white">後台管理中心</h2>
                           <p className="text-sm text-slate-400">系統設定與客戶資料庫</p>
                        </div>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-red-900/50 text-slate-200 hover:text-red-200 text-sm transition">
                           登出
                        </button>
                    </div>

                    {/* CRM List */}
                    <CRMList 
                      customers={customers} 
                      onSelect={(rec) => { 
                          if (rec.isStandardProduct) {
                              const dummyProduct: ProductEntry = {
                                  name: rec.name,
                                  description: rec.analysis?.reasoning || '',
                                  imageUrl: rec.generatedImageUrl || '',
                                  price: rec.shippingDetails?.totalPrice || 0, 
                                  element: rec.analysis?.element || '金',
                                  fixedPrompt: '',
                                  tags: []
                              };
                              setSelectedProduct(dummyProduct as any);
                              setShopTempRecord(rec);
                              setShopView('checkout');
                              setCheckoutOrigin('list'); // Admin view return default
                              setActiveTab('shop');
                          } else {
                              setCustomAnalysisRecord(rec);
                              setView('result'); 
                              setActiveTab('customize'); 
                          }
                      }}
                      onDelete={async (id) => {
                          await dbService.deleteCustomer(id);
                          setCustomers(await dbService.getAllCustomers());
                      }}
                    />
                    
                    {/* System Config Section */}
                    <div className="mt-12 pt-8 border-t border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                           <span className="text-gold-400">⚙️</span> 系統連線設定
                        </h3>

                        {/* Coupon Status Badge */}
                        <div className="mb-6 bg-slate-800/60 border border-slate-600 rounded-2xl p-6">
                            <h4 className="text-sm text-slate-400 mb-3 font-bold uppercase tracking-wide">目前優惠活動狀態</h4>
                            <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${COUPON_CONFIG.isEnabled ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                                <div className={`w-3 h-3 rounded-full ${COUPON_CONFIG.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className={`font-bold ${COUPON_CONFIG.isEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                        {COUPON_CONFIG.isEnabled ? '活動進行中' : '活動已關閉'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        代碼：<span className="font-mono text-white bg-black/30 px-1 rounded">{COUPON_CONFIG.code}</span> (折抵 ${COUPON_CONFIG.discountAmount})
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                                * 如需更改狀態，請聯繫開發人員修改 config/coupons.ts
                            </p>
                        </div>
                        
                        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-600 rounded-2xl p-6">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div>
                                 <label className="text-xs text-slate-400 block mb-1">Google Web App URL</label>
                                 <div className="flex gap-2 mb-4">
                                     <input type="text" value={googleScriptUrl} disabled className="flex-1 border rounded-lg px-3 py-2 text-sm bg-slate-900/50 border-slate-700 text-slate-400 cursor-not-allowed" />
                                     <button onClick={handleTestConnection} className="px-4 py-2 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600">
                                        {connectionStatus === 'testing' ? '...' : '測試'}
                                     </button>
                                 </div>
                                 {connectionStatus === 'success' && <div className="text-xs text-green-400">✅ 連線正常</div>}
                                 {connectionStatus === 'error' && <div className="text-xs text-red-400">❌ {connectionFeedback}</div>}
                              </div>
                              
                              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                 <div className="flex justify-between mb-2">
                                    <span className="text-xs text-slate-400 font-mono">Apps Script v16.8</span>
                                    <button onClick={() => copyToClipboard('/* GAS CODE HIDDEN FOR BREVITY */')} className="text-xs text-mystic-400 hover:underline">複製代碼</button>
                                 </div>
                                 <div className="text-[10px] text-slate-500">
                                    請參閱原始碼以獲取完整 GAS 設定腳本。
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
              )}
           </div>
        )}

      </main>

      {/* Footer Nav */}
      <BottomNav activeTab={activeTab} onChange={(tab) => {
         setActiveTab(tab);
         if (tab === 'shop') {
             setShopView('list');
         }
      }} />
    </div>
  );
};

export default App;
