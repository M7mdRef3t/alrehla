export const A2AHub = {
  async discoverAgents(capability?: string) {
    return {
      agents: [],
      capability: capability ?? null,
      status: "unconfigured",
    };
  },

  async sendMessage(fromAgentId: string, targetAgentId: string, payload: unknown) {
    return {
      ok: false,
      fromAgentId,
      targetAgentId,
      payload,
      status: "unconfigured",
    };
  },
};
