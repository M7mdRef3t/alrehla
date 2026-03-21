import { useEffect } from "react";
import type { OwnerActionExecutionContext } from "../../navigation/ownerActionExecutor";
import { executeOwnerAction } from "../../navigation/ownerActionExecutor";
import { normalizeOwnerAction } from "../../navigation/actionRoutingMachine";
import { createCurrentUrl, replaceUrl } from "../../services/navigation";

interface UseOwnerActionOrchestrationParams {
  isAdminRoute: boolean;
  skipNextPulseCheck: () => void;
  context: OwnerActionExecutionContext;
}

export function useOwnerActionOrchestration({
  isAdminRoute,
  skipNextPulseCheck,
  context
}: UseOwnerActionOrchestrationParams) {
  useEffect(() => {
    if (isAdminRoute) return;
    const currentUrl = createCurrentUrl();
    if (!currentUrl) return;

    const ownerAction = normalizeOwnerAction(currentUrl.searchParams.get("ownerAction"));
    if (!ownerAction) return;

    const clearOwnerActionParam = () => {
      const next = createCurrentUrl();
      if (!next) return;
      next.searchParams.delete("ownerAction");
      replaceUrl(next);
    };

    skipNextPulseCheck();
    executeOwnerAction(ownerAction, context);
    clearOwnerActionParam();
  }, [context, isAdminRoute, skipNextPulseCheck]);
}
