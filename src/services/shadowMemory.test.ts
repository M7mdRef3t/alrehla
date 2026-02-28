import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShadowMemory } from './shadowMemory';
import * as supabaseClient from './supabaseClient';
import { calculateEntropy } from './predictiveEngine';
import { DispatcherEngine } from './dispatcherEngine';

vi.mock('./supabaseClient', () => {
    return {
        supabase: {
            from: vi.fn(),
        }
    };
});

vi.mock('./predictiveEngine', () => {
    return {
        calculateEntropy: vi.fn(),
    };
});

vi.mock('./dispatcherEngine', () => {
    return {
        DispatcherEngine: {
            checkAndDispatch: vi.fn(),
        }
    };
});

describe('ShadowMemory', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Date to have predictable timestamps
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('recordSnapshot', () => {
        const mockUserId = 'user-123';
        const mockInsight = {
            state: 'CHAOS' as const,
            entropyScore: 85,
            primaryFactor: 'mood_instability',
            unstableNodes: 2,
            pulseVolatility: 1.5,
            lowEnergyRatio: 0.8
        };

        it('should return early if supabase is null', async () => {
            // Mock supabase to be null for this specific test
            Object.defineProperty(supabaseClient, 'supabase', { value: null, configurable: true });

            await ShadowMemory.recordSnapshot(mockUserId);

            expect(calculateEntropy).not.toHaveBeenCalled();
            expect(DispatcherEngine.checkAndDispatch).not.toHaveBeenCalled();

            // Restore mock
            Object.defineProperty(supabaseClient, 'supabase', { value: { from: vi.fn() }, configurable: true });
        });

        it('should successfully record a snapshot and trigger dispatcher', async () => {
            vi.mocked(calculateEntropy).mockReturnValue(mockInsight);

            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ insert: mockInsert } as any);

            // Spy on console.warn to suppress it in tests
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await ShadowMemory.recordSnapshot(mockUserId);

            expect(calculateEntropy).toHaveBeenCalledOnce();

            expect(supabaseClient.supabase!.from).toHaveBeenCalledWith('shadow_snapshots');
            expect(mockInsert).toHaveBeenCalledWith({
                user_id: mockUserId,
                entropy_score: mockInsight.entropyScore,
                state: mockInsight.state,
                primary_factor: mockInsight.primaryFactor,
                timestamp: '2024-01-01T12:00:00.000Z'
            });

            expect(DispatcherEngine.checkAndDispatch).toHaveBeenCalledWith(mockUserId, mockInsight);
            expect(warnSpy).toHaveBeenCalledWith("🌘 Shadow Snapshot recorded for user:", mockUserId);

            warnSpy.mockRestore();
        });

        it('should log an error and not trigger dispatcher if insert fails', async () => {
            vi.mocked(calculateEntropy).mockReturnValue(mockInsight);

            const mockError = new Error('Database connection failed');
            const mockInsert = vi.fn().mockResolvedValue({ error: mockError });
            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ insert: mockInsert } as any);

            // Spy on console.error to suppress it in tests and verify it
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await ShadowMemory.recordSnapshot(mockUserId);

            expect(supabaseClient.supabase!.from).toHaveBeenCalledWith('shadow_snapshots');
            expect(mockInsert).toHaveBeenCalled();

            expect(DispatcherEngine.checkAndDispatch).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith("Failed to record Shadow Memory:", mockError);

            errorSpy.mockRestore();
        });

        it('should handle exception thrown during execution', async () => {
            vi.mocked(calculateEntropy).mockReturnValue(mockInsight);

            const mockError = new Error('Unexpected exception');
            const mockInsert = vi.fn().mockRejectedValue(mockError);
            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ insert: mockInsert } as any);

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await ShadowMemory.recordSnapshot(mockUserId);

            expect(DispatcherEngine.checkAndDispatch).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith("Failed to record Shadow Memory:", mockError);

            errorSpy.mockRestore();
        });
    });

    describe('getHistory', () => {
        const mockUserId = 'user-123';

        it('should return early with empty array if supabase is null', async () => {
            Object.defineProperty(supabaseClient, 'supabase', { value: null, configurable: true });

            const result = await ShadowMemory.getHistory(mockUserId);

            expect(result).toEqual([]);

            // Restore mock
            Object.defineProperty(supabaseClient, 'supabase', { value: { from: vi.fn() }, configurable: true });
        });

        it('should successfully retrieve history with default limit', async () => {
            const mockData = [
                { id: 1, user_id: mockUserId, entropy_score: 50 },
                { id: 2, user_id: mockUserId, entropy_score: 60 }
            ];

            const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ select: mockSelect } as any);

            const result = await ShadowMemory.getHistory(mockUserId);

            expect(supabaseClient.supabase!.from).toHaveBeenCalledWith('shadow_snapshots');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
            expect(mockOrder).toHaveBeenCalledWith('timestamp', { ascending: false });
            expect(mockLimit).toHaveBeenCalledWith(30); // default limit

            expect(result).toEqual(mockData);
        });

        it('should successfully retrieve history with custom limit', async () => {
            const mockData = [
                { id: 1, user_id: mockUserId, entropy_score: 50 }
            ];

            const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ select: mockSelect } as any);

            const result = await ShadowMemory.getHistory(mockUserId, 10);

            expect(mockLimit).toHaveBeenCalledWith(10);
            expect(result).toEqual(mockData);
        });

        it('should return empty array on database error', async () => {
            const mockError = new Error('Database error');
            const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            vi.mocked(supabaseClient.supabase!.from).mockReturnValue({ select: mockSelect } as any);

            const result = await ShadowMemory.getHistory(mockUserId);

            expect(result).toEqual([]);
        });
    });
});
