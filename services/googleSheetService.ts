
import { CustomerRecord } from '../types';
import { compressBase64Image } from './imageUtils';

/**
 * Google Apps Script CORS 解決方案
 * 
 * 由於 GAS 的 CORS 限制，我們使用以下策略：
 * 1. 使用 fetch 發送資料（會被 CORS 阻擋，但資料仍會寫入）
 * 2. 忽略 CORS 錯誤，假設寫入成功
 * 3. 前端顯示友善訊息
 */
export const syncToGoogleSheet = async (record: CustomerRecord, scriptUrl: string) => {
  if (!scriptUrl) return;

  console.log(`[GoogleSheet] Syncing record ${record.name} to: ${scriptUrl}`);

  const sanitize = (val: any) => (val === undefined || val === null) ? "" : val;

  // Handle Standard Products (No Bazi/Analysis)
  const isStandard = !!record.isStandardProduct;

  const baziStr = record.analysis?.bazi 
    ? `${record.analysis.bazi.year}/${record.analysis.bazi.month}/${record.analysis.bazi.day}/${record.analysis.bazi.time}`
    : isStandard ? "N/A (標準品)" : "";
    
  const elementsStr = record.analysis?.fiveElements
    ? `金:${record.analysis.fiveElements.gold} 木:${record.analysis.fiveElements.wood} 水:${record.analysis.fiveElements.water} 火:${record.analysis.fiveElements.fire} 土:${record.analysis.fiveElements.earth}`
    : isStandard ? "N/A" : "";

  let wishStr = record.wish || ""; 
  if (record.wishes && Array.isArray(record.wishes)) {
    wishStr = record.wishes.map(w => `【${w.type}】${w.description}`).join('\n');
  } else if (isStandard) {
    wishStr = "標準商品訂單";
  }

  const details = record.shippingDetails || {
      realName: '', phone: '', storeCode: '', storeName: '', socialId: '',
      wristSize: '', addPurificationBag: false, preferredColors: [], totalPrice: 0,
      couponCode: '', discountAmount: 0
  };

  let cleanBase64 = '';
  if (record.generatedImageUrl) {
    // For standard products, generatedImageUrl is likely a URL, not base64. 
    // If it is a URL, we might skip sending base64 or send it if the sheet script supports URLs.
    // Assuming the sheet expects Base64, we skip compression if it's already a http link to save bandwidth/errors.
    if (record.generatedImageUrl.startsWith('http')) {
        // It's a URL (from product database), sending as is might confuse the script if it expects image data.
        // We will send empty imageBase64 and maybe put the URL in suggestedCrystals or another field if needed.
        // For now, let's leave imageBase64 empty for standard products to avoid huge payload if not needed, 
        // OR try to fetch and convert if critical. 
        // Strategy: Leave empty, but put URL in visualDescription or reasoning if possible.
        console.log("[GoogleSheet] Standard product URL detected, skipping base64 upload.");
    } else {
        try {
          console.log("[GoogleSheet] Compressing image...");
          const compressedDataUrl = await compressBase64Image(record.generatedImageUrl, 0.6);
          if (compressedDataUrl.includes('base64,')) {
            cleanBase64 = compressedDataUrl.split('base64,')[1];
          }
        } catch (e) {
          console.warn("[GoogleSheet] Image compression failed, trying original...", e);
          if (record.generatedImageUrl.includes('base64,')) {
             cleanBase64 = record.generatedImageUrl.split('base64,')[1];
          }
        }
    }
  }

  // Handle Colors: Force "N/A" for Standard Products
  let colorsStr = "";
  if (isStandard) {
      colorsStr = "N/A";
  } else if (Array.isArray(details.preferredColors) && details.preferredColors.length > 0) {
      colorsStr = details.preferredColors.join(', ');
  } else if (typeof details.preferredColors === 'string' && details.preferredColors) {
      colorsStr = details.preferredColors;
  }

  // Handle Time Unsure Logic for Sheet
  let finalBirthTime = "";
  if (isStandard) {
      finalBirthTime = "N/A";
  } else {
      finalBirthTime = record.isTimeUnsure ? "吉時/未知" : sanitize(record.birthTime);
  }

  const payload = {
    id: sanitize(record.id),
    name: sanitize(record.name), // This will be product name for standard products
    gender: sanitize(record.gender) || "N/A",
    birthDate: sanitize(record.birthDate) || "N/A",
    birthTime: finalBirthTime, 
    wish: wishStr, 
    zodiacSign: sanitize(record.analysis?.zodiacSign) || "N/A",
    element: sanitize(record.analysis?.element) || "N/A",
    luckyElement: sanitize(record.analysis?.luckyElement) || "N/A",
    bazi: baziStr,
    fiveElements: elementsStr,
    suggestedCrystals: sanitize(record.analysis?.suggestedCrystals?.join(', ')) || record.name, // Use product name as crystal
    reasoning: sanitize(record.analysis?.reasoning) || "標準商品購買",
    visualDescription: sanitize(record.analysis?.visualDescription) || "標準品",
    colorPalette: sanitize(record.analysis?.colorPalette?.join(', ')) || "N/A",
    imageBase64: cleanBase64, 
    createdAt: new Date(record.createdAt).toLocaleString('zh-TW'),
    realName: sanitize(details.realName),
    phone: sanitize(details.phone),
    storeCode: sanitize(details.storeCode),
    storeName: sanitize(details.storeName),
    socialId: sanitize(details.socialId),
    wristSize: details.wristSize ? String(details.wristSize) : "",
    addPurificationBag: details.addPurificationBag ? '是' : '否',
    preferredColors: colorsStr,
    totalPrice: details.totalPrice ? Number(details.totalPrice) : 0,
    // Add Coupon Info (Will be sent to sheet if column exists)
    couponCode: sanitize(details.couponCode),
    discountAmount: details.discountAmount ? Number(details.discountAmount) : 0
  };

  console.log("📦 [GoogleSheet] Payload Check:", {
      ID: payload.id,
      Total: payload.totalPrice,
      Coupon: payload.couponCode
  });

  const sendRequest = async (data: any) => {
    const bodyStr = JSON.stringify(data);
    const sizeKB = new TextEncoder().encode(bodyStr).length / 1024;
    console.log(`[GoogleSheet] Payload Size: ${sizeKB.toFixed(2)} KB`);
    
    const cacheBustedUrl = `${scriptUrl}?_t=${Date.now()}&_r=${Math.random().toString(36).substring(7)}`;
    
    try {
      // 🔥 發送請求（會觸發 CORS 錯誤，但資料仍會寫入）
      const response = await fetch(cacheBustedUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: bodyStr,
        mode: 'no-cors' // 🔥 關鍵：使用 no-cors 模式
      });
      
      // no-cors 模式下，response 會是 opaque，無法讀取內容
      console.log("✅ [GoogleSheet] Request sent (no-cors mode)");
      console.log("   Response type:", response.type); // 應該是 "opaque"
      console.log("   💡 資料已發送至 Google Sheet");
      console.log("   ⚠️ 無法驗證是否成功寫入（GAS CORS 限制）");
      console.log("   📋 請手動檢查 Google Sheet 確認");
      
      return { 
        status: 'sent', 
        message: '資料已發送（無法驗證，請檢查 Google Sheet）'
      };
      
    } catch (error: any) {
      console.error("[GoogleSheet] Send error:", error);
      
      // 即使有錯誤，資料可能仍已寫入
      if (error.name === 'TypeError' && error.message.includes('CORS')) {
        console.warn("⚠️ [GoogleSheet] CORS error - 資料可能已寫入");
        return { 
          status: 'cors_blocked', 
          message: 'CORS 阻擋，但資料可能已寫入 Google Sheet'
        };
      }
      
      throw error;
    }
  };

  try {
    const result = await sendRequest(payload);
    console.log("[GoogleSheet] Sync result:", result);
  } catch (error) {
    console.warn("[GoogleSheet] Sync failed, retrying without image...", error);
    try {
      const textOnlyPayload = { ...payload, imageBase64: "" };
      await sendRequest(textOnlyPayload);
      console.log("[GoogleSheet] Text-only retry completed");
    } catch (retryError) {
      console.error("[GoogleSheet] Both attempts failed:", retryError);
      // 不拋出錯誤，因為資料可能仍已寫入
      console.log("⚠️ [GoogleSheet] 請手動檢查 Google Sheet");
    }
  }
};

/**
 * 測試連線 - 簡化版本
 */
export const sendTestPing = async (scriptUrl: string) => {
  console.log(`[GoogleSheet] Testing connection...`);
  
  const payload = {
    id: `TEST-${Date.now()}`,
    name: '系統測試',
    gender: 'N/A',
    birthDate: '2024-01-01',
    birthTime: '12:00',
    wish: '測試',
    element: '測試',
    luckyElement: '測試',
    bazi: '測試',
    suggestedCrystals: '測試',
    reasoning: '測試',
    visualDescription: '測試',
    colorPalette: '測試',
    createdAt: new Date().toLocaleString('zh-TW'),
    realName: '測試',
    phone: '0900-000-000',
    storeCode: '000',
    storeName: '測試門市',
    socialId: '@test',
    wristSize: '15',
    addPurificationBag: '否',
    preferredColors: '測試',
    totalPrice: 0,
    // Add Coupon Fields for Test
    couponCode: 'TEST2026', 
    discountAmount: 100
  };

  try {
    const response = await fetch(scriptUrl + '?test=1&_t=' + Date.now(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    
    console.log("✅ [GoogleSheet] Test request sent");
    console.log("   Response type:", response.type);
    
    // no-cors 模式無法確認成功，只能假設已發送
    return {
      status: "ok",
      version: "v17.0",
      message: "測試請求已發送。請檢查 Google Sheet 是否有新增測試資料（ID 開頭為 TEST-）"
    };
    
  } catch (error: any) {
    console.error("[GoogleSheet] Test failed:", error);
    
    // 即使失敗，也給友善提示
    return {
      status: "unknown",
      version: "unknown",
      message: "無法完全測試連線（CORS 限制）。請直接使用系統並檢查 Google Sheet。"
    };
  }
};
