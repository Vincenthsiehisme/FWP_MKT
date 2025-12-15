
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CustomerProfile, CrystalAnalysis } from '../types';
import { CRYSTAL_KNOWLEDGE_BASE } from './crystalDatabase';
import { getProductDetails, PRODUCT_CATALOG } from './productDatabase'; // Import the new service

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PROMPT CONSTANTS (Refactored for readability) ---

const STRATEGY_A_STRICT_BAZI = `
【模式 A：精確八字排盤 (Time Known)】
你必須採取「嚴格五行平衡」策略。

1. **排盤與計算**：
   - 嚴格計算年、月、日、時四柱。
   - 精確計算身強身弱、通根透干、月令權重。

2. **決定喜用神 (Lucky Element)**：
   - 根據「扶抑（強者剋洩、弱者生扶）」、「調候（寒暖燥濕）」、「通關」原則。
   - **重要指令**：在此模式下，【忽略用戶的願望】。
   - 即使願望是求財，如果命盤「身弱不勝財」，喜用神必須是【印/比】（生扶），而不是【財】。
   - 喜用神必須是為了讓命盤達到「中和」狀態。

3. **水晶選擇**：
   - **嚴格限制**：選出的水晶必須在資料庫中對應到你的【喜用神】五行。
   - 例如：若喜用神為【木】，只能選 (木) 屬性水晶，不管用戶願望是什麼。

4. **分析撰寫**：
   - 強調你是根據「命盤五行平衡」來挑選，是為了補足先天命理的缺失。
`;

const STRATEGY_B_WISH_ORIENTED = `
【模式 B：主要願望導向 (Time Unsure)】
由於用戶不確定出生時辰，四柱缺一，精確計算身強身弱容易失準。
你必須採取「願望顯化」策略，並嚴格遵守願望分級：

1. **排盤限制**：
   - 僅排出年、月、日三柱供參考。時柱請標記為 "吉時" 或 "未知"。
   - 五行分數計算僅基於前三柱（權重調整：月令仍最重）。

2. **決定水晶 (Crystal Selection)**：
   - **最高準則**：你的設計與水晶選擇必須**100% 基於【主要願望 (Core Focus)】**。
   - **次要願望處理 (Auxiliary Rules)**：
      - 【次要願望】僅作為參考背景，**絕不能**影響水晶的主體選擇。
      - 如果次要願望需要的水晶與主要願望衝突，**直接忽略次要願望**。
      - 不要為了滿足次要願望而混雜不相關的五行，這會導致能量發散。
   - 從【水晶資料庫】中，找出最能解決【主要願望】的水晶。
   - 例如：主要願望是「招財」，即使次要願望是「愛情」，也必須優先選擇 黃水晶、鈦晶、金髮晶。

3. **反推喜用神 (Lucky Element)**：
   - 將你為【主要願望】選出的水晶所屬的五行，設定為本次分析的【喜用神】。
   
4. **分析撰寫**：
   - 強調你是為了達成用戶的「主要願望」而凝聚能量。
   - 內文主要解釋如何透過水晶達成【主要願望】。
   - 對於次要願望，僅需一句話帶過或不提，強調設計核心是集中火力在主要願望上。
`;

// Schema for the analysis response including BaZi details
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    zodiacSign: {
      type: Type.STRING,
      description: "Calculated Western Zodiac Sign (Constellation) based on Month and Day (e.g. 牡羊座, 處女座). Do NOT return Chinese Animal Zodiac."
    },
    element: {
      type: Type.STRING,
      description: "Western astrological element (Fire, Earth, Air, Water) in Traditional Chinese."
    },
    bazi: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.STRING, description: "Year Pillar (e.g. 甲子)" },
        month: { type: Type.STRING, description: "Month Pillar" },
        day: { type: Type.STRING, description: "Day Pillar" },
        time: { type: Type.STRING, description: "Time Pillar (return '吉時' or '未知' if unknown)" }
      },
      required: ["year", "month", "day", "time"]
    },
    fiveElements: {
      type: Type.OBJECT,
      properties: {
        gold: { type: Type.NUMBER, description: "Score (0-100) of Metal energy." },
        wood: { type: Type.NUMBER, description: "Score (0-100) of Wood energy." },
        water: { type: Type.NUMBER, description: "Score (0-100) of Water energy." },
        fire: { type: Type.NUMBER, description: "Score (0-100) of Fire energy." },
        earth: { type: Type.NUMBER, description: "Score (0-100) of Earth energy." }
      },
      required: ["gold", "wood", "water", "fire", "earth"]
    },
    luckyElement: {
      type: Type.STRING,
      description: "The 'Useful God' (喜用神) element. If Time Unsure, this matches the Primary Wish Crystal's element."
    },
    suggestedCrystals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 suggested crystals strictly from the provided database. MUST match the Lucky Element logic."
    },
    reasoning: {
      type: Type.STRING,
      description: "Explanation of choice. If Time Known: Balance based. If Time Unsure: Focus on Primary Wishes."
    },
    visualDescription: {
      type: Type.STRING,
      description: "A short, poetic description of the bracelet's visual style and aesthetic based on the Lucky Element's color."
    },
    colorPalette: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 color codes (Hex) representing the bracelet's aesthetic."
    }
  },
  required: ["zodiacSign", "element", "bazi", "fiveElements", "luckyElement", "suggestedCrystals", "reasoning", "visualDescription", "colorPalette"]
};

/**
 * Analyzes the user profile to suggest crystals based on BaZi and Knowledge Base.
 */
export const analyzeCustomerProfile = async (profile: CustomerProfile): Promise<CrystalAnalysis> => {
  
  // Split wishes into Primary (Top 3) and Secondary (Rest)
  // The frontend guarantees the order based on user selection
  const primaryWishes = profile.wishes ? profile.wishes.slice(0, 3) : [];
  const secondaryWishes = profile.wishes ? profile.wishes.slice(3) : [];

  const primaryWishesStr = primaryWishes.length > 0 
    ? primaryWishes.map(w => `[${w.type}]: ${w.description}`).join('; ')
    : "無特別願望";

  const secondaryWishesStr = secondaryWishes.length > 0
    ? secondaryWishes.map(w => `[${w.type}]: ${w.description}`).join('; ')
    : "無";

  const timeInfo = profile.isTimeUnsure ? "時辰不確定 (Time Unsure)" : profile.birthTime;

  // Select Strategy
  const strategyInstruction = profile.isTimeUnsure ? STRATEGY_B_WISH_ORIENTED : STRATEGY_A_STRICT_BAZI;

  const promptText = `
    你是一位精通傳統八字命理（BaZi）與五行能量調理的大師。

    【輸入資料】
    出生日期: ${profile.birthDate}
    出生時間: ${timeInfo}
    性別: ${profile.gender}
    (姓名: ${profile.name} - 僅供稱呼，**嚴禁**影響八字排盤)
    
    【主要願望 (Core Focus) - 設計核心】: ${primaryWishesStr} (請以此為主進行設計)
    【次要願望 (Auxiliary) - 僅供參考】: ${secondaryWishesStr}
    （系統規則：不得以次要願望作為選擇水晶的依據，只能在 Reasoning 中簡短提及背景。）

    ${strategyInstruction}

    【通用八字排盤規則 (Step-by-Step)】
    1. **年柱**：依據農曆立春分界。
    2. **月柱**：**必須使用「五虎遁年起月法」**。務必精確對照「二十四節氣」判定月份。
    3. **日柱**：請依據萬年曆推算干支。
    4. **時柱**：若時間已知，使用「五鼠遁日起時法」；若未知，不計算干支。
    
    【通用輸出規則】
    - **五行分數**：無論哪種模式，請輸出當前命盤(3柱或4柱)的五行能量分佈 (0-100)。
    - **分析一致性**：Reasoning 的內容必須解釋「為何選這個喜用神/水晶」。
       - 模式 A 解釋：因為命盤缺 X，所以補 X。
       - 模式 B 解釋：因為您的【主要願望】是 Y，此水晶能集中能量達成 Y。
    - **嚴禁**在 Reasoning 中提及具體水晶名稱 (保留商業機密)。

    【水晶資料庫】(僅從此挑選):
    ${CRYSTAL_KNOWLEDGE_BASE}

    請以繁體中文回應 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temp for algorithmic strictness
      },
    });

    // NOTE: Per Google GenAI SDK specs, we use the property .text, not a method .text()
    const text = response.text;
    if (!text) throw new Error("No response from analysis model");
    
    const analysis = JSON.parse(text) as CrystalAnalysis;

    // --- INTEGRATION: Product Database Override & Validation ---
    // If the suggested crystal matches one in our Product Database,
    // we BLEND the descriptions.
    
    if (analysis.suggestedCrystals && analysis.suggestedCrystals.length > 0) {
      const mainCrystal = analysis.suggestedCrystals[0];
      
      // Anti-Hallucination: Check if main crystal exists in our known catalog or DB
      // We check PRODUCT_CATALOG specifically for the "Premium" description override
      const productInfo = getProductDetails(mainCrystal);
      
      if (productInfo) {
        // Append product info to the AI's poetic description instead of overwriting completely
        // This keeps the "personalization" feel while ensuring product accuracy.
        analysis.visualDescription = `${analysis.visualDescription} (設計師選用：${productInfo.description})`;
        console.log(`[ProductDB] Match found for ${mainCrystal}. Description blended.`);
      } else {
         // Optional: If crystal is totally unknown (not in catalog), we might want to log it
         console.warn(`[Analysis] Suggested crystal '${mainCrystal}' not found in Product Catalog. Using AI description entirely.`);
      }
    }

    return analysis;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("星盤運算與能量分析失敗，請檢查網路連線或稍後再試。");
  }
};

/**
 * Generates a photorealistic image of the crystal bracelet.
 * NOW with Product Database integration!
 */
export const generateBraceletImage = async (analysis: CrystalAnalysis, profile: CustomerProfile): Promise<string> => {
  // Guard Clause
  if (!analysis || !analysis.suggestedCrystals || analysis.suggestedCrystals.length === 0) {
      console.warn("Invalid analysis provided to image generator.");
      return ""; // Or return a placeholder image URL
  }

  const crystalStr = analysis.suggestedCrystals.join(", ");
  const mainCrystal = analysis.suggestedCrystals[0];
  
  // 1. Check Product Database First
  const productInfo = getProductDetails(mainCrystal);

  // BRANCH A: Real Photo Exists
  // If we have a hardcoded URL in productDatabase.ts, use it directly.
  if (productInfo && productInfo.imageUrl) {
    console.log(`[ProductDB] Using real photo for ${mainCrystal}`);
    return productInfo.imageUrl;
  }

  // BRANCH B: Fixed Prompt (AI Generation with Standardization)
  // If we don't have a photo but have a fixed prompt, use it.
  // Otherwise, fallback to dynamic prompt.
  const promptToUse = productInfo?.fixedPrompt || `
    Professional commercial product photography of a single high-end beaded bracelet.
    Subject: A single strand crystal bracelet made of ${crystalStr}.
    Design Style: ${analysis.visualDescription}.
    
    Composition: Resting naturally on a dark textured black slate stone surface. 
    Angle: Slightly elevated 45-degree angle view (showing bead volume and roundness, NOT a flat 2D circle).
    Atmosphere: Moody, mysterious, high-end boutique aesthetic. 
    Background: Dark black stone texture fading into shadow.
    
    Lighting: Cinematic studio spotlight, creating strong specular highlights on the crystals and realistic contact shadows on the stone. High contrast (Chiaroscuro).
    
    Camera: 100mm Macro Lens, f/4 Aperture (sharp focus on front beads, subtle depth of field).
    Render: Octane Render, Ray Tracing, Caustics, 8k resolution, Photorealistic.
    Details: 14k gold accents, distinct crystal textures (inclusions, transparency), realistic physical presence.
  `;

  if (productInfo?.fixedPrompt) {
     console.log(`[ProductDB] Using fixed prompt for ${mainCrystal}`);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", 
      contents: [
        {
           role: 'user',
           parts: [{ text: promptToUse }]
        }
      ],
      config: {
        temperature: 0.7 
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No inlineData found in response:", response);
    throw new Error("No image data returned.");
    
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw new Error("圖片生成連線逾時，請稍後再試。");
  }
};
