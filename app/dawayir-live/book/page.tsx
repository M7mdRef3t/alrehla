"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Clock8,
  Heart,
  MessageCircleMore,
  MessagesSquare,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
  Zap,
} from "lucide-react";
import { assignUrl } from "../../../src/services/navigation";

type SessionType = "video" | "audio" | "chat";
type SortMode = "rating" | "price";
type PackageId = "foundation" | "growth" | "transform";

type Consultant = {
  id: string;
  nameAr: string;
  specialtyAr: string;
  tags: string[];
  rating: number;
  sessions: number;
  price: number;
  availableNow: boolean;
  favorite: boolean;
  summaryAr: string;
  reviews: Array<{ name: string; rating: number; note: string }>;
};

const consultants: Consultant[] = [
  { id: "sarah", nameAr: "د. سارة الفارس", specialtyAr: "ديناميكيات الأسرة والقلق العملي", tags: ["نزاعات زوجية", "قلق العمل", "خطة نمو شخصية"], rating: 4.9, sessions: 1280, price: 180, availableNow: true, favorite: true, summaryAr: "جلسات هادئة وعملية تركز على الوضوح والحدود وخطوات قابلة للتنفيذ.", reviews: [{ name: "Karim A.", rating: 5, note: "خرجت من الجلسة بخطة واضحة بدل الدوران حول المشكلة." }, { name: "Mona S.", rating: 5, note: "أول مرة أشعر أن أحدًا فهم القلق بدون أحكام." }] },
  { id: "layla", nameAr: "د. ليلى حداد", specialtyAr: "الذكاء العاطفي والمرونة", tags: ["ذكاء عاطفي", "تواصل", "مرونة"], rating: 4.8, sessions: 940, price: 150, availableNow: false, favorite: false, summaryAr: "مناسبة لمن يريد بناء لغة داخلية أهدأ والتعامل مع التوتر بدون استنزاف.", reviews: [{ name: "Amani R.", rating: 5, note: "ساعدتني أسمّي مشاعري بدل ما أدفنها." }, { name: "Huda N.", rating: 4, note: "شرحها عملي وواضح جدًا." }] },
  { id: "omar", nameAr: "د. عمر خالد", specialtyAr: "وساطة النزاعات والعلاقات", tags: ["نزاعات زوجية", "حدود صحية", "إصلاح الثقة"], rating: 4.7, sessions: 760, price: 140, availableNow: true, favorite: false, summaryAr: "مناسب عندما تحتاج جلسة مباشرة تساعد الطرفين على التفاهم والاتفاق.", reviews: [{ name: "Faisal T.", rating: 5, note: "كان قادرًا على تهدئة الحوار بدون أن يضيع المعنى." }, { name: "Rana M.", rating: 4, note: "أعطانا خطوات واضحة بعد الجلسة مباشرة." }] },
  { id: "youssef", nameAr: "د. يوسف النجار", specialtyAr: "إدارة القلق والتحول الشخصي", tags: ["إدارة القلق", "تحولات الحياة", "ثقة نفس"], rating: 4.6, sessions: 640, price: 125, availableNow: true, favorite: true, summaryAr: "جلسات موجهة لمن يحتاج استقرارًا سريعًا وخطوات صغيرة ولكن ثابتة.", reviews: [{ name: "Salma F.", rating: 5, note: "نبرة هادئة وأسلوب يخفف التوتر فورًا." }, { name: "Noor H.", rating: 4, note: "أعاد لي الشعور بالقدرة على السيطرة." }] },
];

const packages: Array<{ id: PackageId; ar: string; en: string; sessions: number; discount: number; tip: string }> = [
  { id: "foundation", ar: "الباقة التأسيسية", en: "Foundation", sessions: 3, discount: 15, tip: "للبداية الواضحة وصياغة الاتجاه العام" },
  { id: "growth", ar: "باقة النمو", en: "Growth", sessions: 6, discount: 25, tip: "أكثر اختيار متوازن للمتابعة المنتظمة" },
  { id: "transform", ar: "باقة التحول", en: "Transformation", sessions: 10, discount: 40, tip: "للرحلة الأعمق مع أفضل قيمة" },
];

export default function DawayirLiveBookPage() {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("rating");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTag, setActiveTag] = useState("all");
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>("video");
  const [selectedPackage, setSelectedPackage] = useState<PackageId>("growth");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("2026-04-02");
  const [time, setTime] = useState("14:00");
  const [selectedConsultantId, setSelectedConsultantId] = useState("sarah");
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedConsultant = useMemo(
    () => consultants.find((c) => c.id === selectedConsultantId) ?? consultants[0],
    [selectedConsultantId],
  );

  const filteredConsultants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...consultants]
      .filter((c) => {
        const matchesSearch = !q || `${c.nameAr} ${c.specialtyAr} ${c.tags.join(" ")}`.toLowerCase().includes(q);
        const matchesFavorite = !favoritesOnly || c.favorite;
        const matchesTag = activeTag === "all" || c.tags.includes(activeTag);
        return matchesSearch && matchesFavorite && matchesTag;
      })
      .sort((a, b) => (sortMode === "price" ? a.price - b.price : b.rating - a.rating || b.sessions - a.sessions));
  }, [activeTag, favoritesOnly, search, sortMode]);

  const selectedPackageMeta = packages.find((p) => p.id === selectedPackage) ?? packages[1];
  const total = Math.max(selectedConsultant.price * selectedPackageMeta.sessions * (1 - selectedPackageMeta.discount / 100), selectedConsultant.price);
  const availableNow = selectedConsultant.availableNow;
  const tags = ["all", "نزاعات زوجية", "ذكاء عاطفي", "إدارة القلق", "تواصل", "تحولات الحياة", "حدود صحية", "الثقة"];

  return (
    <div className="complete-overlay booking-lens min-h-screen px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 booking-shell">
        <div className="complete-card booking-card">
          <div className="flex flex-wrap items-center gap-3">
            <span className="presentation-badge">Private Booking</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">Dawayir Live</span>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.22fr_0.78fr]">
            <div>
              <h1 className="complete-title booking-title" tabIndex={-1}>احجز موعدًا مع المستشار المناسب</h1>
              <p className="complete-subtitle" style={{ maxWidth: "54rem", marginInline: 0 }}>
                استكشف المستشارين في غرفة الحجز المباشر، ووازن بين التخصص والتقييم والتوفر قبل أن تؤكد الجلسة.
              </p>
            </div>
            <div className="complete-summary-panel booking-status-panel">
              <div className="complete-summary-panel__top">
                <div>
                  <div className="complete-summary-card__head"><Sparkles className="h-4 w-4 text-cyan-200" /><span>Live booking</span></div>
                  <div className="complete-summary-note">اختر الآن أو ابدأ استشارة فورية إذا ظهر المستشار متاحًا.</div>
                </div>
                <div className="complete-summary-meta">
                  <div className="complete-summary-meta__item"><Zap className="h-4 w-4" /><span>Fast booking</span></div>
                  <div className="complete-summary-meta__item"><ShieldCheck className="h-4 w-4" /><span>Private & secure</span></div>
                </div>
              </div>
            </div>
          </div>
          {confirmed ? <div className="mt-6 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-50 booking-confirmation">تم حفظ طلبك المبدئي مع {selectedConsultant.nameAr}. سنكمل بقية التفاصيل وفق نوع الجلسة والباقة المختارة.</div> : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr] booking-grid">
          <div className="space-y-6">
            <section className="session-action-card booking-discovery-card">
              <div className="sac-header"><span className="sac-icon"><Search size={16} /></span><span className="sac-title">استكشف المستشارين</span><span className="sac-badge">Discovery</span></div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_auto_auto]">
                <label className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><Search className="h-4 w-4" />Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن د. سارة..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35" /></label>
                <label className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><SlidersHorizontal className="h-4 w-4" />Sort by</span><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="w-full bg-transparent text-sm text-white outline-none"><option value="rating">الأعلى تقييمًا</option><option value="price">الأقل سعرًا</option></select></label>
                <button type="button" onClick={() => setFavoritesOnly((v) => !v)} className={`rounded-[18px] border px-4 py-3 text-start ${favoritesOnly ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-white/5 text-white/70"}`}><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"><Heart className="h-4 w-4" />Favorites</span><span className="block text-sm">{favoritesOnly ? "عرض المفضلة فقط" : "إظهار كل الخبراء"}</span></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <button key={tag} type="button" onClick={() => setActiveTag(tag)} className={`rounded-full border px-4 py-2 text-sm ${activeTag === tag ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-white/5 text-white/70"}`}>{tag === "all" ? "الكل" : tag}</button>)}</div>
            </section>

            <section className="session-action-card booking-roster-card">
              <div className="sac-header"><span className="sac-icon"><Users size={16} /></span><span className="sac-title">اختيار المستشار</span><span className="sac-badge">{filteredConsultants.length} results</span></div>
              <div className="mt-4 grid gap-4">
                {filteredConsultants.length ? filteredConsultants.map((c) => {
                  const active = c.id === selectedConsultant.id;
                  return (
                    <article key={c.id} className={`rounded-[24px] border p-4 ${active ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-300/18 to-violet-300/18 font-black ring-1 ring-cyan-300/10">{c.nameAr.slice(0, 2)}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-extrabold">{c.nameAr}</h2>
                              {c.availableNow ? <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">متاح الآن</span> : <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/60">لاحقًا</span>}
                              {c.favorite ? <span className="rounded-full border border-pink-300/25 bg-pink-300/10 px-2.5 py-1 text-[11px] font-semibold text-pink-100">مفضل</span> : null}
                            </div>
                            <p className="mt-1 text-sm text-white/68">{c.specialtyAr}</p>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/66">{c.summaryAr}</p>
                            <div className="mt-3 flex flex-wrap gap-2">{c.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72">{tag}</span>)}</div>
                          </div>
                        </div>
                        <div className="flex min-w-[220px] flex-col gap-3">
                          <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between text-sm text-white/75"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />{c.rating.toFixed(1)}</span><span>{c.sessions.toLocaleString()} جلسة</span></div>
                            <div className="mt-2 text-sm text-white/72">{c.price} USD / session</div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                            <button type="button" onClick={() => { setSelectedConsultantId(c.id); if (c.availableNow) setNotice(`استشارة فورية مع ${c.nameAr} جاهزة الآن.`); }} className={`rounded-[16px] border px-3 py-2 text-sm font-semibold ${active ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-white/5 text-white/80"}`}>{active ? "المستشار المختار" : "اختيار المستشار"}</button>
                            <button type="button" onClick={() => setReviewModalId(c.id)} className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80">عرض التقييمات</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }) : <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">لا توجد نتائج مطابقة.</div>}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr] booking-details-grid">
              <div className="session-action-card booking-schedule-card">
                <div className="sac-header"><span className="sac-icon"><Clock3 size={16} /></span><span className="sac-title">تفاصيل الحجز</span><span className="sac-badge">Booking</span></div>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { id: "video", label: "فيديو", icon: Video },
                      { id: "audio", label: "صوتي", icon: Phone },
                      { id: "chat", label: "محادثة خاصة", icon: MessagesSquare },
                    ].map(({ id, label, icon: Icon }) => {
                      const active = selectedSessionType === id;
                      return <button key={id} type="button" onClick={() => setSelectedSessionType(id as SessionType)} className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-start ${active ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-50" : "border-white/10 bg-white/5 text-white/75"}`}><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>{active ? <BadgeCheck className="h-4 w-4 text-cyan-200" /> : null}</button>;
                    })}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><CalendarDays className="h-4 w-4" />التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" /></label>
                    <label className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><Clock8 className="h-4 w-4" />الوقت</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" /></label>
                  </div>
                  <label className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><MessageCircleMore className="h-4 w-4" />ما الذي تريد التركيز عليه؟</span><textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اكتب 2-3 نقاط أو سؤالًا مباشرًا..." className="w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/35" /></label>
                </div>
              </div>

              <div className="session-action-card booking-pricing-card">
                <div className="sac-header"><span className="sac-icon"><Wallet size={16} /></span><span className="sac-title">التكلفة والباقات</span><span className="sac-badge">Summary</span></div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div><div className="text-xs uppercase tracking-[0.18em] text-white/52">المستشار الحالي</div><div className="mt-1 text-lg font-bold">{selectedConsultant.nameAr}</div><p className="mt-1 text-sm text-white/65">{selectedConsultant.specialtyAr}</p></div>
                      <div className="text-right"><div className="flex items-center justify-end gap-1 text-sm text-white/70"><Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />{selectedConsultant.rating.toFixed(1)}</div><div className="mt-1 text-sm text-white/55">{selectedConsultant.sessions.toLocaleString()} sessions</div></div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[16px] border border-white/10 bg-black/10 p-3"><div className="text-xs uppercase tracking-[0.16em] text-white/45">نوع الجلسة</div><div className="mt-1 text-sm font-semibold">{selectedSessionType === "video" ? "فيديو" : selectedSessionType === "audio" ? "صوتي" : "محادثة خاصة"}</div></div>
                      <div className="rounded-[16px] border border-white/10 bg-black/10 p-3"><div className="text-xs uppercase tracking-[0.16em] text-white/45">الموعد</div><div className="mt-1 text-sm font-semibold">{date} · {time}</div></div>
                      <div className="rounded-[16px] border border-white/10 bg-black/10 p-3"><div className="text-xs uppercase tracking-[0.16em] text-white/45">الإجمالي</div><div className="mt-1 text-sm font-semibold">{total.toFixed(0)} USD</div></div>
                    </div>
                    <div className="mt-4 rounded-[18px] border border-cyan-300/20 bg-cyan-300/8 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-cyan-50"><Sparkles className="h-4 w-4" />توصية ذكية</div><p className="mt-2 text-sm leading-7 text-cyan-50/80">{availableNow ? "هذا المستشار متاح الآن. يمكنك البدء فورًا أو حجز موعد لاحق." : "هذا المستشار غير متاح الآن. الحجز لاحقًا سيضمن لك أول موعد مناسب."}</p></div>
                  </div>
                  <div className="grid gap-3">
                    {packages.map((p) => {
                      const active = p.id === selectedPackage;
                      const amount = Math.max(selectedConsultant.price * p.sessions * (1 - p.discount / 100), selectedConsultant.price);
                      return <button key={p.id} type="button" onClick={() => setSelectedPackage(p.id)} className={`rounded-[20px] border p-4 text-start ${active ? "border-cyan-300/30 bg-cyan-300/12" : "border-white/10 bg-white/5"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-base font-bold">{p.ar}</span><span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[11px] text-violet-50">-{p.discount}%</span></div><p className="mt-1 text-sm text-white/65">{p.tip}</p></div>{active ? <BadgeCheck className="h-5 w-5 text-cyan-200" /> : null}</div><div className="mt-3 flex items-center justify-between text-sm text-white/70"><span>{p.sessions} جلسات</span><span className="font-semibold text-white">{amount.toFixed(0)} USD</span></div></button>;
                    })}
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70"><span>سعر الجلسة الواحدة</span><span>{selectedConsultant.price} USD</span></div>
                    <div className="mt-3 flex items-center justify-between text-sm text-white/70"><span>باقة {selectedPackageMeta.ar}</span><span>{total.toFixed(0)} USD</span></div>
                    <div className="mt-3 flex items-center justify-between text-sm text-white/70"><span>التخفيض</span><span className="text-emerald-200">-{selectedPackageMeta.discount}%</span></div>
                    <div className="mt-4 border-t border-white/10 pt-4"><div className="text-xs uppercase tracking-[0.18em] text-white/50">Final amount</div><div className="mt-1 text-2xl font-black text-white">{total.toFixed(0)} USD</div></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setNotice(availableNow ? `استشارة فورية مع ${selectedConsultant.nameAr} جاهزة الآن.` : `الحجز الفوري غير متاح مع ${selectedConsultant.nameAr} حالياً.`)} className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${availableNow ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-50" : "border-white/10 bg-white/5 text-white/60"}`}>{availableNow ? "استشارة فورية" : "حجز موعد لاحق"}</button>
                    <button type="button" onClick={() => setConfirmed(true)} className="rounded-[18px] border border-cyan-300/30 bg-cyan-300/18 px-4 py-3 text-sm font-semibold text-cyan-50">تأكيد وحجز الجلسة</button>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/68"><div className="flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-cyan-200" />ملاحظة</div>جميع الجلسات هنا خاصة وآمنة. يمكنك تعديل النوع أو الموعد قبل التأكيد بسهولة.</div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="complete-summary-panel">
              <div className="complete-summary-panel__top">
                <div><div className="complete-summary-card__head"><Heart className="h-4 w-4 text-pink-200" /><span>Instant support</span></div><div className="complete-summary-note">{notice ?? "المتاح الآن يظهر بوضوح، ويمكنك بدء الطلب أو حجز موعد لاحق من نفس الصفحة."}</div></div>
                <div className="complete-summary-meta"><div className="complete-summary-meta__item"><Zap className="h-4 w-4" /><span>{consultants.filter((c) => c.availableNow).length} available now</span></div><div className="complete-summary-meta__item"><Clock3 className="h-4 w-4" /><span>Flexible time slots</span></div></div>
              </div>
            </section>
            <section className="session-action-card">
              <div className="sac-header"><span className="sac-icon"><MessageCircleMore size={16} /></span><span className="sac-title">التقييمات والتجارب</span><span className="sac-badge">Reviews</span></div>
              <div className="mt-4 grid gap-3">{selectedConsultant.reviews.map((r) => <div key={r.name + r.note} className="rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm text-white/72"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{r.name}</span><span className="flex items-center gap-1 text-yellow-200"><Star className="h-4 w-4 fill-yellow-200 text-yellow-200" />{r.rating.toFixed(1)}</span></div><p className="mt-2 leading-7">{r.note}</p></div>)}</div>
            </section>
            <section className="session-action-card">
              <div className="sac-header"><span className="sac-icon"><Sparkles size={16} /></span><span className="sac-title">ماذا ستحصل عليه؟</span><span className="sac-badge">Outcome</span></div>
              <div className="mt-4 grid gap-3">{["رؤى شخصية مباشرة من المستشار المناسب", "خطة نمو واضحة ومناسبة لواقعك", "مرونة بين الفيديو والصوت والمحادثة"].map((item) => <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">{item}</div>)}</div>
            </section>
            <div className="complete-actions-row">
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={() => assignUrl("/dawayir-live")}><ArrowRight className="inline-block h-4 w-4" /> العودة للملخص</button>
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={() => assignUrl("/coach?tab=dawayir-live")}>لوحة المدرب</button>
            </div>
          </aside>
        </div>
      </div>

      {reviewModalId ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-xl">
          <div className="complete-card max-w-3xl">
            <div className="sac-header"><span className="sac-icon"><Star size={16} /></span><span className="sac-title">عرض التقييمات</span><span className="sac-badge">Glass modal</span></div>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-black text-white">{consultants.find((c) => c.id === reviewModalId)?.nameAr}</h2>
              <p className="mt-1 text-sm text-white/65">{consultants.find((c) => c.id === reviewModalId)?.specialtyAr}</p>
              <div className="mt-4 grid gap-3">{consultants.find((c) => c.id === reviewModalId)?.reviews.map((r) => <div key={r.name + r.note} className="rounded-[18px] border border-white/10 bg-black/10 p-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{r.name}</span><span className="flex items-center gap-1 text-yellow-200"><Star className="h-4 w-4 fill-yellow-200 text-yellow-200" />{r.rating.toFixed(1)}</span></div><p className="mt-2 text-sm leading-7 text-white/72">{r.note}</p></div>)}</div>
            </div>
            <div className="complete-actions-row mt-4">
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={() => setReviewModalId(null)}>إغلاق</button>
              <button className="primary-btn complete-action-btn" onClick={() => setSelectedConsultantId(reviewModalId)}>اختيار هذا المستشار</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
