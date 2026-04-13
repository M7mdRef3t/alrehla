import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import {
    Users,
    Search,
    Download,
    Smartphone,
    Calendar,
    Clock,
    MapPin,
    Activity,
    MoreHorizontal,
    Shield,
    Ban,
    FileText,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchUserStates, fetchUserStateDetail, exportUserStates, fetchUsers, type UserStateRow, type AdminUserRow } from "@/services/adminApi";
import { downloadBlobFile } from "@/services/clientDom";

export const UserStatePanel: FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'registered' | 'visitors'>('registered');
    
    // Visitor State
    const [users, setUsers] = useState<UserStateRow[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Registered State
    const [registeredUsers, setRegisteredUsers] = useState<AdminUserRow[]>([]);
    const [loadingRegistered, setLoadingRegistered] = useState(false);
    
    // Shared
    const [query, setQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserStateRow | AdminUserRow | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Initial Load
    useEffect(() => {
        loadUsers();
        loadRegistered();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUserStates();
            // Mocking some extra data for visualization if not present
            const enhancedData = data?.map(u => ({
                ...u,
                lastActive: u.updatedAt || Date.now(),
                // Mock properties for demo (in real app these would come from API)
                journeyProgress: Math.floor(Math.random() * 100),
                status: Math.random() > 0.3 ? 'active' : 'idle',
                deviceType: Math.random() > 0.5 ? 'iOS' : 'Android'
            })) || [];

            setUsers(enhancedData as any);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistered = async () => {
        setLoadingRegistered(true);
        try {
            const data = await fetchUsers(500);
            setRegisteredUsers(data || []);
        } finally {
            setLoadingRegistered(false);
        }
    };

    const loadDetail = async (user: UserStateRow | AdminUserRow) => {
        setSelectedUser(user);
        
        // If it's a registered user, we might not have detailed "UserState" unless they have a linked device token.
        // For now, we will just show their base profile in the modal.
        if ('email' in user) {
            return; 
        }

        setDetailLoading(true);
        try {
            const visitor = user as UserStateRow;
            const detail = await fetchUserStateDetail(
                visitor.ownerId ? { ownerId: visitor.ownerId } : { deviceToken: visitor.deviceToken }
            );
            setSelectedUser(prev => prev ? ({ ...prev, ...detail }) : detail as any);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            if (activeTab === 'visitors') {
                const data = await exportUserStates(500);
                if (data) {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    downloadBlobFile(blob, `visitors-data-${new Date().toISOString().split('T')[0]}.json`);
                }
            } else {
                const blob = new Blob([JSON.stringify(registeredUsers, null, 2)], { type: "application/json" });
                downloadBlobFile(blob, `registered-users-${new Date().toISOString().split('T')[0]}.json`);
            }
        } finally {
            setExporting(false);
        }
    };

    // Filtering
    const filteredVisitors = useMemo(() => {
        const q = query.toLowerCase();
        return users.filter(u =>
            (u.ownerId || "").toLowerCase().includes(q) ||
            (u.deviceToken || "").toLowerCase().includes(q)
        );
    }, [users, query]);

    const filteredRegistered = useMemo(() => {
        const q = query.toLowerCase();
        return registeredUsers.filter(u =>
            (u.fullName || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q)
        );
    }, [registeredUsers, query]);

    const currentList = activeTab === 'visitors' ? filteredVisitors : filteredRegistered;
    const isLoading = activeTab === 'visitors' ? loading : loadingRegistered;

    // Stats
    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter(u => (u as any).status === 'active').length,
            newToday: users.filter(u => {
                const date = new Date(u.updatedAt || 0);
                const today = new Date();
                return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
            }).length
        };
    }, [users]);

    return (
        <div className="space-y-6 text-slate-200" dir="rtl">

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div 
                    onClick={() => setActiveTab('registered')}
                    className={`admin-glass-card p-5 flex items-center gap-4 cursor-pointer transition-all ${
                        activeTab === 'registered' ? 'bg-gradient-to-br from-indigo-500/20 to-transparent border-indigo-500/40' : 'hover:bg-indigo-500/5'
                    }`}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'registered' ? 'text-indigo-300' : 'text-slate-500'}`}>المسجلين</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-black text-white">{registeredUsers.length}</p>
                            {loadingRegistered && <Loader2 className="w-3 h-3 text-slate-500 animate-spin mb-1.5" />}
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => setActiveTab('visitors')}
                    className={`admin-glass-card p-5 flex items-center gap-4 cursor-pointer transition-all ${
                        activeTab === 'visitors' ? 'bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/40' : 'hover:bg-emerald-500/5'
                    }`}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'visitors' ? 'text-emerald-300' : 'text-slate-500'}`}>الزوار النشطين</p>
                        <p className="text-2xl font-black text-white">{users.length}</p>
                    </div>
                </div>

                <div className="admin-glass-card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">انضم اليوم</p>
                        <p className="text-2xl font-black text-white">{stats.newToday}</p>
                    </div>
                </div>

                <div className="admin-glass-card p-5 flex items-center justify-between gap-4">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-teal-500 hover:bg-teal-500/5 transition-all text-slate-400 hover:text-teal-400 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        <span className="text-xs font-bold">تصدير البيانات</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-glass-card p-4 sticky top-4 z-10 bg-slate-950/80 backdrop-blur-xl border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={activeTab === 'visitors' ? "بحث عن زائر (ID, Device Token)..." : "بحث عن مسجل (الاسم، البريد)..."}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>عرض {currentList.length} {activeTab === 'registered' ? 'مسجل' : 'زائر'}</span>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading && (
                    <div className="col-span-full py-20 flex justify-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                )}

                {!isLoading && currentList.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 admin-glass-card border-dashed">
                        لا توجد نتائج مطابقة
                    </div>
                )}

                {activeTab === 'visitors' ? (
                    filteredVisitors.map((user: any) => (
                        <motion.div
                            layoutId={`visitor-${user.deviceToken}`}
                            key={user.deviceToken}
                            onClick={() => loadDetail(user)}
                            className="admin-glass-card p-5 group hover:border-emerald-500/30 cursor-pointer transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs border border-slate-700">
                                        {(user.ownerId || "Guest").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate w-32">
                                            {user.ownerId || "زائر مجهول"}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                            <span className="text-[10px] text-slate-500">{user.status === 'active' ? 'متصل' : 'خامل'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                        {user.deviceType}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[10px] text-slate-500 space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" />
                                    <span className="truncate font-mono">{user.deviceToken}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>آخر ظهور: {new Date(user.lastActive).toLocaleDateString("ar-EG")}</span>
                                </div>
                            </div>

                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full"
                                    style={{ width: `${user.journeyProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                <span>تقدم البحث</span>
                                <span>{user.journeyProgress}%</span>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    filteredRegistered.map((user: any) => (
                        <motion.div
                            layoutId={`registered-${user.id}`}
                            key={user.id}
                            onClick={() => loadDetail(user)}
                            className="admin-glass-card p-5 group hover:border-indigo-500/30 cursor-pointer transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg border border-indigo-500/20">
                                        {(user.fullName || user.email || "R").slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="w-[180px]">
                                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate w-full" title={user.fullName}>
                                            {user.fullName}
                                        </h4>
                                        <div className="text-[10px] text-slate-400 truncate w-full" title={user.email}>
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-[10px] text-slate-500 space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    <span className="truncate">{user.role || "المستخدم العادي"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>تاريخ التسجيل: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "غير معروف"}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Detail Modal / Panel */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg font-bold">
                                        {((selectedUser as any).fullName || (selectedUser as any).ownerId || "U").slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{(selectedUser as any).fullName || (selectedUser as any).ownerId || "زائر مجهول"}</h3>
                                        <p className="text-xs text-slate-400 font-mono mt-1">{(selectedUser as any).email || (selectedUser as any).deviceToken || "بدون بريد"}</p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors" onClick={() => setSelectedUser(null)}>
                                    <ArrowLeft className="w-5 h-5 transform rotate-180" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {detailLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                                ) : (
                                    <>
                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
                                                <p className="text-[10px] text-slate-500 uppercase mb-1">تاريخ الانضمام</p>
                                                <p className="text-sm font-bold text-white">{new Date((selectedUser as any).createdAt || (selectedUser as any).updatedAt || Date.now()).toLocaleDateString("ar-EG")}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
                                                <p className="text-[10px] text-slate-500 uppercase mb-1">الرحلات المكتملة</p>
                                                <p className="text-sm font-bold text-white">0</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
                                                <p className="text-[10px] text-slate-500 uppercase mb-1">نقاط الوعي</p>
                                                <p className="text-sm font-bold text-emerald-400">0</p>
                                            </div>
                                        </div>

                                        {/* Raw Data Preview */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                سجل البيانات الخام
                                            </h4>
                                            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 max-h-60 overflow-auto">
                                                <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                                                    {JSON.stringify((selectedUser as any).data || selectedUser, null, 2)}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                إجراءات إدارية
                                            </h4>
                                            <div className="flex gap-3">
                                                <button className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700">
                                                    تصدير السجل
                                                </button>
                                                <button className="flex-1 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors border border-rose-500/20 flex items-center justify-center gap-2">
                                                    <Ban className="w-4 h-4" />
                                                    حظر المسافر
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
