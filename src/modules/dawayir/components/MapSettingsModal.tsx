import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3X3, Type, RotateCcw } from 'lucide-react';

interface MapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    showGrid: boolean;
    showLabels: boolean;
  };
  onUpdateSettings: (settings: { showGrid: boolean; showLabels: boolean }) => void;
  onResetMap: () => void;
}

export function MapSettingsModal({ isOpen, onClose, settings, onUpdateSettings, onResetMap }: MapSettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            dir="rtl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">إعدادات الخريطة</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Grid Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-xl">
                    <Grid3X3 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">شبكة الإحداثيات</span>
                    <span className="text-[10px] text-slate-500">إظهار خطوط الطول والعرض</span>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, showGrid: !settings.showGrid })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.showGrid ? 'bg-teal-500' : 'bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: settings.showGrid ? 24 : 4 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* Labels Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Type className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">أسماء النودز</span>
                    <span className="text-[10px] text-slate-500">عرض النصوص بجانب الدوائر</span>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, showLabels: !settings.showLabels })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.showLabels ? 'bg-purple-500' : 'bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: settings.showLabels ? 24 : 4 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من مسح الخريطة بالكامل؟ لا يمكن التراجع.")) {
                      onResetMap();
                      onClose();
                    }
                  }}
                  className="w-full py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all font-bold text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  مسح وإعادة ضبط الخريطة
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
