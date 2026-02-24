import nextStepHandler from "../../server/recommendations/next-step.js";
import outcomeHandler from "../../server/recommendations/outcome.js";

const HANDLERS: Record<string, (req: any, res: any) => Promise<void>> = {
  "next-step": nextStepHandler,
  outcome: outcomeHandler
};

export default async function handler(req: any, res: any) {
  const action = typeof req.query?.action === "string" ? req.query.action : "";
  const route = HANDLERS[action];
  if (!route) {
    res.status(404).json({ error: "Unknown recommendations action" });
    return;
  }
  await route(req, res);
}
