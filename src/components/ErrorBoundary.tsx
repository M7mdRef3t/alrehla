import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // يمكن إضافة تسجيل للأخطاء هنا (مثل Sentry)
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearData = () => {
    if (
      confirm(
        "هل أنت متأكد؟ هيتم مسح كل البيانات المحفوظة والبدء من جديد."
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            {/* أيقونة الخطأ */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* العنوان */}
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              حصل خطأ غير متوقع 😔
            </h1>

            {/* الوصف */}
            <p className="text-slate-600 mb-6 leading-relaxed">
              ممكن تجرب تحدّث الصفحة أو تمسح البيانات وتبدأ من جديد
            </p>

            {/* تفاصيل الخطأ (للمطورين فقط في وضع التطوير) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-right">
                <p className="text-xs text-red-800 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* الأزرار */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-6 bg-gradient-to-l from-teal-600 to-teal-500 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-600 transition-all duration-200 shadow-lg shadow-teal-500/30"
              >
                🔄 إعادة المحاولة
              </button>

              <button
                onClick={this.handleClearData}
                className="w-full py-3 px-6 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                🗑️ مسح البيانات والبدء من جديد
              </button>

              <a
                href="/"
                className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block"
              >
                العودة للصفحة الرئيسية ←
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
