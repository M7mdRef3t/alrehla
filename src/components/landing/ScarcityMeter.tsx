import type { FC } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface ScarcityMeterData {
  seatsLeft: number;
  totalSeats: number;
  fillPercent: number;
  fillColor: string;
}

interface ScarcityMeterProps {
  meter: ScarcityMeterData;
  countdown: string | null;
  showCheckoutHint: boolean;
  onOpenCheckout: () => void;
  itemVariants: Variants;
}

export const ScarcityMeter: FC<ScarcityMeterProps> = ({
  meter,
  countdown,
  showCheckoutHint,
  onOpenCheckout,
  itemVariants
}) => (
  <div className="mb-6 w-[min(22rem,92vw)] flex flex-col items-center justify-center">
    <motion.button
      type="button"
      variants={itemVariants}
      onClick={onOpenCheckout}
      className="w-full text-right rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40"
      aria-label="متابعة حجز المقعد"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-amber-200 uppercase tracking-wider">
          تبقى {meter.seatsLeft} مقعد فقط
        </div>
        <div className="text-sm font-bold text-slate-400">
          {meter.seatsLeft}/{meter.totalSeats}
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={meter.seatsLeft}
        aria-valuemin={0}
        aria-valuemax={meter.totalSeats}
        aria-label={`تبقى ${meter.seatsLeft} مقعد من أصل ${meter.totalSeats}`}
        className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/5"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${meter.fillPercent}%`, backgroundColor: meter.fillColor }}
        />
      </div>
      <p className="mt-1.5 text-sm text-slate-300/85 font-semibold">
        الفوج الحالي يغلق عند اكتمال المقاعد.
      </p>
      {countdown && (
        <p className="mt-1 text-sm font-bold text-amber-200/95">{countdown}</p>
      )}
    </motion.button>
    <p
      className={`mt-1 h-4 text-sm font-semibold transition-opacity ${showCheckoutHint ? "opacity-100 text-amber-200" : "opacity-0"}`}
    >
      سيتم فتح صفحة الحجز
    </p>
  </div>
);
