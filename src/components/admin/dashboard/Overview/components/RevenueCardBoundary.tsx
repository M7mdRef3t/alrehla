import { logger } from "@/services/logger";
import React from "react";

interface RevenueCardBoundaryProps {
  children: React.ReactNode;
}

interface RevenueCardBoundaryState {
  hasError: boolean;
}

export class RevenueCardBoundary extends React.Component<
  RevenueCardBoundaryProps,
  RevenueCardBoundaryState
> {
  public constructor(props: RevenueCardBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): RevenueCardBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown): void {
    // Keep card failure isolated from the rest of Overview.
    logger.error("RevenueCardBoundary error", error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100" dir="rtl">
          <p className="text-sm font-bold">تعذر تحميل بطاقة الربحية</p>
          <p className="mt-1 text-xs text-rose-200">باقي لوحة التحكم تعمل بشكل طبيعي. حدّث الصفحة لإعادة المحاولة.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

