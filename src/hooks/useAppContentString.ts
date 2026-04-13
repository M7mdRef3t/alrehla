import { useEffect, useMemo } from "react";
import { useAppContentState } from '@/modules/map/dawayirIndex';

interface UseAppContentStringOptions {
  page?: string;
}

/**
 * Hook بسيط يرجّع string جاهز للاستخدام في attributes
 * مثال:
 *   const placeholder = useAppContentString("landing_email_placeholder", "اكتب إيميلك", { page: "landing" });
 *   <input placeholder={placeholder} />
 */
export function useAppContentString(
  key: string,
  fallback: string,
  options?: UseAppContentStringOptions
): string {
  const normalizedKey = (key ?? "").trim();
  const page = options?.page ?? null;

  const ensure = useAppContentState((s) => s.ensure);
  const entry = useAppContentState((s) =>
    normalizedKey ? s.byKey[normalizedKey] : undefined
  );

  // اطلب القيمة من Supabase مرة واحدة لكل key
  useEffect(() => {
    if (!normalizedKey || entry) return;
    void ensure(normalizedKey, fallback, { page: page ?? undefined });
  }, [normalizedKey, fallback, page, entry, ensure]);

  return useMemo(() => {
    if (!normalizedKey) return fallback;
    return entry?.content ?? fallback;
  }, [normalizedKey, entry, fallback]);
}

