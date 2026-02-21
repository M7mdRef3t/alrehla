/**
 * Pricing Engine — محرك التسعير العالمي (PPP Logic) 🌍
 * =====================================================
 * يقوم بتعديل الأسعار بناءً على القدرة الشرائية لكل منطقة (Purchasing Power Parity).
 * يضمن تعظيم العائد في الأسواق القوية (الخليج/أوروبا) والانتشار في الأسواق المحلية.
 */

export interface PricingPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    displayPrice: string;
}

const PRICING_CONFIG: Record<string, { multiplier: number; currency: string; symbol: string }> = {
    'EG': { multiplier: 1, currency: 'EGP', symbol: 'ج.م' }, // الارتكاز (Base)
    'SA': { multiplier: 3.5, currency: 'SAR', symbol: 'ر.س' },
    'AE': { multiplier: 3.5, currency: 'AED', symbol: 'د.إ' },
    'US': { multiplier: 5, currency: 'USD', symbol: '$' },
    'GB': { multiplier: 5, currency: 'GBP', symbol: '£' },
    'DEFAULT': { multiplier: 5, currency: 'USD', symbol: '$' }
};

const BASE_PREMIUM_PRICE = 150; // سعر باقة "رحلتي + مسافتي" الأساسي بالجنيه المصري

export function getAdjustedPricing(countryCode: string | null): PricingPlan[] {
    const config = PRICING_CONFIG[countryCode || 'DEFAULT'] || PRICING_CONFIG['DEFAULT'];

    return [
        {
            id: 'basic',
            name: 'رحلتي (أساسي)',
            price: 0,
            currency: config.currency,
            displayPrice: 'مجاناً'
        },
        {
            id: 'premium',
            name: 'رحلتي + مسافتي (قائد)',
            price: Math.round(BASE_PREMIUM_PRICE * config.multiplier),
            currency: config.currency,
            displayPrice: `${Math.round(BASE_PREMIUM_PRICE * config.multiplier)} ${config.symbol} / شهر`
        }
    ];
}

/**
 * محرك التحقق من الصلاحيات بناءً على الباقة
 */
export const TIER_PERMISSIONS = {
    basic: ['compass', 'breathing', 'basic_insights'],
    premium: ['compass', 'breathing', 'basic_insights', 'drag_drop_map', 'detachment_protocols', 'sos_button', 'victory_reports'],
    enterprise: ['*'] // كل شيء + لوحة تحكم الشركات
};

export function hasPermission(tier: 'basic' | 'premium' | 'enterprise', permission: string): boolean {
    if (tier === 'enterprise') return true;
    return TIER_PERMISSIONS[tier].includes(permission);
}
