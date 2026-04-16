import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "default";

  const isReferral = type === "referral";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0a0a1a 0%, #1a103d 40%, #0d1117 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Rings */}
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: "2px solid rgba(248,113,113,0.2)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "2px solid rgba(251,191,36,0.25)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "3px solid rgba(52,211,153,0.35)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 40px rgba(52,211,153,0.15)",
          }}
        />

        {/* Dots on rings */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const ringRadii = [210, 140, 70];
          const colors = [
            "rgba(248,113,113,0.8)",
            "rgba(251,191,36,0.8)",
            "rgba(52,211,153,0.8)",
          ];
          const r = ringRadii[i % 3];
          const cx = 600 + Math.cos(rad) * r;
          const cy = 315 + Math.sin(rad) * r;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx - 6,
                top: cy - 6,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: colors[i % 3],
                boxShadow: `0 0 12px ${colors[i % 3]}`,
              }}
            />
          );
        })}

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 50,
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#a78bfa",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#c4b5fd",
                letterSpacing: 2,
              }}
            >
              {isReferral ? "دعوة خاصة" : "الرحلة"}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: isReferral ? 48 : 52,
              fontWeight: 900,
              color: "white",
              lineHeight: 1.3,
              margin: 0,
              marginBottom: 16,
            }}
          >
            {isReferral
              ? "صديقك يدعوك لاكتشاف"
              : "اكتشف خريطة"}
          </h1>
          <h2
            style={{
              fontSize: isReferral ? 44 : 48,
              fontWeight: 900,
              background: "linear-gradient(90deg, #2dd4bf, #a78bfa)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.3,
              margin: 0,
              marginBottom: 24,
            }}
          >
            {isReferral
              ? "خريطة علاقاتك"
              : "علاقاتك في ٣ دقائق"}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 20,
              color: "rgba(148,163,184,0.8)",
              maxWidth: 500,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            بوصلة الوعي الذاتي وخريطة العلاقات
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "rgba(148,163,184,0.5)",
              letterSpacing: 3,
            }}
          >
            alrehla.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
