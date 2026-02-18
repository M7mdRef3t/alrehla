/**
 * Geographic Pricing Engine — محرك التسعير الجغرافي
 * =====================================================
 * تسعير PPP (Purchasing Power Parity) لجعل المنصة
 * في متناول الجميع بغض النظر عن العملة.
 */

export interface PricingRegion {
    code: string;
    name: string;
    nameAr: string;
    commanderPrice: string;
    generalPrice: string;
    currency: string;
    flag: string;
}

export const PRICING_REGIONS: PricingRegion[] = [
    {
        code: "EG",
        name: "Egypt",
        nameAr: "مصر",
        commanderPrice: "150",
        generalPrice: "500",
        currency: "ج.م/شهر",
        flag: "🇪🇬",
    },
    {
        code: "SA",
        name: "Saudi Arabia",
        nameAr: "السعودية",
        commanderPrice: "25",
        generalPrice: "90",
        currency: "ر.س/شهر",
        flag: "🇸🇦",
    },
    {
        code: "AE",
        name: "UAE",
        nameAr: "الإمارات",
        commanderPrice: "25",
        generalPrice: "90",
        currency: "د.إ/شهر",
        flag: "🇦🇪",
    },
    {
        code: "KW",
        name: "Kuwait",
        nameAr: "الكويت",
        commanderPrice: "2",
        generalPrice: "7",
        currency: "د.ك/شهر",
        flag: "🇰🇼",
    },
    {
        code: "US",
        name: "United States",
        nameAr: "أمريكا",
        commanderPrice: "7",
        generalPrice: "25",
        currency: "$/month",
        flag: "🇺🇸",
    },
    {
        code: "GB",
        name: "United Kingdom",
        nameAr: "بريطانيا",
        commanderPrice: "6",
        generalPrice: "20",
        currency: "£/month",
        flag: "🇬🇧",
    },
    {
        code: "OTHER",
        name: "Other",
        nameAr: "دول أخرى",
        commanderPrice: "7",
        generalPrice: "25",
        currency: "$/month",
        flag: "🌍",
    },
];

const REGION_KEY = "dawayir-pricing-region";

export function saveUserRegion(code: string): void {
    try {
        localStorage.setItem(REGION_KEY, code);
    } catch { /* noop */ }
}

export function getUserRegion(): string {
    try {
        return localStorage.getItem(REGION_KEY) ?? "OTHER";
    } catch {
        return "OTHER";
    }
}

export function getPricingForRegion(code?: string): PricingRegion {
    const regionCode = code ?? getUserRegion();
    return (
        PRICING_REGIONS.find((r) => r.code === regionCode) ??
        PRICING_REGIONS.find((r) => r.code === "OTHER")!
    );
}

/** محاولة تحديد المنطقة تلقائياً من المتصفح */
export async function detectUserRegion(): Promise<string> {
    try {
        // Use timezone as a proxy for region
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.includes("Cairo") || tz.includes("Africa/Cairo")) return "EG";
        if (tz.includes("Riyadh") || tz.includes("Asia/Riyadh")) return "SA";
        if (tz.includes("Dubai") || tz.includes("Asia/Dubai")) return "AE";
        if (tz.includes("Kuwait") || tz.includes("Asia/Kuwait")) return "KW";
        if (tz.includes("America")) return "US";
        if (tz.includes("London") || tz.includes("Europe/London")) return "GB";
        return "OTHER";
    } catch {
        return "OTHER";
    }
}
