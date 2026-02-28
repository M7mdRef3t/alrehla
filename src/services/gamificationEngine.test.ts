import { describe, it, expect } from 'vitest';
import { getDailyQuests } from './gamificationEngine';

describe('gamificationEngine', () => {
    describe('getDailyQuests', () => {
        it('should return 3 daily quests by default', () => {
            const quests = getDailyQuests();
            expect(quests).toHaveLength(3);
            expect(quests[0].id).toBe('dq_checkin');
            expect(quests[1].id).toBe('dq_map_share');
            expect(quests[2].id).toBe('dq_wisdom');

            // All should be incomplete by default
            expect(quests.every(q => !q.isCompleted)).toBe(true);
        });

        it('should mark specific quests as completed based on provided keys', () => {
            const completedKeys = ['dq_checkin', 'dq_wisdom'];
            const quests = getDailyQuests(completedKeys);

            expect(quests).toHaveLength(3);

            const checkinQuest = quests.find(q => q.id === 'dq_checkin');
            expect(checkinQuest?.isCompleted).toBe(true);

            const mapShareQuest = quests.find(q => q.id === 'dq_map_share');
            expect(mapShareQuest?.isCompleted).toBe(false);

            const wisdomQuest = quests.find(q => q.id === 'dq_wisdom');
            expect(wisdomQuest?.isCompleted).toBe(true);
        });

        it('should handle unknown keys without marking any quests as completed', () => {
            const quests = getDailyQuests(['unknown_key']);

            expect(quests).toHaveLength(3);
            expect(quests.every(q => !q.isCompleted)).toBe(true);
        });

        it('should mark all quests as completed if all keys are provided', () => {
            const quests = getDailyQuests(['dq_checkin', 'dq_map_share', 'dq_wisdom']);

            expect(quests).toHaveLength(3);
            expect(quests.every(q => q.isCompleted)).toBe(true);
        });
    });
});
