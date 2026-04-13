-- Migration: Create Promo Codes Architecture

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(255) UNIQUE NOT NULL,
    discount_type varchar(50) DEFAULT 'vip_bypass', -- e.g., vip_bypass, percentage, fixed
    discount_value numeric DEFAULT 100, -- e.g., 100% 
    max_uses integer DEFAULT NULL, -- null = infinite
    times_used integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamptz DEFAULT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes
-- Only admins can view and manage promo codes directly
CREATE POLICY "Admins can view promo codes" 
    ON public.promo_codes FOR SELECT 
    USING (auth.uid()::text IN (SELECT id::text FROM public.profiles WHERE role IN ('owner', 'superadmin', 'admin')));

CREATE POLICY "Admins can insert promo codes" 
    ON public.promo_codes FOR INSERT 
    WITH CHECK (auth.uid()::text IN (SELECT id::text FROM public.profiles WHERE role IN ('owner', 'superadmin', 'admin')));

CREATE POLICY "Admins can update promo codes" 
    ON public.promo_codes FOR UPDATE 
    USING (auth.uid()::text IN (SELECT id::text FROM public.profiles WHERE role IN ('owner', 'superadmin', 'admin')));

-- A stored procedure to safely validate and increment a promo code usage
-- This must be SECURITY DEFINER to bypass RLS, because anonymous/unauthenticated users might use a VIP promo
CREATE OR REPLACE FUNCTION public.consume_promo_code(p_code varchar)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_promo record;
BEGIN
    -- 1. Find the active code
    SELECT * INTO v_promo 
    FROM public.promo_codes 
    WHERE code = upper(btrim(p_code)) AND is_active = true 
    FOR UPDATE; -- Lock row for concurrent usage prevention

    -- 2. Validate existence
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'الكود غير موجود أو معطل.');
    END IF;

    -- 3. Validate expiration
    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
        RETURN json_build_object('success', false, 'message', 'انتهت صلاحية هذا الكود.');
    END IF;

    -- 4. Validate usage limits
    IF v_promo.max_uses IS NOT NULL AND v_promo.times_used >= v_promo.max_uses THEN
        RETURN json_build_object('success', false, 'message', 'تم استنفاد الحد الأقصى لاستخدام هذا الكود.');
    END IF;

    -- 5. All good, increment usage
    UPDATE public.promo_codes 
    SET times_used = times_used + 1,
        updated_at = now()
    WHERE id = v_promo.id;

    -- 6. Return success and discount info
    RETURN json_build_object(
        'success', true, 
        'code', v_promo.code, 
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value
    );
END;
$$;

-- Seed default master code
INSERT INTO public.promo_codes (code, max_uses, discount_type, discount_value) 
VALUES ('DAWAYIR-VIP', NULL, 'vip_bypass', 100)
ON CONFLICT (code) DO NOTHING;

