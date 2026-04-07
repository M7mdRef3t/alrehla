import React, { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Users, MailCheck, X, Lock } from 'lucide-react';
import { soundManager } from '@/services/soundManager';
import { trackEvent } from '@/services/analytics';

// Sample Members list
const SAMPLE_MEMBERS = [
  { id: '1', name: 'أحمد سعيد', role: 'موجه سلوكي', avatar: 'https://i.pravatar.cc/150?u=ahmed' },
  { id: '2', name: 'سارة خالد', role: 'خبير تحليل', avatar: 'https://i.pravatar.cc/150?u=sara' },
  { id: '3', name: 'عمر طارق', role: 'عضو نشط', avatar: 'https://i.pravatar.cc/150?u=omar' },
];

export interface PrivateCircleInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleName?: string;
  circleDescription?: string;
}

export const PrivateCircleInvitationModal: FC<PrivateCircleInvitationModalProps> = ({ 
  isOpen, 
  onClose,
  circleName = "Deep Introspection Mastery",
  circleDescription = "Advanced behavioral mapping and conflict resolution strategies"
}) => {
  if (!isOpen) return null;

  const handleAccept = () => {
    soundManager.playClick();
    trackEvent("accept_private_circle_invitation");
    // Placeholder action for accepting
    onClose();
  };

  const handleDecline = () => {
    soundManager.playClick();
    trackEvent("decline_private_circle_invitation");
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        {/* Deep immersive backdrop for private invitation feel */}
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          onClick={handleDecline} 
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl bg-slate-900/80 border border-indigo-500/30 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {/* Header Graphic Section */}
          <div className="relative h-48 bg-gradient-to-br from-indigo-900/60 to-slate-900 flex flex-col items-center justify-center overflow-hidden border-b border-indigo-500/20">
            {/* Minimal Pattern overlay */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              <MailCheck className="w-10 h-10 text-indigo-300" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 text-2xl md:text-3xl font-black text-white text-center tracking-tight"
            >
              {circleName}
            </motion.h2>

            <button
              onClick={handleDecline}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-8">
            
            {/* Description */}
            <div className="text-center space-y-2">
              <p className="text-indigo-200/80 text-sm md:text-base font-medium leading-relaxed">
                لقد تم ترشيحك للانضمام إلى هذه الدائرة الخاصة.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
                {circleDescription}
              </p>
            </div>

            {/* Prominent Members */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 px-1">
                <Users className="w-4 h-4 text-indigo-400" />
                أبرز المحللين والأعضاء
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_MEMBERS.map((member, i) => (
                  <motion.div 
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex flex-col items-center p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                  >
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-14 h-14 rounded-full mb-3 border-2 border-indigo-500/30 object-cover"
                    />
                    <span className="font-semibold text-slate-200 text-sm">{member.name}</span>
                    <span className="text-xs text-indigo-400 font-medium mt-1">{member.role}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Privacy Section */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/50">
              <div className="p-2 rounded-xl bg-emerald-900/40 text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-100 mb-1">خصوصية Ethereal المطلقة</h4>
                <p className="text-xs text-emerald-200/70 leading-relaxed md:leading-relaxed pr-1 border-r-2 border-emerald-500/30">
                  يتم تشفير كافة التفاعلات، التحليلات، والمناقشات داخل هذه الدائرة وتستند إلى بروتوكول حصري وغير قابل للمشاركة خارج محيط الأعضاء المعتمدين.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleAccept}
                className="w-full sm:flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
              >
                <span>قبول الدعوة</span>
                <ShieldCheck className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDecline}
                className="w-full sm:w-auto px-6 py-4 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-xl font-semibold transition-all active:scale-[0.98]"
              >
                رفض / لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
