import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentActions } from './runner';
import { useMapState } from '../state/mapState';

vi.mock('../state/mapState', () => ({
  useMapState: {
    getState: vi.fn(),
  },
}));

describe('Runner logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logSituation', () => {
    it('should return error when addSituationLog throws', async () => {
      const mockDeps = {
        resolvePerson: vi.fn().mockReturnValue('node-1'),
        onNavigateBreathing: vi.fn(),
        onNavigateGym: vi.fn(),
        onNavigateMap: vi.fn(),
        onNavigateBaseline: vi.fn(),
        onNavigatePerson: vi.fn(),
        availableFeatures: { dawayir_map: true, basic_diagnosis: true } as any,
      };

      const mockAddSituationLog = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      vi.mocked(useMapState.getState).mockReturnValue({
        addSituationLog: mockAddSituationLog,
      } as any);

      const actions = createAgentActions(mockDeps);
      const result = await actions.logSituation('Person A', 'Test', 'Sad');

      expect(result).toEqual({ ok: false, error: 'Database error' });
    });

    it('should return error string when non-Error is thrown', async () => {
      const mockDeps = {
        resolvePerson: vi.fn().mockReturnValue('node-1'),
        onNavigateBreathing: vi.fn(),
        onNavigateGym: vi.fn(),
        onNavigateMap: vi.fn(),
        onNavigateBaseline: vi.fn(),
        onNavigatePerson: vi.fn(),
        availableFeatures: { dawayir_map: true, basic_diagnosis: true } as any,
      };

      const mockAddSituationLog = vi.fn().mockImplementation(() => {
        throw 'String error';
      });

      vi.mocked(useMapState.getState).mockReturnValue({
        addSituationLog: mockAddSituationLog,
      } as any);

      const actions = createAgentActions(mockDeps);
      const result = await actions.logSituation('Person A', 'Test', 'Sad');

      expect(result).toEqual({ ok: false, error: 'String error' });
    });
  });
});
