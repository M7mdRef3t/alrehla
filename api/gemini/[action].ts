import generateHandler from "../../server/gemini/generate.js";
import streamHandler from "../../server/gemini/stream.js";
import toolHandler from "../../server/gemini/tool.js";

const HANDLERS: Record<string, (req: any, res: any) => Promise<void>> = {
  generate: generateHandler,
  stream: streamHandler,
  tool: toolHandler
};

export default async function handler(req: any, res: any) {
  const action = typeof req.query?.action === "string" ? req.query.action : "";
  const route = HANDLERS[action];
  if (!route) {
    res.status(404).json({ error: "Unknown gemini action" });
    return;
  }
  await route(req, res);
}
