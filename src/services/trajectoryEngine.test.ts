import { describe, it, expect } from 'vitest';
import { TrajectoryEngine, AwarenessVector } from './trajectoryEngine';

describe('TrajectoryEngine.calculateEvolution', () => {
    // Helper to create a basic AwarenessVector
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

        // Baseline should remain 0
        expect(result.baseline).toEqual({ rs: 0, av: 0, bi: 0, se: 0, cb: 0 });

        // Delta is (currentFinal - baseline) * 100
        expect(result.delta).toEqual({
            rs: 100,
            av: 200,
            bi: 300,
            se: 400
        });

        // cb is 0.5 >= 0.4, delta.av is 200 >= 5
        expect(result.nextFocus).toBe('bi');
        expect(result.logic).toBe("Symmetry achieved. Refocusing on long-term Behavioral Integrity.");
    });

    it('handles history with fewer than 5 items', () => {
        const currentFinal = createVector({ av: 0.1, cb: 0.5 });
        const history = [
            createVector({ av: 0.1 }), // Index 0 -> slice(-5)[0] -> reverse()[1] -> weight 4
            createVector({ av: 0.2 }), // Index 1 -> slice(-5)[1] -> reverse()[0] -> weight 5
        ];

        const result = TrajectoryEngine.calculateEvolution(currentFinal, history);

        // totalWeight = 4 + 5 = 9
        // baseline.av = (0.2 * 5 + 0.1 * 4) / 9 = 1.4 / 9 ≈ 0.1555
        expect(result.baseline.av).toBeCloseTo(0.1555, 3);

        // delta.av = Math.round((0.1 - 0.1555) * 100) = -6
        expect(result.delta.av).toBe(-6);

        // delta.av < 5
        expect(result.nextFocus).toBe('av');
    });

    it('handles history with more than 5 items, using only the last 5', () => {
        const currentFinal = createVector({ av: 1, cb: 0.8 });

        // Items 0 and 1 should be ignored.
        const history = [
            createVector({ av: 100 }), // Ignored
            createVector({ av: 100 }), // Ignored
            createVector({ av: 2 }),   // weight 1
            createVector({ av: 2 }),   // weight 2
            createVector({ av: 2 }),   // weight 3
            createVector({ av: 2 }),   // weight 4
            createVector({ av: 2 }),   // weight 5
        ];

        const result = TrajectoryEngine.calculateEvolution(currentFinal, history);

        // All used history vectors have av: 2, so baseline.av should be 2.
        expect(result.baseline.av).toBe(2);

        // delta.av = Math.round((1 - 2) * 100) = -100
        expect(result.delta.av).toBe(-100);
        expect(result.nextFocus).toBe('av');
    });

    describe('nextFocus logic', () => {
        it('focuses on SE when cb < 0.4', () => {
            const currentFinal = createVector({ cb: 0.39, av: 100 });
            // Even if av is high, cb < 0.4 takes precedence
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('se');
            expect(result.logic).toContain('Bandwidth critical');
        });

        it('focuses on AV when cb >= 0.4 and delta.av < 5', () => {
            const currentFinal = createVector({ cb: 0.4, av: 0.04 });
            // empty history means baseline.av is 0.
            // delta.av = Math.round(0.04 * 100) = 4, which is < 5
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('av');
            expect(result.logic).toContain('Agency stagnation');
        });

        it('focuses on BI when cb >= 0.4 and delta.av >= 5', () => {
            const currentFinal = createVector({ cb: 0.4, av: 0.05 });
            // delta.av = Math.round(0.05 * 100) = 5, which is >= 5
            const result = TrajectoryEngine.calculateEvolution(currentFinal, []);
            expect(result.nextFocus).toBe('bi');
            expect(result.logic).toContain('Symmetry achieved');
        });
    });
});
