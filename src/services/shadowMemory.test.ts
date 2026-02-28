import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShadowMemory } from './shadowMemory';
import { supabase } from './supabaseClient';
import { calculateEntropy } from './predictiveEngine';
import { DispatcherEngine } from './dispatcherEngine';

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./predictiveEngine', () => ({
  calculateEntropy: vi.fn(),
}));

vi.mock('./dispatcherEngine', () => ({
  DispatcherEngine: {
    checkAndDispatch: vi.fn(),
  },
}));

describe('ShadowMemory', () => {
  const mockUserId = 'user-123';
  const mockInsight = {
    entropyScore: 75,
    state: 'CHAOS' as const,
    primaryFactor: 'relational_pressure',
    unstableNodes: 2,
    pulseVolatility: 1.5,
    lowEnergyRatio: 0.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordSnapshot', () => {
    it('should record a snapshot and call DispatcherEngine', async () => {
      vi.mocked(calculateEntropy).mockReturnValue(mockInsight);

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase!.from).mockReturnValue({ insert: insertMock } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await ShadowMemory.recordSnapshot(mockUserId);

      expect(calculateEntropy).toHaveBeenCalled();
      expect(supabase!.from).toHaveBeenCalledWith('shadow_snapshots');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          entropy_score: mockInsight.entropyScore,
          state: mockInsight.state,
          primary_factor: mockInsight.primaryFactor,
          timestamp: expect.any(String),
        })
      );
      expect(DispatcherEngine.checkAndDispatch).toHaveBeenCalledWith(mockUserId, mockInsight);
      expect(consoleWarnSpy).toHaveBeenCalledWith("🌘 Shadow Snapshot recorded for user:", mockUserId);

      consoleWarnSpy.mockRestore();
    });

    it('should log an error if insertion fails', async () => {
      vi.mocked(calculateEntropy).mockReturnValue(mockInsight);

      const mockError = new Error('Insert failed');
      const insertMock = vi.fn().mockResolvedValue({ error: mockError });
      vi.mocked(supabase!.from).mockReturnValue({ insert: insertMock } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await ShadowMemory.recordSnapshot(mockUserId);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to record Shadow Memory:', mockError);
      expect(DispatcherEngine.checkAndDispatch).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getHistory', () => {
    it('should return history data', async () => {
      const mockData = [{ id: 1, user_id: mockUserId }];

      const limitMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase!.from).mockReturnValue({ select: selectMock } as any);

      const result = await ShadowMemory.getHistory(mockUserId, 10);

      expect(supabase!.from).toHaveBeenCalledWith('shadow_snapshots');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUserId);
      expect(orderMock).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockData);
    });

    it('should return default limit 30 when not provided', async () => {
      const mockData = [{ id: 1, user_id: mockUserId }];

      const limitMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase!.from).mockReturnValue({ select: selectMock } as any);

      await ShadowMemory.getHistory(mockUserId);

      expect(limitMock).toHaveBeenCalledWith(30);
    });

    it('should return empty array if there is an error', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: null, error: new Error('Select failed') });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase!.from).mockReturnValue({ select: selectMock } as any);

      const result = await ShadowMemory.getHistory(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
