import { calculateEntropy } from "@/services/predictiveEngine";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { useToastState } from '@/modules/map/dawayirIndex';
import { useBlindCapsuleState } from "@/domains/journey/store/blindCapsule.store";
import { useLockdownState } from "@/domains/admin/store/lockdown.store";

export async function checkSovereignOverride(): Promise<void> {
    try {
        const evaluation = calculateEntropy();
        
        // Ultimate Threshold for Lockdown = 88
        if (evaluation.entropyScore >= 88) {
           useLockdownState.getState().triggerLockdown();
           return;
        }
        
        // Critical Threshold for Override = 80
        if (evaluation.entropyScore >= 80) {
            await new Promise(r => setTimeout(r, 1000));
            
            // Check if we have an unsealed blind capsule for extreme entropy (> 85)
            const sealedCapsules = useBlindCapsuleState.getState().getSealedCapsules();
            
            if (evaluation.entropyScore >= 85 && sealedCapsules.length > 0) {
               useAppOverlayState.getState().openOverlay("blindCapsuleOpener");
               return; // Exit here, let the capsule do the talking
            }
            
            useToastState.getState().showToast(
                "تم تفعيل الحماية الاستباقية. تم رصد إرهاق حاد، توجه للتعافي فوراً.",
                "error"
            );
            
            useAppOverlayState.getState().openOverlay("recoveryPathways");
        }
    } catch (e) {
        console.warn("Sovereign check failed:", e);
    }
}
