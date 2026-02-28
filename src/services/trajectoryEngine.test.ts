import { describe, it, expect } from 'vitest';
import { TrajectoryEngine, AwarenessVector } from './trajectoryEngine';

describe('TrajectoryEngine.calculateEvolution', () => {
    const createVector = (overrides: Partial<AwarenessVector> = {}): AwarenessVector => ({
        rs: 0,
        av: 0,
        bi: 0,
        se: 0,
        cb: 0,
        timestamp: Date.now(),
        ...overrides,
    });

    it('handles empty history', () => {
        const currentFinal = createVector({ rs: 1, av: 2, bi: 3, se: 4, cb: 0.5 });
        const history: AwarenessVector[] = [];

        const result = TrajectoryEngine.calculateEvolution(currentFinal, history);

        expect(result.baseline).toEqual({ rs: 0, av: 0, bi: 0, se: 0, cb: 0 });

        expect(result.delta).toEqual({
            rs: 100,
            av: 200,
            bi: 300,
            se: 400
        });

        expect(result.nextFocus).toBe('bi');
        expect(result.logic).toBe("Symmetry achieved. Refocusing on long-term Behavioral Integrity.");
    });

    it('handles history with fewer than 5 items', () => {
        const currentFinal = createVector({ av: 0.1, cb: 0.5 });
        const history = [
            createVector({ av: 0.1 }),
            createVector({ av: 0.2 }),
        ];

        const result = TrajectoryEngine.calculateEvolution(currentFinal, history);

        expect(result.baseline.av).toBeCloseTo(0.1555, 3);

        expect(result.delta.av).toBe(-6);

        expect(result.nextFocus).toBe('av');
    });

    it('handles history with more than 5 items, using only the last 5', () => {
        const currentFinal = createVector({ av: 1, cb: 0.8 });

        const history = [
            createVector({ av: 100 }),
            createVector({ av: 100 }),
            createVector({ av: 2 }),
            createVector({ av: 2 }),
            createVector({ av: 2 }),
            createVector({ av: 2 }),
            createVector({ av: 2 }),
        ];

        const result = TrajectoryEngine.calculateEvolution(currentFinal, history);

        expect(result.baseline.av).toBe(2);

        expect(result.delta.av).toBe(-100);
        expect(result.nextFocus).toBe('av');
    });

    describe('nextFocus logic', () => {
        it('focuses on SE when cb < 0.4', () => {
            const currentFinal = createVector({ cb: 0.39, av: 100 });
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('se');
            expect(result.logic).toContain('Bandwidth critical');
        });

        it('focuses on AV when cb >= 0.4 and delta.av < 5', () => {
            const currentFinal = createVector({ cb: 0.4, av: 0.04 });
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('av');
            expect(result.logic).toContain('Agency stagnation');
        });

        it('focuses on BI when cb >= 0.4 and delta.av >= 5', () => {
            const currentFinal = createVector({ cb: 0.4, av: 0.05 });
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('bi');
            expect(result.logic).toContain('Symmetry achieved');
        });
    });
});
