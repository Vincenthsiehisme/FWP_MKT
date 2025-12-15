
export enum Gender {
  Male = '男',
  Female = '女',
  Other = '其他'
}

export interface WishItem {
  type: string;
  description: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  isTimeUnsure?: boolean; // New flag: determines if we use Strict BaZi or Wish-based logic
  gender: Gender;
  wishes: WishItem[]; // Changed from string to structured array
  createdAt: number;
}

export interface CrystalAnalysis {
  zodiacSign: string;
  element: string; // Main zodiac element
  bazi: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  fiveElements: {
    gold: number; // Percentage 0-100
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  luckyElement: string; // The element needed to balance (喜用神)
  suggestedCrystals: string[];
  reasoning: string;
  visualDescription: string;
  colorPalette: string[];
}

export interface ShippingDetails {
  realName: string;
  phone: string;
  storeCode: string;
  storeName: string;
  socialId: string; // IG or FB account
  wristSize: string; // New: Wrist size in cm
  addPurificationBag: boolean; // New: Add-on option
  preferredColors: string[]; // New: Color preferences (Array of strings)
  
  // Coupon Fields
  couponCode?: string;      // The code entered by user
  discountAmount?: number;  // The actual amount discounted
  
  totalPrice: number; // New: Total calculated price including shipping and add-ons
}

export interface GeneratedResult {
  imageUrl: string;
  analysis: CrystalAnalysis;
}

export interface CustomerRecord extends CustomerProfile {
  analysis?: CrystalAnalysis;
  generatedImageUrl?: string;
  shippingDetails?: ShippingDetails;
  // Backward compatibility for old records (optional)
  wish?: string;
  // NEW: Flag for standard products purchased from Marketplace
  isStandardProduct?: boolean;
}

export type LoadingState = 'idle' | 'analyzing' | 'generating_image' | 'completed' | 'error';

// NEW: Strategy Pattern for dynamic pricing
export interface PricingStrategy {
  type: 'standard' | 'custom'; // 'standard' = Peanut Series (Free Shipping), 'custom' = Five Elements (Shipping extra)
  basePrice: number;
  shippingCost: number;
  sizeThreshold: number; // Wrist size threshold for surcharge (e.g., 14 or 16)
  surcharge: number;     // Extra cost if threshold met
}
