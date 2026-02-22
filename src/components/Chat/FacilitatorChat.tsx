"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Loader2, Check, Terminal } from 'lucide-react';
import { NodeData } from '../../hooks/useDawayirEngine';

interface FacilitatorChatProps {
    focusedNode: NodeData;
    fullMap: unknown;
    onClose: () => void;
    onUpdateNode: (nodeId: string, updates: Partial<NodeData>) => void;
}
interface ProposedAction {
    action?: string;
    nodeId?: string;
    updates?: Partial<NodeData>;
}


export default function FacilitatorChat({ focusedNode, fullMap, onClose, onUpdateNode }: FacilitatorChatProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, proposedAction?: ProposedAction, actionTaken?: boolean }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initial greeting from the AI based on the node
    useEffect(() => {
        const fetchInitialGreeting = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/chat/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: 'Ù…Ø±Ø­Ø¨Ø§Ù‹. Ø£Ø±Ø¯Øª Ø§Ù„ØªØ­Ø¯Ø« Ø¹Ù† Ù‡Ø°Ù‡ Ø§Ù„Ø¯Ø§Ø¦Ø±Ø©.' }],
                        fullMap,
                        focusedNode
                    })
                });
                const data = await res.json();
                setMessages([{ role: 'ai', content: data.reply, proposedAction: data.proposedAction }]);
            } catch (err) {
                console.error("Initial greeting failed", err);
                setMessages([{ role: 'ai', content: `Ø£Ù‡Ù„Ø§Ù‹ Ø¨ÙƒØŒ Ù„Ù†Ø¯Ø±Ø¯Ø´ Ø­ÙˆÙ„ Ù…Ø³Ø§Ø­Ø© "${focusedNode.label}" ÙÙŠ Ø­ÙŠØ§ØªÙƒ.` }]);
            } finally {
                setIsLoading(false);
            }
        };

        // Reset conversation when node changes
        setMessages([]);
        fetchInitialGreeting();
    }, [focusedNode, fullMap]); // Re-run if they click a DIFFERENT node

    const handleApproveAction = async (msgIndex: number, action: ProposedAction) => {
        // Mark as taken
        setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, actionTaken: true } : m));

        // Execute the UI change
        onUpdateNode(action.nodeId || focusedNode.id, action.updates ?? {});

        // Tell the AI it was done
        setIsLoading(true);
        try {
            const res = await fetch('/api/chat/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: '[System: The user has approved the physical change to the map. Acknowledge this briefly and playfully.]' }],
                    fullMap,
                    focusedNode
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'user', content: 'Ù„Ù‚Ø¯ Ù‚Ù…Øª Ø¨ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ. Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ.' }, { role: 'ai', content: data.reply, proposedAction: data.proposedAction }]);
        } catch {
            // Error silently, not critical
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    fullMap,
                    focusedNode
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.reply, proposedAction: data.proposedAction }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: "Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø§Ù†Ù‚Ø·Ø¹ Ø­Ø¨Ù„ Ø£ÙÙƒØ§Ø±ÙŠ Ù…Ø¤Ù‚ØªØ§Ù‹." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getBgColor = (color: string) => {
        switch (color) {
            case 'core': return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
            case 'danger': return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
            case 'neutral': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
            case 'ignored': return 'bg-slate-800/40 text-slate-400 border-slate-700/50';
            default: return 'bg-slate-800/40 text-slate-400 border-slate-700/50';
        }
    };

    return (
        <div className="absolute right-6 top-6 bottom-6 w-96 z-50 glass-heavy flex flex-col border-white/10 animate-in slide-in-from-right-8 duration-500 overflow-hidden" dir="rtl">
            {/* Header */}
            <div className={`px-6 py-5 flex justify-between items-center border-b border-white/5 bg-white/5 backdrop-blur-md`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xs uppercase tracking-widest font-mono">Ø£ÙˆØ±Ø§ÙƒÙ„_Ø§Ù„Ø³ÙŠØ§Ø¯Ø©</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Ø¬Ø§Ø±ÙŠ_Ø§Ù„ÙØ­Øµ:</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getBgColor(focusedNode.color)} font-black font-mono uppercase tracking-tighter`}>
                                {focusedNode.label}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] my-auto mt-20 font-mono">ÙÙŠ_Ø§Ù†ØªØ¸Ø§Ø±_Ø§Ù„Ù…Ø¯Ø®Ù„Ø§Øª...</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                            ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-bl-sm font-medium shadow-lg shadow-indigo-600/10'
                                : 'glass text-slate-200 border-white/5 rounded-br-sm shadow-inner'
                            }`}
                        >
                            {msg.content}
                        </div>
                        {msg.role === 'ai' && msg.proposedAction && msg.proposedAction.action === 'UPDATE_NODE' && (
                            <div className="mr-2 mb-2 self-start">
                                {!msg.actionTaken ? (
                                    <button
                                        onClick={() => handleApproveAction(i, msg.proposedAction!)}
                                        className="text-xs px-4 py-2 bg-teal-500 text-slate-950 hover:bg-teal-400 rounded-xl font-black transition flex items-center gap-2 shadow-lg shadow-teal-500/20 uppercase tracking-tighter"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„ Ø§Ù„Ù…Ù‚ØªØ±Ø­
                                    </button>
                                ) : (
                                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1.5 font-mono uppercase tracking-tighter"><Check className="w-3.5 h-3.5" /> ØªÙ…_ØªØ·Ø¨ÙŠÙ‚_Ø§Ù„Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„_Ø¨Ù†Ø¬Ø§Ø­</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="glass border-white/5 px-6 py-4 rounded-2xl rounded-bl-sm flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/10 group focus-within:border-teal-500/30 transition-all relative"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ù…Ø§Ø°Ø§ ØªÙˆØ¯ Ø£Ù† ØªÙ‚ÙˆÙ„ Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¬Ø²Ø¡ Ø§Ù„Ù…ÙØ³ØªÙ†Ø²ÙØŸ..."
                        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-white placeholder:text-slate-600"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-12 h-12 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center hover:bg-teal-400 disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-teal-500/10 active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}


