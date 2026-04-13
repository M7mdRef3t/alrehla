import type { ElementType, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { useAppContentState } from '@/modules/map/dawayirIndex';
import { isSupabaseReady } from "@/services/supabaseClient";
import { useAdminState } from "@/domains/admin/store/admin.store";

type EditableTag = keyof JSX.IntrinsicElements;

export interface EditableTextProps {
  id: string;
  defaultText: string;
  page?: string;
  as?: EditableTag;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  showEditIcon?: boolean;
  editOnClick?: boolean;
}

function normalizeRole(raw: string | null): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function canEditAppContent(role: string | null): boolean {
  const r = normalizeRole(role);
  return r === "owner" || r === "superadmin";
}

export function EditableText({
  id,
  defaultText,
  page,
  as = "span",
  className,
  multiline = false,
  placeholder,
  showEditIcon = true,
  editOnClick = true
}: EditableTextProps) {
  const key = useMemo(() => String(id ?? "").trim(), [id]);
  const ensure = useAppContentState((s) => s.ensure);
  const upsert = useAppContentState((s) => s.upsert);
  const entry = useAppContentState((s) => (key ? s.byKey[key] : undefined));
  const savingOrLoading = useAppContentState((s) => (key ? s.status[key] === "loading" : false));
  const storeError = useAppContentState((s) => (key ? s.errors[key] : null));

  const authUser = useAuthState((s) => s.user);
  const effectiveRole = useAuthState(getEffectiveRoleFromState);
  const isContentEditingEnabled = useAdminState((s) => s.isContentEditingEnabled);

  // Can edit if:
  // 1. User has correct role (owner/superadmin)
  // 2. Global "Edit Mode" is toggled ON in admin dashboard
  // 3. Supabase is ready
  const canEdit = Boolean(
    authUser &&
    isSupabaseReady &&
    canEditAppContent(effectiveRole) &&
    isContentEditingEnabled
  );

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(defaultText);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const text = entry?.content ?? defaultText;
  const sourceLabel = entry?.source === "remote" ? "قاعدة البيانات" : "قالب";

  useEffect(() => {
    if (!key) return;
    void ensure(key, defaultText, { page });
  }, [ensure, key, defaultText, page]);

  useEffect(() => {
    if (!open) setDraft(text);
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current && "select" in inputRef.current) {
        try {
          (inputRef.current as HTMLInputElement | HTMLTextAreaElement).select();
        } catch {
          // ignore
        }
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
      setLocalError(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const handleSave = async () => {
    if (!key) return;
    setLocalError(null);
    const ok = await upsert(key, draft, { page });
    if (ok) {
      setOpen(false);
      return;
    }
    setLocalError(storeError || "فشل حفظ النص.");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setLocalError(null);
      return;
    }
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      void handleSave();
      return;
    }
    if (multiline && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSave();
    }
  };

  const Tag = as as ElementType;
  const wrapperClassName = `relative inline-block align-middle ${canEdit && showEditIcon ? "group/edit" : ""} ${className ?? ""
    }`;

  return (
    <Tag className={wrapperClassName}>
      <span
        className={canEdit && editOnClick ? "cursor-text" : undefined}
        onClick={(e) => {
          if (!canEdit || !editOnClick) return;
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
          setLocalError(null);
        }}
      >
        {text}
      </span>

      {canEdit && showEditIcon && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
            setLocalError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
            setLocalError(null);
          }}
          className="absolute -right-7 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 px-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-white dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300 dark:hover:text-white transition-opacity opacity-30 group-hover/edit:opacity-100 focus-visible:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="تعديل النص"
          title="تعديل النص"
        >
          <Pencil className="w-3.5 h-3.5" />
        </span>
      )}

      {open && canEdit && (
        <div
          ref={popoverRef}
          className="absolute z-[90] top-full right-0 mt-2 w-[min(90vw,360px)] rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
          role="dialog"
          aria-label="تعديل النص"
        >
          <div className="flex items-start gap-2">
            {multiline ? (
              <textarea
                ref={(el) => {
                  inputRef.current = el;
                }}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={placeholder ?? "اكتب النص..."}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            ) : (
              <input
                ref={(el) => {
                  inputRef.current = el;
                }}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder ?? "اكتب النص..."}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={savingOrLoading}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setLocalError(null);
                  setDraft(text);
                }}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between gap-3">
              <span>المفتاح: {key}</span>
              <span>المصدر: {sourceLabel}</span>
            </div>
            <div className="text-right">{multiline ? "Ctrl+Enter للحفظ" : "Enter للحفظ"}</div>
          </div>

          {(localError || storeError) && (
            <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">
              {localError || storeError}
            </p>
          )}
        </div>
      )}
    </Tag>
  );
}


