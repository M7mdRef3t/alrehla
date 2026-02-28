import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoundaryEnforcer } from './BoundaryEnforcer';
import { geminiClient } from './geminiClient';
import { useFirewallState } from '../state/firewallState';
import { useGrowthState } from '../state/growthState';
import { useMapState } from '../state/mapState';

vi.mock('./geminiClient', () => ({
    geminiClient: {
        generate: vi.fn(),
    },
}));

vi.mock('../state/firewallState', () => ({
    useFirewallState: {
        getState: vi.fn(),
    },
}));

vi.mock('../state/growthState', () => ({
    useGrowthState: {
        getState: vi.fn(),
    },
}));

vi.mock('../state/mapState', () => ({
    useMapState: {
        getState: vi.fn(),
    },
}));

describe('BoundaryEnforcer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns { blocked: false } if node is not found', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: true,
            blockedNodeIds: ['123'],
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: true,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [],
        } as any);

        const result = await BoundaryEnforcer.interceptInteraction('123');
        expect(result).toEqual({ blocked: false });
    });

    it('returns { blocked: false } if shield is inactive, even if node is explicitly blocked or overclocking is true', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: false,
            blockedNodeIds: ['123'],
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: true,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [{ id: '123', label: 'Test Node', ring: 'yellow' }],
        } as any);

        const result = await BoundaryEnforcer.interceptInteraction('123');
        expect(result).toEqual({ blocked: false });
        expect(geminiClient.generate).not.toHaveBeenCalled();
    });

    it('returns blocked for MANUAL_BLOCK with auto reply when shield is active, node is explicitly blocked, and overclocking is false', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: true,
            blockedNodeIds: ['123'],
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: false,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [{ id: '123', label: 'Test Node', ring: 'yellow' }],
        } as any);

        vi.mocked(geminiClient.generate).mockResolvedValue('Mocked manual block reply');

        const result = await BoundaryEnforcer.interceptInteraction('123');

        expect(result).toEqual({
            blocked: true,
            reason: 'MANUAL_BLOCK',
            autoReply: 'Mocked manual block reply',
        });
        expect(geminiClient.generate).toHaveBeenCalledTimes(1);
    });

    it('returns blocked for ACTIVE_OVERCLOCK with auto reply when shield is active and overclocking is true', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: true,
            blockedNodeIds: [], // Not explicitly blocked
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: true,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [{ id: '123', label: 'Test Node', ring: 'yellow' }],
        } as any);

        vi.mocked(geminiClient.generate).mockResolvedValue('Mocked overclock reply');

        const result = await BoundaryEnforcer.interceptInteraction('123');

        expect(result).toEqual({
            blocked: true,
            reason: 'ACTIVE_OVERCLOCK',
            autoReply: 'Mocked overclock reply',
        });
        expect(geminiClient.generate).toHaveBeenCalledTimes(1);
    });

    it('returns the fallback auto reply when geminiClient.generate throws an error', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: true,
            blockedNodeIds: ['123'],
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: false,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [{ id: '123', label: 'Test Node', ring: 'yellow' }],
        } as any);

        vi.mocked(geminiClient.generate).mockRejectedValue(new Error('Gemini API Error'));

        const result = await BoundaryEnforcer.interceptInteraction('123');

        expect(result).toEqual({
            blocked: true,
            reason: 'MANUAL_BLOCK',
            autoReply: "محمد غير متاح حالياً للتركيز العميق. سيعاود الاتصال بك لاحقاً.",
        });
        expect(geminiClient.generate).toHaveBeenCalledTimes(1);
    });

    it('returns { blocked: false } if node exists but shield is active and node is neither explicitly blocked nor overclocking is on', async () => {
        vi.mocked(useFirewallState.getState).mockReturnValue({
            isShieldActive: true,
            blockedNodeIds: ['999'], // Different node is blocked
        } as any);

        vi.mocked(useGrowthState.getState).mockReturnValue({
            isOverclocking: false,
        } as any);

        vi.mocked(useMapState.getState).mockReturnValue({
            nodes: [{ id: '123', label: 'Test Node', ring: 'yellow' }],
        } as any);

        const result = await BoundaryEnforcer.interceptInteraction('123');
        expect(result).toEqual({ blocked: false });
        expect(geminiClient.generate).not.toHaveBeenCalled();
    });
});
