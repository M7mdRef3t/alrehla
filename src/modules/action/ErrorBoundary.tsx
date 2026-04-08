import { logger } from "@/services/logger";
/**
 * ErrorBoundary Component
 * مكون لالتقاط الأخطاء ومنع انهيار التطبيق
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-lg font-bold text-red-400">
              حدث خطأ غير متوقع
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              عذراً، حدث خطأ في التطبيق. يرجى إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different sections
export const MapErrorFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center p-6">
    <div className="text-center space-y-4">
      <div className="text-4xl">🗺️</div>
      <h3 className="text-lg font-bold text-orange-400">
        خطأ في تحميل الخريطة
      </h3>
      <p className="text-sm text-slate-400">
        يرجى المحاولة مرة أخرى لاحقاً
      </p>
    </div>
  </div>
);

export const ChatErrorFallback = () => (
  <div className="min-h-[300px] flex items-center justify-center p-6">
    <div className="text-center space-y-4">
      <div className="text-4xl">💬</div>
      <h3 className="text-lg font-bold text-blue-400">
        خطأ في تحميل المحادثة
      </h3>
      <p className="text-sm text-slate-400">
        يمكنك المتابعة بدون المحادثة الذكية
      </p>
    </div>
  </div>
);

export const PulseErrorFallback = () => (
  <div className="min-h-[200px] flex items-center justify-center p-6">
    <div className="text-center space-y-4">
      <div className="text-4xl">🧭</div>
      <h3 className="text-lg font-bold text-amber-400">
        خطأ في مؤشر البوصلة
      </h3>
      <p className="text-sm text-slate-400">
        يمكنك المتابعة بدون قياس الطاقة
      </p>
    </div>
  </div>
);
