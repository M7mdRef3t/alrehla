import type { FC } from "react";
import { ArrowRight } from "lucide-react";
import { privacyCopy, termsCopy } from "../copy/legal";

interface LegalPageProps {
  type: "privacy" | "terms";
}

export const LegalPage: FC<LegalPageProps> = ({ type }) => {
  const copy = type === "privacy" ? privacyCopy : termsCopy;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full overflow-auto isolate relative"
      style={{ background: "var(--space-void)" }}
      dir="rtl"
    >
      <div className="nebula-bg absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[680px] mx-auto px-5 sm:px-6 py-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 mb-8 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </a>

        <h1
          id="legal-title"
          className="text-2xl sm:text-3xl font-bold text-white mb-2"
          style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
        >
          {copy.title}
        </h1>
        <p className="text-slate-400 text-sm mb-8">{copy.lastUpdated}</p>
        <p className="text-slate-300 leading-relaxed mb-10">{copy.intro}</p>

        <div className="space-y-8">
          {copy.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-teal-400 mb-2">{section.heading}</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-slate-400 text-sm">{copy.contact}</p>
        <div className="h-12" />
      </div>
    </div>
  );
};
