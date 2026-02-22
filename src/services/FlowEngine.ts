import { useFlowState } from '../state/flowState';
import { useGrowthState } from '../state/growthState';

/**
 * 🌊 FLOW ENGINE
 * Controls the "Sensory Hijack" and "Dynamic Difficulty" logic.
 */
export class FlowEngine {
    private static interactionCounter = 0;
    private static intervalId: number | null = null;

    public static startMonitoring() {
        if (this.intervalId) return;

        this.intervalId = window.setInterval(() => {
            this.processFlowTick();
        }, 2000) as unknown as number;

        // Track global mouse moves and key presses
        window.addEventListener('mousemove', this.recordInteraction);
        window.addEventListener('keydown', this.recordInteraction);
    }

    public static stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        window.removeEventListener('mousemove', this.recordInteraction);
        window.removeEventListener('keydown', this.recordInteraction);
    }

    private static recordInteraction = () => {
        this.interactionCounter++;
        useFlowState.getState().recordInteraction();
    };

    private static processFlowTick() {
        const { focusScore, setFocusScore, setInteractionRate } = useFlowState.getState();
        const { isOverclocking } = useGrowthState.getState();

        // Calculate rate (events per tick window)
        const rate = this.interactionCounter;
        setInteractionRate(rate * 30); // Approximate events per minute
        this.interactionCounter = 0;

        if (!isOverclocking) {
            setFocusScore(1.0); // Reset if not overclocking
            return;
        }

        // 🧠 SENSORY HIJACK LOGIC
        // If rate is 0, focus drops fast. If rate is high, focus restores.
        let newScore = focusScore;
        if (rate === 0) {
            newScore -= 0.05; // Drop 5% every 2s of inactivity
        } else {
            newScore += 0.02; // Restore 2% per tick of activity
        }

        setFocusScore(newScore);

        // 🎯 DYNAMIC DIFFICULTY: Trigger Micro-deadline if focus is slipping
        if (newScore < 0.7 && !useFlowState.getState().activeMicroDeadline) {
            this.triggerEmergencyTask();
        }
    }

    private static triggerEmergencyTask() {
        const tasks = [
            "أنجز المهمة الحالية في 3 دقائق فوراً!",
            "ركز عيونك على الهدف.. فاضل تكة!",
            "تجاهل أي تشتيت.. الثانية بتفرق!"
        ];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

        useFlowState.getState().setMicroDeadline({
            id: Math.random().toString(36).substr(2, 9),
            target: randomTask,
            durationMs: 180000 // 3 minutes
        });
    }
}
