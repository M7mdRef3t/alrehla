import { geminiClient } from './geminiClient';
import { useFirewallState } from '../state/firewallState';
import { useGrowthState } from '../state/growthState';
import { useMapState } from '../state/mapState';

export interface InterceptionResult {
    blocked: boolean;
    reason?: string;
    autoReply?: string;
}

export class BoundaryEnforcer {
    /**
     * Intercepts an interaction and determines if it should be blocked.
     */
    public static async interceptInteraction(nodeId: string): Promise<InterceptionResult> {
        const { isShieldActive, blockedNodeIds } = useFirewallState.getState();
        const { isOverclocking } = useGrowthState.getState();
        const node = useMapState.getState().nodes.find(n => n.id === nodeId);

        if (!node) return { blocked: false };

        const isExplicitlyBlocked = blockedNodeIds.includes(nodeId);

        // Block if shield is active and node is explicitly blocked OR if Overclocking is on
        if (isShieldActive && (isExplicitlyBlocked || isOverclocking)) {
            const autoReply = await this.generateAutoReply(node.label, node.ring);
            return {
                blocked: true,
                reason: isOverclocking ? 'ACTIVE_OVERCLOCK' : 'MANUAL_BLOCK',
                autoReply
            };
        }

        return { blocked: false };
    }

    /**
     * Uses Gemini to craft a situational auto-reply.
     */
    private static async generateAutoReply(name: string, ring: string): Promise<string> {
        const prompt = `
            بصفتك المساعد الشخصي (System Architect) لمحمد. 
            محمد الآن في "حالة تركيز قصوى" (Overclocking Mode) ويمنع استقبال أي تشتيت.
            شخص يدعى "${name}" (علاقة في المدار الـ ${ring}) يحاول التواصل.
            
            المطلوب: كتابة رسالة رد آلي قصيرة جداً، مهذبة لكن حازمة بالعامية المصرية.
            الرسالة يجب أن توضح أن محمد حالياً "مش متاح نهائياً" وهيرجع يكلمهم لما يخلص.
            اجعل نبرة الصوت تتناسب مع كونها "رسالة نظام آلي".
        `;

        try {
            const result = await geminiClient.generate(prompt);
            return result || "محمد غير متاح حالياً للتركيز العميق. سيعاود الاتصال بك لاحقاً.";
        } catch {
            return "محمد غير متاح حالياً للتركيز العميق. سيعاود الاتصال بك لاحقاً.";
        }
    }
}
