
import React from 'react';
import { CustomerRecord } from '../types';

interface CRMListProps {
  customers: CustomerRecord[];
  onSelect: (customer: CustomerRecord) => void;
  onDelete: (id: string) => void;
}

const CRMList: React.FC<CRMListProps> = ({ customers, onSelect, onDelete }) => {
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    // Updated header to include Coupon info
    csvContent += "ID,真實姓名,電話,生日,生辰時間,性別,願望清單,手圍(cm),加購淨化袋,喜好色系,店號,店名,社群帳號,訂單總金額,優惠碼,折抵金額,建立時間,五行屬性,喜用神(缺),八字(年月日時),建議水晶,分析內容,設計風格(Recipe),配色\n";

    customers.forEach(row => {
      const escape = (text: string | undefined | number) => {
        if (text === undefined || text === null) return "";
        return `"${String(text).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      const crystals = row.analysis?.suggestedCrystals?.join("、") || "";
      const dateStr = new Date(row.createdAt).toLocaleString('zh-TW');
      
      // Format BaZi string
      const baziStr = row.analysis?.bazi 
        ? `${row.analysis.bazi.year}/${row.analysis.bazi.month}/${row.analysis.bazi.day}/${row.analysis.bazi.time}`
        : "";

      // Format Wishes Array
      let wishStr = row.wish || ""; // Fallback
      if (row.wishes && Array.isArray(row.wishes)) {
          wishStr = row.wishes.map(w => `[${w.type}] ${w.description}`).join('; ');
      }
      
      // New Fields
      const wristSize = row.shippingDetails?.wristSize || "";
      const bag = row.shippingDetails?.addPurificationBag ? "是" : "否";
      const colors = row.shippingDetails?.preferredColors?.join("、") || "";
      const price = row.shippingDetails?.totalPrice || "";
      
      // Coupon Fields
      const coupon = row.shippingDetails?.couponCode || "";
      const discount = row.shippingDetails?.discountAmount || "";

      // Reduced CSV Row - Matching new structure
      csvContent += `${row.id},${escape(row.shippingDetails?.realName)},${escape(row.shippingDetails?.phone)},${row.birthDate},${escape(row.birthTime)},${row.gender},${escape(wishStr)},${escape(wristSize)},${escape(bag)},${escape(colors)},${escape(row.shippingDetails?.storeCode)},${escape(row.shippingDetails?.storeName)},${escape(row.shippingDetails?.socialId)},${escape(price)},${escape(coupon)},${escape(discount)},${escape(dateStr)},${escape(row.analysis?.element)},${escape(row.analysis?.luckyElement)},${escape(baziStr)},${escape(crystals)},${escape(row.analysis?.reasoning)},${escape(row.analysis?.visualDescription)},${escape(row.analysis?.colorPalette?.join(','))}\n`;
    });

    const fileName = `FWP_CRM_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvContent, fileName, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(customers, null, 2);
    const fileName = `FWP_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(jsonContent, fileName, 'application/json');
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
        <p>尚無客戶記錄</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Export Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700/50 pb-6 gap-4">
        <h3 className="text-xl font-bold font-sans text-slate-200 flex items-center gap-2">
          客戶檔案庫 
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-400 font-sans border border-slate-700">
            {customers.length}
          </span>
        </h3>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs md:text-sm text-slate-300 transition shadow-sm whitespace-nowrap font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            匯出 Excel (精簡版)
          </button>
          <button 
            onClick={handleExportJSON}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs md:text-sm text-slate-300 transition shadow-sm whitespace-nowrap font-sans"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            備份 JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {customers.map((customer) => (
          <div 
            key={customer.id}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 hover:border-mystic-500/30 transition-all duration-300 cursor-pointer relative group shadow-md hover:shadow-xl hover:-translate-y-1"
            onClick={() => onSelect(customer)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                  <h4 className="text-lg font-bold font-sans text-slate-200 group-hover:text-mystic-300 transition-colors">{customer.name}</h4>
                  {customer.shippingDetails?.realName && (
                      <span className="text-xs text-slate-400 block font-sans">({customer.shippingDetails.realName})</span>
                  )}
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 font-sans">
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="mb-3 space-y-1">
              <div className="flex flex-wrap gap-1">
                 {/* Zodiac removed from view */}
                 {customer.analysis?.luckyElement && (
                   <span className="inline-block text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 font-sans">
                     喜用: {customer.analysis.luckyElement}
                   </span>
                 )}
              </div>
              {customer.analysis?.suggestedCrystals?.[0] && (
                <div className="text-xs text-slate-400 truncate font-sans">
                  • {customer.analysis.suggestedCrystals.join(" ")}
                </div>
              )}
            </div>
            
            {/* Wish Tags Display */}
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[2em]">
                {customer.wishes && Array.isArray(customer.wishes) ? (
                    customer.wishes.map((w, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/30 font-sans">
                            {w.type}
                        </span>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 line-clamp-1 font-sans">{customer.wish}</p>
                )}
            </div>

            {customer.shippingDetails ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] text-green-400 font-sans">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        訂單已成立 (${(customer.shippingDetails.totalPrice || 0).toLocaleString()})
                    </div>
                    {/* Show Coupon Badge in CRM if used */}
                    {customer.shippingDetails.couponCode && (
                        <div className="flex items-center gap-1 text-[10px] text-gold-400/80 font-sans ml-4">
                            <span className="bg-gold-500/10 px-1 rounded border border-gold-500/10">優惠: {customer.shippingDetails.couponCode}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-[10px] text-yellow-500 font-sans">
                    資料未完成
                </div>
            )}

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if(window.confirm('確定要刪除此紀錄嗎？')) onDelete(customer.id);
              }}
              className="absolute top-4 right-4 text-slate-600 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition p-2 bg-slate-900/50 rounded-full hover:bg-red-900/30"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRMList;
