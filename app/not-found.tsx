export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "0.5rem" }}>404</h1>
      <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "2rem" }}>
        الصفحة غير موجودة
      </p>
      <a
        href="/"
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "1rem",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        الرجوع للرئيسية
      </a>
    </div>
  );
}
