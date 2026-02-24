import interventionTriggerHandler from "../../server/routing/intervention-trigger.js";
import nextStepV2Handler from "../../server/routing/next-step-v2.js";
import outcomeV2Handler from "../../server/routing/outcome-v2.js";

const HANDLERS: Record<string, (req: any, res: any) => Promise<void>> = {
  "intervention-trigger": interventionTriggerHandler,
  "next-step-v2": nextStepV2Handler,
  "outcome-v2": outcomeV2Handler
};

export default async function handler(req: any, res: any) {
  const action = typeof req.query?.action === "string" ? req.query.action : "";
  const route = HANDLERS[action];
  if (!route) {
    res.status(404).json({ error: "Unknown routing action" });
    return;
  }
  await route(req, res);
}
