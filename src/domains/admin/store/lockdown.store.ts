import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LockdownState {
  isLockedDown: boolean;
  lockdownUntil: number | null;
  triggerLockdown: () => void;
  liftLockdown: () => void;
  checkLockdownStatus: () => boolean;
}

export const useLockdownState = create<LockdownState>()(
  persist(
    (set, get) => ({
      isLockedDown: false,
      lockdownUntil: null,
      
      triggerLockdown: () => {
         // 24 hours lock
         const duration = 24 * 60 * 60 * 1000;
         set({
            isLockedDown: true,
            lockdownUntil: Date.now() + duration
         });
      },
      
      liftLockdown: () => {
         set({
            isLockedDown: false,
            lockdownUntil: null
         });
      },
      
      checkLockdownStatus: () => {
         const { isLockedDown, lockdownUntil, liftLockdown } = get();
         
         if (!isLockedDown) return false;
         
         // If time passed, lift it
         if (lockdownUntil && Date.now() > lockdownUntil) {
            liftLockdown();
            return false;
         }
         
         return true;
      }
    }),
    {
      name: "dawayir-lockdown-protocol",
      version: 1,
    }
  )
);
