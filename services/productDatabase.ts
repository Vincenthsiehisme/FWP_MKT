
/**
 * FWP Boutique Product Database
 * 
 * 這是您的「商品目錄中心」。
 * 
 * 功能說明：
 * 1. imageUrl: 優先顯示真實商品照。
 * 2. fixedPrompt: 若無照片，AI 生成的依據。
 * 3. description: 商品文案 (純產品美學)。
 * 4. zodiacInsights: 結構化的星座運勢資料。
 * 5. price: 售價。
 */

export interface ZodiacInsight {
    keyword: string;
    forecast: string;
    reason: string;
}

export interface ProductEntry {
  name?: string; 
  description: string;
  highlight?: string; // New field for landing page highlights
  fixedPrompt: string; 
  imageUrl: string;
  price: number;
  element: string;
  tags: string[];
  zodiacInsights?: Record<string, ZodiacInsight>; // Key is Zodiac Name (e.g., '巨蟹座')
}

export const PRODUCT_CATALOG: Record<string, ProductEntry> = {
  // --- 2026 好事花生系列 ---
  
  '步步花生': {
    description: `步步花生以綠幽靈累積事業運，帶來穩定的財富與機會；
海藍寶提升行動力與表達能力，讓好消息順利傳遞；
白蝶貝與白水晶淨化雜念，金運小花生則牽引成功循序花生。`,
    highlight: "適合 2026 想突破、轉型、升遷、創業的人，為您的事業版圖注入源源不絕的生機。",
    fixedPrompt: "High-end crystal bracelet with Green Phantom Quartz, Aquamarine, White Mother of Pearl, White Quartz, and a gold peanut charm. Elegant, professional lighting. Focus on green and blue hues.",
    imageUrl: "https://duk.tw/3Fw2UU.png",
    price: 2480,
    element: "木", 
    tags: ["事業能量", "升遷轉型"],
    zodiacInsights: {
        '金牛座': {
            keyword: '事業突破、行動力、方向清晰',
            forecast: '2026年冥王星在事業宮刷新你的職涯定位，你必須走向更高層次。',
            reason: '原本停滯的工作進度會開始順起來，升遷與跳槽機會增強。'
        },
        '獅子座': {
            keyword: '主導力、人際平衡、合作力量',
            forecast: '2026年冥王星在合作宮帶來權力拉扯，你必須重新定位自己的優勢。',
            reason: '事業舞台變更大，合作對象更穩定，成果也更亮眼。'
        },
        '天蠍座': {
            keyword: '轉型支持、專注度、洞察力',
            forecast: '2026年天王星進入共享資源宮，你可能迎來職涯大調整，需穩定心與方向。',
            reason: '在變動中找到屬於自己的成功路徑，將危機化為轉機。'
        },
        '水瓶座': {
            keyword: '自我定位、行動一致性、耐力',
            forecast: '2026年冥王星在命宮，你正在重建「你是誰」；事業需要配合新的方向。',
            reason: '你會更確定自己要什麼，職涯成長速度加快。'
        }
    }
  },

  '甜蜜花生': {
    description: `甜蜜花生以粉色與溫柔能量喚醒心的柔軟。
草莓晶與摩根石提升戀愛磁場、帶來愉悅互動；
藍光拉長石加強洞察力，讓你看見真正值得的人；
白蝶貝安神，金瓜白水晶＋金運小花生象徵幸福穩穩花生。`,
    highlight: "戴上它，讓心自然打開，讓愛在日常裡悄悄盛放。",
    fixedPrompt: "High-end crystal bracelet with Strawberry Quartz, Morganite, Labradorite (Blue Flash), White Mother of Pearl, and a gold peanut charm. Soft, romantic pink lighting.",
    imageUrl: "https://duk.tw/3RHpHR.png",
    price: 2480,
    element: "火", 
    tags: ["感情能量", "桃花人緣"],
    zodiacInsights: {
        '巨蟹座': {
            keyword: '情緒穩定、心門開啟、被理解感',
            forecast: '2026年木星進入命宮，使你更渴望愛與歸屬，但情緒也放大、容易因敏感而退縮。',
            reason: '你會更容易進入被愛的頻率，感情中的誤會與猜測會變少，幸福更常花生。'
        },
        '摩羯座': {
            keyword: '親密感、情緒流動、卸下心防',
            forecast: '2026年木星照亮你的伴侶宮，但土星讓你變得更拘謹，不易表達真實情緒。',
            reason: '孤單感會減少，感情互動更自然，幸福更容易靠近你。'
        },
        '牡羊座': {
            keyword: '柔軟度、耐心、親密互動品質',
            forecast: '2026年木星在家庭宮刺激親密議題，你的直率與衝動容易造成誤會。',
            reason: '關係會變得更柔軟、有溫度，也更容易吸引真心對你的人。'
        },
        '天秤座': {
            keyword: '關係平衡、被理解感、心靈連結',
            forecast: '2026年事業被放大，你容易忙過頭而忽略感情協調，需要找回情感的重心。',
            reason: '才能在工作與關係之間取得更好的平衡，讓甜蜜自然花生。'
        }
    }
  },

  '滿袋花生': {
    description: `滿袋花生以黃膠花點亮財富能量，
灰瑪瑙消除焦慮、提升行動力，
黃膠花補充自信與正財運。
白蝶貝與金瓜白水晶清淨磁場、守住荷包，
金運小花生象徵財富一袋袋滿起來。`,
    highlight: "適合想提升收入、增加存款、穩定金錢流動的人。",
    fixedPrompt: "High-end crystal bracelet with Yellow Hematoid Quartz (Yellow Gum Flower), Grey Agate, White Mother of Pearl, and a gold peanut charm. Wealthy, warm yellow and grey tones.",
    imageUrl: "https://duk.tw/SQcLfv.png",
    price: 2480,
    element: "土", 
    tags: ["財運能量", "守財庫"],
    zodiacInsights: {
        '處女座': {
            keyword: '財務界線、合作穩定、資源管理',
            forecast: '2026年土星在合作宮，容易支出過多、在人情壓力中破財。',
            reason: '開銷變少、收入變穩，荷包成功守住。'
        },
        '雙子座': {
            keyword: '財運穩定、收入規畫、專注力',
            forecast: '2026年木星進財帛宮帶來許多新機會，但也容易變動、難留住。',
            reason: '錢不只進得快，也留得住，財富累積明顯提升。'
        },
        '雙魚座': {
            keyword: '節制力、財務安全感、抗壓性',
            forecast: '2026年土星在命宮造成壓力，容易因情緒花錢或為他人付出過度。',
            reason: '財務更踏實、有安全感，存款自然增加。'
        }
    }
  },

  '大吉花生': {
    description: `大吉花生以紫水晶提升智慧與貴人緣，
綠天使帶來清晰洞察，幫助看穿表象、找到真正的好夥伴；
白蝶貝與金瓜白水晶穩定磁場、淨化負能量；
金運小花生則為你打開貴人運的大門。`,
    highlight: "讓你所到之處都有好人相助、好機會花生。",
    fixedPrompt: "High-end crystal bracelet with Amethyst (Purple), Green Angel (Seraphinite), White Mother of Pearl, and a gold peanut charm. Mysterious, noble lighting with purple and green hues.",
    imageUrl: "https://duk.tw/BM9GhD.png",
    price: 2480,
    element: "木", 
    tags: ["貴人人脈", "智慧洞察"],
    zodiacInsights: {
        '射手座': {
            keyword: '新資源、人脈更新、合作順流',
            forecast: '2026年冥王星進入交流與人脈宮，舊的人脈逐漸淡出，並迎來新的合作機緣。',
            reason: '貴人會快速聚集，你的方向會變得更清晰，資源也更容易到位。'
        },
        // Duplicate Libra mapping (Different context than Love)
        '天秤座': { 
            keyword: '貴人助力、關係辨識力、合作進展',
            forecast: '2026年木星帶來事業擴張，你需要更多協作，但也容易變動，需要好的夥伴。',
            reason: '遇到的都是好人、好機會，讓你的人際邁入最順流的一年。'
        },
        // Duplicate Aries mapping
        '牡羊座': {
            keyword: '人脈協助、合作落地、溝通順暢',
            forecast: '2026年天王星帶來突發機緣，但需要貴人支援才會成功落地。',
            reason: '貴人出現的速度快、品質好，能讓你抓住 2026 的每個機會。'
        }
    }
  }
};

// Helper to convert catalog to array for UI
export const getProductList = () => {
  return Object.entries(PRODUCT_CATALOG).map(([name, data]) => ({
    name,
    ...data
  }));
};

// Helper to find product by Zodiac sign
export const getProductByZodiac = (zodiacName: string): { product: ProductEntry & { name: string }, insight: ZodiacInsight } | null => {
    for (const [name, product] of Object.entries(PRODUCT_CATALOG)) {
        if (product.zodiacInsights && product.zodiacInsights[zodiacName]) {
            return {
                product: { name, ...product },
                insight: product.zodiacInsights[zodiacName]
            };
        }
    }
    return null;
};

export const getProductDetails = (crystalName: string) => {
    if (PRODUCT_CATALOG[crystalName]) {
        return PRODUCT_CATALOG[crystalName];
    }
    const keys = Object.keys(PRODUCT_CATALOG);
    const match = keys.find(k => crystalName.includes(k) || k.includes(crystalName));
    return match ? PRODUCT_CATALOG[match] : null;
};
