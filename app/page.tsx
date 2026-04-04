export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, rgba(20,184,166,0.18), transparent 34%), linear-gradient(180deg, #04131a 0%, #071821 100%)",
        color: "#f8fafc",
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "28px",
          padding: "32px",
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          backdropFilter: "blur(18px)"
        }}
      >
        <p style={{ margin: 0, opacity: 0.7, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          alrehla
        </p>
        <h1 style={{ margin: "12px 0 16px", fontSize: "clamp(2rem, 4vw, 4rem)", lineHeight: 1.05 }}>
          المنصة جاهزة للتشغيل
        </h1>
        <p style={{ margin: 0, maxWidth: 560, lineHeight: 1.7, color: "rgba(248,250,252,0.82)" }}>
          الصفحة الرئيسية الآن خفيفة جدًا لتفتح فورًا في وضع التطوير بدون تعليق. اضغط الزر
          لتشغيل التجربة الكاملة عند الحاجة.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="/app"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              padding: "0 20px",
              borderRadius: 999,
              background: "#14b8a6",
              color: "#052026",
              fontWeight: 800,
              textDecoration: "none"
            }}
          >
            تشغيل المنصة
          </a>
          <span style={{ display: "inline-flex", alignItems: "center", color: "rgba(248,250,252,0.7)" }}>
            الوضع الحالي: shell سريع
          </span>
        </div>
      </section>
    </main>
  );
}
