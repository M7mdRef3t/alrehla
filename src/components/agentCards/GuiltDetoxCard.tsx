import type { FC } from "react";

export const GuiltDetoxCard: FC = () => (
  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 max-w-[85%]">
    <p className="text-sm font-medium text-amber-900 mb-1">محكمة الذنب</p>
    <p className="text-xs text-amber-800 leading-relaxed">
      الذنب اللي مش من حقك مالهاش محكمة. سيب الحكم لوقته، واختار ردّك من مكان الهدوء مش الخوف.
    </p>
  </div>
);
